const mongoose = require('mongoose');
const { STATUS_VALUES } = require('./Shipment');

const trackingEventSchema = new mongoose.Schema({
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  status: { type: String, enum: STATUS_VALUES, required: true },
  location: {
    city: String,
    state: String,
    country: String,
    lat: Number,
    lng: Number,
  },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, required: true },
  source: { type: String, enum: ['manual', 'automated', 'system'], default: 'manual' },
  createdBy: { type: String, default: null }, // Neon user UUID; null if automated
  isVisibleToCustomer: { type: Boolean, default: true },
  attachments: [{ type: String }],
}, { timestamps: { createdAt: true, updatedAt: false } });

trackingEventSchema.index({ shipment: 1, timestamp: 1 });

module.exports = mongoose.model('TrackingEvent', trackingEventSchema);