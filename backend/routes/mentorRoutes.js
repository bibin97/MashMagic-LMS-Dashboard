const express = require('express');
const router = express.Router();
const {
    getMentorDashboard,
    getMentorStudents,
    getStudentDetails,
    getMentorTasks,
    completeMentorTask,
    getMentorTimetable,
    completeSession,
    cancelSession,
    postponeSession,
    createStudentLog,
    createFacultyLog,
    getStudentLogs,
    getFacultyLogs,
    toggleStudentConnection,
    completeOnboarding
} = require('../controllers/mentorController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Apply middleware to all routes
router.use(requireAuth);
router.use(requireRole('mentor'));

router.get('/dashboard', getMentorDashboard);
router.get('/students', getMentorStudents);
router.get('/students/:id', getStudentDetails);
router.get('/tasks', getMentorTasks);
router.put('/tasks/:id/complete', completeMentorTask);
router.get('/timetable', getMentorTimetable);
router.put('/timetable/:id/complete', completeSession);
router.put('/timetable/:id/cancel', cancelSession);
router.put('/timetable/:id/postpone', postponeSession);
router.post('/student-log', createStudentLog);
router.post('/faculty-log', createFacultyLog);
// New log retrieval routes
router.get('/student-logs', getStudentLogs);
router.get('/faculty-logs', getFacultyLogs);

// Monitoring
router.put('/students/:studentId/connection', toggleStudentConnection);
router.put('/students/:studentId/onboard', completeOnboarding);

module.exports = router;
