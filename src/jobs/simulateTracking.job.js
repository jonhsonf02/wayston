const cron = require('node-cron');
const { Shipment } = require('../models/Shipment');
const TrackingEvent = require('../models/TrackingEvent');
const { sendDeliveredEmail } = require('../services/email.service');

const AUTO_PROGRESSION = [
  'picked_up', 'in_transit', 'arrived_at_facility',
  'departed_facility', 'out_for_delivery', 'delivered',
];

function nextAutoStatus(currentStatus) {
  const idx = AUTO_PROGRESSION.indexOf(currentStatus);
  if (idx === -1) return AUTO_PROGRESSION[0];
  if (idx === AUTO_PROGRESSION.length - 1) return null;
  return AUTO_PROGRESSION[idx + 1];
}

async function tick(io) {
  const activeShipments = await Shipment.find({
    isAutomatedTrackingEnabled: true,
    currentStatus: { $ne: 'delivered' },
    currentStatus: { $nin: ['exception', 'on_hold'] },
  });

  for (const shipment of activeShipments) {
    const next = nextAutoStatus(shipment.currentStatus);
    if (!next) continue;

    const event = await TrackingEvent.create({
      shipment: shipment._id,
      status: next,
      location: { city: shipment.destination.city, country: shipment.destination.country },
      description: `Automated update: package status advanced to "${next.replace(/_/g, ' ')}".`,
      source: 'automated',
      createdBy: null,
    });

    shipment.currentStatus = next;
    if (next === 'delivered') shipment.actualDeliveryDate = new Date();
    await shipment.save();

    if (next === 'delivered') {
      await shipment.populate('recipient');
      try {
        await sendDeliveredEmail(shipment.recipient, shipment);
      } catch (err) {
        console.error('⚠️ Failed to send delivered email:', err.message);
      }
    }

    if (io) io.to(`shipment:${shipment.trackingNumber}`).emit('tracking:update', { event, shipment });

    console.log(`🤖 [automated] ${shipment.trackingNumber} → ${next}`);
  }
}

function startSimulation(io) {
  cron.schedule('*/2 * * * *', () => tick(io));
  console.log('✅ Automated tracking simulation scheduled (every 2 minutes)');
}

module.exports = { startSimulation };