const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  channel: { type: String, enum: ['email', 'sms'], required: true },
  triggerStatus: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  success: { type: Boolean, required: true },
}, { timestamps: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);