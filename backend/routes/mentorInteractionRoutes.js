const express = require('express');
const router = express.Router();
const controller = require('../controllers/mentorInteractionController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/daily-assignments', protect, controller.getDailyAssignments);
router.get('/assignments-by-date', protect, controller.getAssignmentsByDate);
router.post('/submit-report', protect, upload.single('file'), controller.submitSessionReport);
router.get('/high-risk-students', protect, controller.getHighRiskStudents);
router.get('/weekly-coverage', protect, controller.getWeeklyCoverage);
router.post('/toggle-pause', protect, controller.togglePause);

module.exports = router;
