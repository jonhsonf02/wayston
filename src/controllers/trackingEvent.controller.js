const { Shipment } = require('../models/Shipment');
const TrackingEvent = require('../models/TrackingEvent');
const { logAction } = require('../services/auditLog.service');
const { sendDeliveredEmail } = require('../services/email.service');

async function pushManualEvent(req, res) {
  const { status, location, description, isVisibleToCustomer = true, attachments = [] } = req.body;

  if (!status || !description) {
    return res.status(400).json({ error: 'status and description are required' });
  }

  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  const event = await TrackingEvent.create({
    shipment: shipment._id,
    status,
    location,
    description,
    source: 'manual',
    createdBy: req.user.id,
    isVisibleToCustomer,
    attachments,
  });

  shipment.currentStatus = status;
  if (status === 'delivered') shipment.actualDeliveryDate = new Date();
  await shipment.save();

  await logAction({
    actorUserId: req.user.id,
    action: 'event.create',
    targetType: 'TrackingEvent',
    targetId: event._id.toString(),
    details: { shipmentId: shipment._id.toString(), status, source: 'manual' },
  });

  if (status === 'delivered') {
    await shipment.populate('recipient');
    try {
      await sendDeliveredEmail(shipment.recipient, shipment);
    } catch (err) {
      console.error('⚠️ Failed to send delivered email:', err.message);
    }
  }

  const io = req.app.get('io');
  if (io) io.to(`shipment:${shipment.trackingNumber}`).emit('tracking:update', { event, shipment });

  res.status(201).json({ event, shipment });
}

// PATCH /admin/events/:eventId — only manual events should be editable
async function editEvent(req, res) {
  const event = await TrackingEvent.findById(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.source !== 'manual') {
    return res.status(403).json({ error: 'Only manual events can be edited' });
  }

  const before = { status: event.status, description: event.description, location: event.location };

  if (req.body.status) event.status = req.body.status;
  if (req.body.description) event.description = req.body.description;
  if (req.body.location) event.location = req.body.location;
  await event.save();

  await logAction({
    actorUserId: req.user.id,
    action: 'event.edit',
    targetType: 'TrackingEvent',
    targetId: event._id.toString(),
    details: { before, after: req.body },
  });

  res.json({ event });
}

// DELETE /admin/events/:eventId — only manual events; heavily audit-logged (destructive)
async function deleteEvent(req, res) {
  const event = await TrackingEvent.findById(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.source !== 'manual') {
    return res.status(403).json({ error: 'Only manual events can be deleted' });
  }

  await TrackingEvent.deleteOne({ _id: event._id });

  await logAction({
    actorUserId: req.user.id,
    action: 'event.delete',
    targetType: 'TrackingEvent',
    targetId: event._id.toString(),
    details: { deletedEvent: { status: event.status, description: event.description, shipment: event.shipment.toString() } },
  });

  res.json({ message: 'Event deleted' });
}

module.exports = { pushManualEvent, editEvent, deleteEvent };