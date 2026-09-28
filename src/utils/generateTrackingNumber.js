// Format: WS-<10 random digits><US> — e.g. WS-4839021756US
function generateTrackingNumber() {
  const digits = Math.floor(1000000000 + Math.random() * 9000000000);
  return `WS-${digits}US`;
}

module.exports = generateTrackingNumber;