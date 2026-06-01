const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const academicHeadController = require('../controllers/academicHeadController');

// All routes require academic_head role
router.use(requireAuth);
router.use(requireRole('academic_head', 'super_admin'));

// Academic Quality
router.get('/faculty-quality', academicHeadController.getFacultyQualityChecks);
router.post('/faculty-quality', academicHeadController.addFacultyQualityCheck);

// Parent Meetings
router.get('/parent-meetings', academicHeadController.getParentMeetings);

// Exam Scores
router.get('/exam-scores', academicHeadController.getExamScores);

// Student Growth
router.get('/student-growth', academicHeadController.getStudentGrowth);

// Faculty Replacements
router.get('/faculty-replacements', academicHeadController.getFacultyReplacements);
router.post('/faculty-replacements', academicHeadController.addFacultyReplacement);

// Escalations
router.get('/escalations', academicHeadController.getEscalations);
router.post('/escalations', academicHeadController.addEscalation);

module.exports = router;
