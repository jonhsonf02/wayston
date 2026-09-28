const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  createShipment, listShipments, getShipmentDetail,
  updateShipment, deleteShipment, toggleAutomation, resendLink,
} = require('../controllers/shipment.controller');
const { pushManualEvent, editEvent, deleteEvent } = require('../controllers/trackingEvent.controller');
const { listAuditLog } = require('../controllers/auditLog.controller');

router.use(authenticate);

const staffRoles = ['superadmin', 'admin', 'support'];
const managerRoles = ['superadmin', 'admin']; // support can push updates but not delete/edit

router.post('/shipments', requireRole(...staffRoles), createShipment);
router.get('/shipments', requireRole(...staffRoles), listShipments);
router.get('/shipments/:id', requireRole(...staffRoles), getShipmentDetail);
router.patch('/shipments/:id', requireRole(...managerRoles), updateShipment);
router.delete('/shipments/:id', requireRole('superadmin'), deleteShipment);
router.patch('/shipments/:id/toggle-automation', requireRole(...managerRoles), toggleAutomation);
router.post('/shipments/:id/resend-link', requireRole(...staffRoles), resendLink);

router.post('/shipments/:id/events', requireRole(...staffRoles), pushManualEvent);
router.patch('/events/:eventId', requireRole(...managerRoles), editEvent);
router.delete('/events/:eventId', requireRole('superadmin'), deleteEvent);

router.get('/audit-log', requireRole('superadmin'), listAuditLog);

module.exports = router;