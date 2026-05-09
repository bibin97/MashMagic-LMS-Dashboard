const express = require('express');
const router = express.Router();
const {
    getMentorDashboard,
    getMentorStudents,
    getStudentDetails,
    getMentorTasks,
    completeMentorTask,
    getMentorTimetable,
    createSession,
    updateSession,
    deleteSession,
    createStudentLog,
    getStudentLogs,
    toggleStudentConnection,
    completeOnboarding,
    createBatchTimetable,
    getPendingExams,
    getExamHistory,
    submitExamResult,
    logDailyHours,
    getDailyHours,
    getAcademicSchedule,
    getStudentDailyUpdates,
    createMentorshipLog,
    getMentorshipLogs,
    getStudentAcademicSchedule,
    updateStudentAcademicSchedule,
    updateAcademicSessionReminder,
    completeAcademicSession
} = require('../controllers/mentorController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { upload } = require('../config/cloudinary');

// Apply middleware to all routes
router.use(requireAuth);
router.use(requireRole(['mentor', 'ssc']));

router.get('/dashboard', getMentorDashboard);
router.get('/students', getMentorStudents);
router.get('/students/:id', getStudentDetails);
router.get('/students/:id/schedule', getStudentAcademicSchedule);
router.post('/students/:id/schedule', updateStudentAcademicSchedule);
router.get('/tasks', getMentorTasks);
router.put('/tasks/:id/complete', upload.single('proof'), completeMentorTask);
router.get('/timetable', getMentorTimetable);
router.post('/timetable', createSession);
router.put('/timetable/:id', updateSession);
router.delete('/timetable/:id', deleteSession);
router.post('/student-log', createStudentLog);
router.get('/student-logs', getStudentLogs);
router.post('/daily-hours', logDailyHours);
router.get('/daily-hours/:studentId', getDailyHours);
router.get('/students/:studentId/daily-updates', getStudentDailyUpdates);
router.put('/students/:studentId/connection', toggleStudentConnection);
router.put('/students/:studentId/onboard', completeOnboarding);
router.get('/exams/pending', getPendingExams);
router.get('/exams/history', getExamHistory);
router.get('/academic-schedule', getAcademicSchedule);
router.put('/academic-schedule/:id/reminder', updateAcademicSessionReminder);
router.put('/academic-schedule/:id/complete', completeAcademicSession);
router.post('/timetable/batch', createBatchTimetable);
router.post('/exams/submit', submitExamResult);
router.post('/mentorship-log', createMentorshipLog);
router.get('/mentorship-logs/:studentId', getMentorshipLogs);
router.get('/faculties-all', require('../controllers/mentorHeadController').getFaculties);


module.exports = router;
