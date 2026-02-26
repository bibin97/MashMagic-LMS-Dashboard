const express = require('express');
const router = express.Router();
const {
    registerMentor,
    getDashboardStats,
    getMentorStudents,
    getAllActivities,
    getMentorDetails,
    getMentorActivityDashboard,
    getMentorMonitoringDetails,
    shiftStudent,
    getDailyStudentChecks,
    checkStudentToday,
    uncheckStudent,
    getDailySummary,
    getAllStudents,
    editMentor,
    deleteMentor,
    getMentorInteractionLogs,
    getFacultyIntelligenceLogs,
    getExamAnalytics
} = require('../controllers/mentorHeadController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All routes require mentor_head role
router.use(requireAuth);
router.use(requireRole('mentor_head'));

router.post('/register-mentor', registerMentor);
router.get('/dashboard', getDashboardStats);
router.get('/activities', getAllActivities);
router.get('/mentor/:mentorId/students', getMentorStudents);
router.get('/mentor/:mentorId/details', getMentorDetails);

// Monitoring Architecture Routes
router.get('/mentor-activity', getMentorActivityDashboard);
router.get('/mentors/:mentorId/monitoring', getMentorMonitoringDetails);
router.put('/students/:studentId/shift', shiftStudent);
router.get('/daily-student-checks', getDailyStudentChecks);
router.post('/students/:studentId/check', checkStudentToday);
router.delete('/students/:studentId/uncheck', uncheckStudent);
router.get('/daily-summary', getDailySummary);
router.get('/all-students', getAllStudents);
router.get('/exam-analytics', getExamAnalytics);

// Intelligence Hub Routes
router.get('/mentor-logs', getMentorInteractionLogs);
router.get('/faculty-intelligence', getFacultyIntelligenceLogs);

// Edit & Delete Mentor
router.put('/mentors/:mentorId', editMentor);
router.delete('/mentors/:mentorId', deleteMentor);

module.exports = router;
