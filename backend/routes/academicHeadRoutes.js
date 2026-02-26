const express = require('express');
const router = express.Router();
const {
    getDropdownData,
    registerStudent,
    registerFaculty,
    registerCounselor,
    getDashboardStats,
    getAllFacultyActivity,
    getStudentInteractionLogs,
    getFacultyInteractionLogs,
    getAcademicActions,
    getDailyFacultyChecks,
    checkFacultySessionToday,
    uncheckFacultySession,
    getFacultyDirectory,
    getAcademicDocuments,
    uploadAcademicDocument,
    deleteAcademicDocument,
    getLiveClassEvaluations,
    submitLiveClassEvaluation,
    getPendingFacultyLogs,
    verifyFacultyLog
} = require('../controllers/academicHeadController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All routes require academic_head role
router.use(requireAuth);
router.use(requireRole('academic_head'));

router.get('/dashboard', getDashboardStats);
router.get('/actions', getAcademicActions);
router.get('/faculties', getFacultyDirectory);
router.get('/documents', getAcademicDocuments);
router.post('/documents', uploadAcademicDocument);
router.delete('/documents/:id', deleteAcademicDocument);
router.get('/faculty-activity-logs', getAllFacultyActivity);
router.get('/student-interaction-logs', getStudentInteractionLogs);
router.get('/faculty-interaction-logs', getFacultyInteractionLogs);
router.get('/faculty-checks', getDailyFacultyChecks);
router.post('/sessions/:sessionId/check', checkFacultySessionToday);
router.delete('/sessions/:sessionId/uncheck', uncheckFacultySession);
router.get('/dropdowns', getDropdownData);
router.post('/register-student', registerStudent);
router.post('/register-faculty', registerFaculty);
router.post('/register-counselor', registerCounselor);

// Checking Section
router.get('/live-class-evaluations', getLiveClassEvaluations);
router.post('/live-class-evaluations', submitLiveClassEvaluation);
router.get('/faculty-logs-pending', getPendingFacultyLogs);
router.put('/faculty-logs/:id/verify', verifyFacultyLog);

module.exports = router;
