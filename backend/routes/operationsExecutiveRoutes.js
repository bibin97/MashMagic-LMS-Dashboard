const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const operationsExecutiveController = require('../controllers/operationsExecutiveController');

// All routes require academic_operation_executive role
router.use(requireAuth);
router.use(requireRole('academic_operation_executive', 'super_admin'));

// Academic Quality
router.get('/faculty-quality', operationsExecutiveController.getFacultyQualityChecks);
router.post('/faculty-quality', operationsExecutiveController.addFacultyQualityCheck);

// Parent Meetings
router.get('/parent-meetings', operationsExecutiveController.getParentMeetings);

// Exam Scores
router.get('/exam-scores', operationsExecutiveController.getExamScores);

// Student Growth
router.get('/student-growth', operationsExecutiveController.getStudentGrowth);

// Faculty Replacements
router.get('/faculty-replacements', operationsExecutiveController.getFacultyReplacements);
router.post('/faculty-replacements', operationsExecutiveController.addFacultyReplacement);

// Escalations
router.get('/escalations', operationsExecutiveController.getEscalations);
router.post('/escalations', operationsExecutiveController.addEscalation);

module.exports = router;
