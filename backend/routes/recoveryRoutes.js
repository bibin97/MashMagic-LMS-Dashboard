const express = require('express');
const router = express.Router();
const recoveryController = require('../controllers/recoveryController');
const { requireRole, authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(requireRole('super_admin')); // Only super_admin can access the Recovery Center

router.get('/deleted', recoveryController.getDeletedRecords);
router.post('/restore', recoveryController.restoreRecord);
router.get('/audit-logs', recoveryController.getAuditLogs);

module.exports = router;
