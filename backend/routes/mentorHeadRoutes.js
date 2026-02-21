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
    getDailySummary,
    getAllStudents,
    editMentor,
    deleteMentor
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
router.get('/daily-summary', getDailySummary);
router.get('/all-students', getAllStudents);

// Edit & Delete Mentor
router.put('/mentors/:mentorId', editMentor);
router.delete('/mentors/:mentorId', deleteMentor);

module.exports = router;
