const { Shipment } = require('../models/Shipment');
const Recipient = require('../models/Recipient');
const TrackingEvent = require('../models/TrackingEvent');
const generateTrackingNumber = require('../utils/generateTrackingNumber');
const generateSecureToken = require('../utils/generateSecureToken');
const { logAction } = require('../services/auditLog.service');
const { sendTrackingLinkEmail } = require('../services/email.service');

async function createShipment(req, res) {
  const {
    itemType, description, weight, dimensions,
    recipient: recipientData,
    origin, destination,
    estimatedDeliveryDate,
    waypoints = [],
    isAutomatedTrackingEnabled = true,
  } = req.body;

  if (!itemType || !recipientData || !origin || !destination) {
    return res.status(400).json({ error: 'itemType, recipient, origin, and destination are required' });
  }

  const recipient = await Recipient.create(recipientData);

  let trackingNumber, exists;
  do {
    trackingNumber = generateTrackingNumber();
    exists = await Shipment.findOne({ trackingNumber });
  } while (exists);
  const trackingLinkToken = generateSecureToken();

  const shipment = await Shipment.create({
    trackingNumber,
    trackingLinkToken,
    itemType,
    description,
    weight,
    dimensions,
    recipient: recipient._id,
    origin,
    destination,
    estimatedDeliveryDate,
    waypoints,
    isAutomatedTrackingEnabled,
    createdBy: req.user.id,
  });

  await TrackingEvent.create({
    shipment: shipment._id,
    status: 'order_created',
    location: {
      city: origin.city,
      state: origin.state,
      country: origin.country,
      lat: origin.lat,
      lng: origin.lng,
    },
    description: 'Shipment created and label generated.',
    source: 'system',
    createdBy: req.user.id,
  });

  await logAction({
    actorUserId: req.user.id,
    action: 'shipment.create',
    targetType: 'Shipment',
    targetId: shipment._id.toString(),
    details: { trackingNumber },
  });

  try {
    await sendTrackingLinkEmail(recipient, shipment);
  } catch (err) {
    console.error('⚠️ Failed to send tracking link email:', err.message);
  }

  res.status(201).json({ shipment, trackingLink: `/track/${trackingLinkToken}` });
}

async function listShipments(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const shipments = await Shipment.find()
    .populate('recipient')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Shipment.countDocuments();

  res.json({ shipments, total, page, pages: Math.ceil(total / limit) });
}

async function getShipmentDetail(req, res) {
  const shipment = await Shipment.findById(req.params.id).populate('recipient');
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  const events = await TrackingEvent.find({ shipment: shipment._id }).sort({ timestamp: 1 });

  res.json({ shipment, events });
}

async function updateShipment(req, res) {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  const editable = ['description', 'weight', 'dimensions', 'estimatedDeliveryDate', 'destination', 'origin', 'waypoints'];
  const before = {};
  for (const field of editable) {
    if (req.body[field] !== undefined) {
      before[field] = shipment[field];
      shipment[field] = req.body[field];
    }
  }
  await shipment.save();

  await logAction({
    actorUserId: req.user.id,
    action: 'shipment.update',
    targetType: 'Shipment',
    targetId: shipment._id.toString(),
    details: { before, after: req.body },
  });

  res.json({ shipment });
}

async function deleteShipment(req, res) {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  await Shipment.deleteOne({ _id: shipment._id });

  await logAction({
    actorUserId: req.user.id,
    action: 'shipment.delete',
    targetType: 'Shipment',
    targetId: shipment._id.toString(),
    details: { trackingNumber: shipment.trackingNumber },
  });

  res.json({ message: 'Shipment deleted' });
}

async function toggleAutomation(req, res) {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  shipment.isAutomatedTrackingEnabled = !shipment.isAutomatedTrackingEnabled;
  await shipment.save();

  await logAction({
    actorUserId: req.user.id,
    action: 'shipment.toggle_automation',
    targetType: 'Shipment',
    targetId: shipment._id.toString(),
    details: { isAutomatedTrackingEnabled: shipment.isAutomatedTrackingEnabled },
  });

  res.json({ shipment });
}

async function resendLink(req, res) {
  const shipment = await Shipment.findById(req.params.id).populate('recipient');
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  await sendTrackingLinkEmail(shipment.recipient, shipment);

  await logAction({
    actorUserId: req.user.id,
    action: 'shipment.resend_link',
    targetType: 'Shipment',
    targetId: shipment._id.toString(),
    details: { recipientEmail: shipment.recipient.email },
  });

  res.json({ message: 'Tracking link resent', trackingLink: `/track/${shipment.trackingLinkToken}` });
}

module.exports = {
  createShipment, listShipments, getShipmentDetail,
  updateShipment, deleteShipment, toggleAutomation, resendLink,
};