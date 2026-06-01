const express = require('express');
const router = express.Router();
const {
    getDropdownData,
    registerStudent,
    registerFaculty,
    registerSSC,
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
    verifyFacultyLog,
    getExamAnalytics,
    editFaculty,
    deleteFaculty,
    editStudent,
    deleteStudent,
    getStudentById,
    getStudents,
    getMentors,
    editMentor,
    deleteMentor,
    saveExamPlan,
    getLiveMonitoring,
    getAvailableFaculties,
    getStaff,
    syncLegacyData,
    getAcademicSchedule,
    getAHParentInteractions,
    createAHParentInteraction,
    getAHFacultyInteractions,
    createAHFacultyInteraction,
    getAHParentMeetings,
    scheduleAHParentMeeting,
    reportAHParentMeeting
} = require('../controllers/aoeController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All routes require academic_operation_executive role
router.use(requireAuth);
router.use(requireRole('academic_operation_executive', 'super_admin'));

router.get('/dashboard', getDashboardStats);
router.get('/academic-schedule', getAcademicSchedule);
router.get('/exam-analytics', getExamAnalytics);
router.get('/actions', getAcademicActions);
router.get('/faculties', getFacultyDirectory);
router.get('/documents', getAcademicDocuments);
router.post('/documents', uploadAcademicDocument);
router.delete('/documents/:id', deleteAcademicDocument);
router.get('/faculty-activity-logs', getAllFacultyActivity);
router.get('/student-logs', getStudentInteractionLogs);
router.get('/faculty-logs', getFacultyInteractionLogs);
router.get('/faculty-checks', getDailyFacultyChecks);
router.post('/sessions/:sessionId/check', checkFacultySessionToday);
router.delete('/sessions/:sessionId/uncheck', uncheckFacultySession);
router.get('/dropdowns', getDropdownData);
router.get('/available-faculties', getAvailableFaculties);
router.post('/register-student', registerStudent);
router.post('/register-faculty', registerFaculty);
router.post('/register-ssc', registerSSC);

// Checking Section
router.get('/live-class-evaluations', getLiveClassEvaluations);
router.post('/live-class-evaluations', submitLiveClassEvaluation);
router.post('/exams/plan', saveExamPlan);
router.get('/faculty-logs-pending', getPendingFacultyLogs);
router.put('/faculty-logs/:id/verify', verifyFacultyLog);

// New Management Routes
router.get('/students/:id', getStudentById);
router.put('/faculties/:id', editFaculty);
router.delete('/faculties/:id', deleteFaculty);
router.put('/students/:id', editStudent);
router.delete('/students/:id', deleteStudent);

// Management Lists
router.get('/students-all', getStudents);
router.get('/students', getStudents);
router.get('/mentors-all', getMentors);
router.get('/staff', getStaff);
router.get('/live-monitoring', getLiveMonitoring);
router.put('/mentors/:id', editMentor);
router.delete('/mentors/:id', deleteMentor);
router.post('/sync-legacy-data', syncLegacyData);

// Interactions & Meetings
router.get('/parent-interactions', getAHParentInteractions);
router.post('/parent-interactions', createAHParentInteraction);
router.get('/faculty-interactions', getAHFacultyInteractions);
router.post('/faculty-interactions', createAHFacultyInteraction);
router.get('/parent-meetings', getAHParentMeetings);
router.post('/parent-meetings', scheduleAHParentMeeting);
router.put('/parent-meetings/:id/report', reportAHParentMeeting);

module.exports = router;
