const express = require('express');
const router = express.Router();
const controller = require('../controllers/mentorInteractionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/daily-assignments', protect, controller.getDailyAssignments);
router.post('/submit-report', protect, controller.submitSessionReport);
router.get('/high-risk-students', protect, controller.getHighRiskStudents);
router.get('/weekly-coverage', protect, controller.getWeeklyCoverage);
router.post('/toggle-pause', protect, controller.togglePause);

module.exports = router;
