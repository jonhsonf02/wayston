const crypto = require('crypto');

// 32 bytes → 64-character hex string, cryptographically random, unguessable
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = generateSecureToken;