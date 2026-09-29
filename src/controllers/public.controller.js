const { Shipment } = require('../models/Shipment');
const TrackingEvent = require('../models/TrackingEvent');
const NotificationLog = require('../models/NotificationLog');

// GET /track/:trackingLinkToken — the main public tracking view
async function getShipmentByToken(req, res) {
  const shipment = await Shipment.findOne({ trackingLinkToken: req.params.trackingLinkToken })
    .populate('recipient');

  if (!shipment) {
    return res.status(404).json({ error: 'Tracking link not found or invalid' });
  }

  const events = await TrackingEvent.find({
    shipment: shipment._id,
    isVisibleToCustomer: true,
  }).sort({ timestamp: -1 });

  res.json({ shipment, events });
}

// GET /track/number/:trackingNumber — lookup by tracking number alone, no name required
async function getShipmentByNumber(req, res) {
  const shipment = await Shipment.findOne({ trackingNumber: req.params.trackingNumber })
    .populate('recipient');

  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }

  const events = await TrackingEvent.find({
    shipment: shipment._id,
    isVisibleToCustomer: true,
  }).sort({ timestamp: -1 });

  res.json({ shipment, events });
}

// POST /track/:trackingLinkToken/subscribe — opt-in to notifications
async function subscribeToUpdates(req, res) {
  const { channel, contact } = req.body;

  if (!channel || !contact || !['email', 'sms'].includes(channel)) {
    return res.status(400).json({ error: 'channel ("email" or "sms") and contact are required' });
  }

  const shipment = await Shipment.findOne({ trackingLinkToken: req.params.trackingLinkToken });
  if (!shipment) {
    return res.status(404).json({ error: 'Tracking link not found' });
  }

  if (channel === 'email') shipment.recipient.email = contact;
  if (channel === 'sms') shipment.recipient.phone = contact;

  await NotificationLog.create({
    shipment: shipment._id,
    channel,
    triggerStatus: shipment.currentStatus,
    sentAt: new Date(),
    success: true,
  });

  res.json({ message: `Subscribed to ${channel} updates for this shipment.` });
}

module.exports = { getShipmentByToken, getShipmentByNumber, subscribeToUpdates };