const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  getShipmentByToken,
  getShipmentByNumber,
  subscribeToUpdates,
} = require('../controllers/public.controller');

// Rate limit: prevents tracking-number enumeration attacks, per your spec's security checklist
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP per window
  message: { error: 'Too many requests — please try again later.' },
});

router.use(publicLimiter);

router.get('/:trackingLinkToken', getShipmentByToken);
router.get('/number/:trackingNumber', getShipmentByNumber);
router.post('/:trackingLinkToken/subscribe', subscribeToUpdates);

module.exports = router;