const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getDailyHours } = require('../controllers/mentorController');
const { getDailyUpdates } = require('../controllers/sscController');
const { getFees, saveFee } = require('../controllers/feeController');
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
    getFacultyDetailsForAdmin,
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
    getLiveMonitoring,
    getStudentPortalLogins,
    getStudentExamsForAdmin,
    getAcademicSchedule,
    addStudentInstallment,
    getStudentDetailsForAdmin,
    getAHParentInteractions,
    getAHFacultyInteractions,
    getAHParentMeetings
} = require('../controllers/adminController');

router.use(requireAuth);

router.get('/student-portal-logins', requireRole('super_admin', 'sub_admin'), getStudentPortalLogins);
router.get('/academic-schedule', requireRole('super_admin', 'sub_admin'), getAcademicSchedule);

// General view access for admin and super_admin
router.get('/dashboard-summary', requireRole('super_admin', 'sub_admin'), getAdminDashboardSummary);
router.get('/pending-users', requireRole('super_admin', 'sub_admin'), getPendingUsers);
router.get('/users', requireRole('super_admin', 'sub_admin'), getUsers);
router.get('/restore-missing-students', async (req, res) => {
    try {
        const db = require('../config/db');
        let logs = [];
        // 1. Re-insert missing students from the users table
        const [missingUsers] = await db.query(`
            SELECT * FROM users 
            WHERE role = 'student' 
            AND id NOT IN (SELECT user_id FROM students WHERE user_id IS NOT NULL)
        `);
        
        let restored = 0;
        for (const u of missingUsers) {
            await db.query(`
                INSERT INTO students (user_id, name, email, contact, status)
                VALUES (?, ?, ?, ?, ?)
            `, [u.id, u.name, u.email, u.phone_number, u.status]);
            restored++;
        }
        logs.push(`Re-inserted ${restored} missing students from users table.`);
        
        // 2. Restore overwritten names in students table based on users table
        const [students] = await db.query(`SELECT id, user_id, name FROM students WHERE user_id IS NOT NULL`);
        let nameFixed = 0;
        for (const j of students) {
            const [u] = await db.query(`SELECT name FROM users WHERE id = ?`, [j.user_id]);
            if (u.length > 0 && u[0].name !== j.name) {
                await db.query(`UPDATE students SET name = ? WHERE id = ?`, [u[0].name, j.id]);
                logs.push(`Fixed name for student ID ${j.id}: Was '${j.name}', now '${u[0].name}'`);
                nameFixed++;
            }
        }
        logs.push(`Restored ${nameFixed} corrupted names in students table.`);
        res.json({ success: true, message: "Restoration Complete", details: logs });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
router.get('/students', requireRole('super_admin', 'sub_admin'), getAllStudentsForAdmin);
router.get('/student-details/:id', requireRole('super_admin', 'sub_admin'), getStudentDetailsForAdmin);
router.get('/students/:id/exams', requireRole('super_admin', 'sub_admin'), getStudentExamsForAdmin);
router.get('/mentors', requireRole('super_admin', 'sub_admin'), getAllMentorsForAdmin);
router.get('/faculties', requireRole('super_admin', 'sub_admin'), getAllFacultiesForAdmin);
router.get('/faculties/:id/details', requireRole('super_admin', 'sub_admin'), getFacultyDetailsForAdmin);
router.get('/staff', requireRole('super_admin', 'sub_admin'), getStaffMembers);
router.get('/users/:id', requireRole('super_admin', 'sub_admin'), getUserById);
router.get('/student-logs', requireRole('super_admin', 'sub_admin'), getAllStudentLogs);
router.get('/faculty-logs', requireRole('super_admin', 'sub_admin'), getAllFacultyLogs);
router.get('/mentor-head-report', requireRole('super_admin', 'sub_admin'), getDailyMentorHeadReport);
router.get('/exam-analytics', requireRole('super_admin', 'sub_admin'), getExamAnalytics);
router.get('/mentor-distribution', requireRole('super_admin', 'sub_admin'), getMentorDistribution);
router.get('/task-analytics', requireRole('super_admin', 'sub_admin'), getTaskAnalytics);
router.get('/live-monitoring', requireRole('super_admin', 'sub_admin'), getLiveMonitoring);

// View AH Interactions & Meetings
router.get('/ah-parent-interactions', requireRole('super_admin', 'sub_admin'), getAHParentInteractions);
router.get('/ah-faculty-interactions', requireRole('super_admin', 'sub_admin'), getAHFacultyInteractions);
router.get('/ah-parent-meetings', requireRole('super_admin', 'sub_admin'), getAHParentMeetings);

// Daily Updates
router.get('/daily-updates', requireRole('super_admin', 'sub_admin'), getDailyUpdates);

// Management & Action routes
router.put('/reject/:id', requireRole('super_admin', 'sub_admin'), rejectUser);
router.put('/approve/:id', requireRole('super_admin', 'sub_admin'), approveUser);
router.put('/block/:id', requireRole('super_admin', 'sub_admin'), blockUser);
router.put('/users/:id', requireRole('super_admin', 'sub_admin'), updateUserForAdmin);
router.put('/students/:id', requireRole('super_admin', 'sub_admin'), updateStudentForAdmin);
router.post('/students/:id/installments', requireRole('super_admin', 'sub_admin'), addStudentInstallment);

// Fees Management
router.get('/fees/:entity_type', requireRole('super_admin', 'sub_admin'), getFees);
router.post('/fees', requireRole('super_admin', 'sub_admin'), saveFee);

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
