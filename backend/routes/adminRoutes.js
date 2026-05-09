const express = require('express');
const router = express.Router();
const {
    getAdminDashboardSummary,
    getUsers,
    getUserById,
    approveUser,
    blockUser,
    deleteUser,
    getAllStudentLogs,
    getAllFacultyLogs,
    getPendingUsers,
    rejectUser,
    getDailyMentorHeadReport,
    getAdminNotifications,
    markNotificationRead,
    deleteNotification,
    clearAllNotifications,
    getAllStudentsForAdmin,
    getAllMentorsForAdmin,
    getAllFacultiesForAdmin,
    getStaffMembers,
    getSubAdmins,
    createSubAdmin,
    updateSubAdmin,
    deleteSubAdmin,
    updateStudentForAdmin,
    updateUserForAdmin,
    getExamAnalytics,
    getMentorDistribution,
    getTaskAnalytics,
    getLiveMonitoring
} = require('../controllers/adminController');
const { getDailyHours } = require('../controllers/mentorController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(requireAuth);

// General view access for admin and super_admin
router.get('/dashboard-summary', requireRole('super_admin', 'sub_admin'), getAdminDashboardSummary);
router.get('/pending-users', requireRole('super_admin', 'sub_admin'), getPendingUsers);
router.get('/users', requireRole('super_admin', 'sub_admin'), getUsers);
router.get('/students', requireRole('super_admin', 'sub_admin'), getAllStudentsForAdmin);
router.get('/mentors', requireRole('super_admin', 'sub_admin'), getAllMentorsForAdmin);
router.get('/faculties', requireRole('super_admin', 'sub_admin'), getAllFacultiesForAdmin);
router.get('/staff', requireRole('super_admin', 'sub_admin'), getStaffMembers);
router.get('/users/:id', requireRole('super_admin', 'sub_admin'), getUserById);
router.get('/student-logs', requireRole('super_admin', 'sub_admin'), getAllStudentLogs);
router.get('/faculty-logs', requireRole('super_admin', 'sub_admin'), getAllFacultyLogs);
router.get('/mentor-head-report', requireRole('super_admin', 'sub_admin'), getDailyMentorHeadReport);
router.get('/exam-analytics', requireRole('super_admin', 'sub_admin'), getExamAnalytics);
router.get('/mentor-distribution', requireRole('super_admin', 'sub_admin'), getMentorDistribution);
router.get('/task-analytics', requireRole('super_admin', 'sub_admin'), getTaskAnalytics);
router.get('/live-monitoring', requireRole('super_admin', 'sub_admin'), getLiveMonitoring);

// Management & Action routes
router.put('/reject/:id', requireRole('super_admin', 'sub_admin'), rejectUser);
router.put('/approve/:id', requireRole('super_admin', 'sub_admin'), approveUser);
router.put('/block/:id', requireRole('super_admin', 'sub_admin'), blockUser);
router.put('/users/:id', requireRole('super_admin', 'sub_admin'), updateUserForAdmin);
router.put('/students/:id', requireRole('super_admin', 'sub_admin'), updateStudentForAdmin);

// Notifications (Super Admin, Sub Admin & Mentor Head)
router.get('/notifications', requireRole('super_admin', 'sub_admin', 'mentor_head'), getAdminNotifications);
router.put('/notifications/:id/read', requireRole('super_admin', 'sub_admin', 'mentor_head'), markNotificationRead);
router.delete('/notifications/:id', requireRole('super_admin', 'sub_admin', 'mentor_head'), deleteNotification);
router.delete('/notifications/clear-all', requireRole('super_admin', 'sub_admin', 'mentor_head'), clearAllNotifications);

// Super Admin ONLY actions
router.use(requireRole('super_admin'));
router.delete('/delete/:id', deleteUser);

// Sub Admin management
router.get('/sub-admins', getSubAdmins);
router.post('/sub-admins', createSubAdmin);
router.put('/sub-admins/:id', updateSubAdmin);
router.delete('/sub-admins/:id', deleteSubAdmin);

// Log Routes
router.get('/student-logs-full', getAllStudentLogs);
router.get('/faculty-logs-full', getAllFacultyLogs);
router.get('/daily-hours/:studentId', getDailyHours);

module.exports = router;
