const express = require('express');
const router = express.Router();
const controller = require('../controllers/mentorInteractionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/daily-assignments', protect, controller.getDailyAssignments);
router.post('/submit-report', protect, controller.submitSessionReport);

module.exports = router;
