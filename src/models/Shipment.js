const mongoose = require('mongoose');

const STATUS_VALUES = [
  'order_created',
  'picked_up',
  'in_transit',
  'arrived_at_facility',
  'departed_facility',
  'out_for_delivery',
  'delivery_attempted',
  'delivered',
  'exception',
  'on_hold',
];

const shipmentSchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true, unique: true },
  trackingLinkToken: { type: String, required: true, unique: true },

  itemType: {
    type: String,
    enum: ['package', 'card', 'atm_card', 'document', 'money', 'other'],
    required: true,
  },
  description: { type: String },
  weight: { type: Number },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },

  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient', required: true },

  origin: {
    street: String, city: String, state: String, zip: String, country: String,
    lat: Number, lng: Number,
  },
  destination: {
    street: String, city: String, state: String, zip: String, country: String,
    lat: Number, lng: Number,
  },

  // Planned stopovers the admin sets when creating/editing the shipment.
  // Shown to the client as the planned route, separate from actual TrackingEvents.
  waypoints: [{
    label: String,       // e.g. "Regional Hub", "Customs Clearance"
    city: String,
    state: String,
    country: String,
  }],

  currentStatus: { type: String, enum: STATUS_VALUES, default: 'order_created' },

  estimatedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date },

  trackingMode: { type: String, enum: ['manual', 'automated', 'hybrid'], default: 'hybrid' },
  isAutomatedTrackingEnabled: { type: Boolean, default: true },
  carrierIntegration: {
    provider: String,
    externalTrackingId: String,
  },

  createdBy: { type: String },
}, { timestamps: true });

module.exports = { Shipment: mongoose.model('Shipment', shipmentSchema), STATUS_VALUES };