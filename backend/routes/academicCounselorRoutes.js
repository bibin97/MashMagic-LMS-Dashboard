const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/academicCounselorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes here are protected and restricted to academic_counsellor
router.use(protect);
router.use(authorize('academic_counsellor'));

router.get('/dashboard', getDashboardStats);

module.exports = router;
