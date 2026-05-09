const express = require('express');
const router = express.Router();
const { getDashboardStats, getStudentsTrack } = require('../controllers/sscController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(requireAuth);
router.use(requireRole('ssc'));

router.get('/dashboard', getDashboardStats);
router.get('/students', getStudentsTrack);

module.exports = router;
