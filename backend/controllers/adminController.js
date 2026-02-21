const db = require('../config/db');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (super_admin, admin)
const getUsers = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email, role, status FROM users');
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private (super_admin, admin)
const getUserById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Approve user (set status to active)
// @route   PUT /api/admin/approve/:id
// @access  Private (super_admin, admin)
const approveUser = async (req, res) => {
    try {
        const { role } = req.body;
        let result;

        if (role === 'student') {
            [result] = await db.query('UPDATE students SET status = "active" WHERE id = ?', [req.params.id]);
        } else {
            [result] = await db.query('UPDATE users SET status = "active" WHERE id = ?', [req.params.id]);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User/Student not found" });
        }
        res.status(200).json({ success: true, message: "Approved successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Block user (set status to inactive)
// @route   PUT /api/admin/block/:id
// @access  Private (super_admin, admin)
const blockUser = async (req, res) => {
    try {
        const role = req.body.role || req.query.role;
        let result;

        if (role === 'student') {
            [result] = await db.query('UPDATE students SET status = "inactive" WHERE id = ?', [req.params.id]);
        } else {
            [result] = await db.query('UPDATE users SET status = "inactive" WHERE id = ?', [req.params.id]);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "User blocked successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get pending users
// @route   GET /api/admin/pending
// @access  Private (super_admin, admin)
const getPendingUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, phone_number, role, place, status FROM users WHERE status = "pending"');

        // Attempt to fetch students with status pending
        // Using a try-catch pattern per query fallback in case 'status' column is not created yet
        let students = [];
        try {
            const [studentRows] = await db.query("SELECT id, name, NULL as email, NULL as phone_number, 'student' as role, NULL as place, status FROM students WHERE status = 'pending'");
            students = studentRows;
        } catch (e) {
            // Ignore if column doesn't exist
            console.error("Warning: 'status' column might not exist in students table yet.", e.message);
        }

        const combined = [...users, ...students];
        const enrichedRows = combined.map(r => ({ ...r, created_at: new Date() }));

        res.status(200).json({ success: true, count: enrichedRows.length, data: enrichedRows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Reject user (set status to rejected)
// @route   PUT /api/admin/reject/:id
// @access  Private (super_admin, admin)
const rejectUser = async (req, res) => {
    try {
        const { role } = req.body;
        let result;

        if (role === 'student') {
            [result] = await db.query('UPDATE students SET status = "rejected" WHERE id = ?', [req.params.id]);
        } else {
            [result] = await db.query('UPDATE users SET status = "rejected" WHERE id = ?', [req.params.id]);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User/Student not found" });
        }
        res.status(200).json({ success: true, message: "Registration rejected" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/delete/:id
// @access  Private (super_admin, admin)
const deleteUser = async (req, res) => {
    try {
        const role = req.query.role || req.body.role;
        let result;

        if (role === 'student') {
            [result] = await db.query('DELETE FROM students WHERE id = ?', [req.params.id]);
        } else {
            [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get all student logs
// @route   GET /api/admin/student-logs
const getAllStudentLogs = async (req, res) => {
    try {
        // Build query with filters if needed, but for now just get all
        const [rows] = await db.query(`
            SELECT logs.*, m.name as mentor_name, s.name as student_name
            FROM student_interaction_logs logs
            JOIN users m ON logs.mentor_id = m.id
            JOIN students s ON logs.student_id = s.id
            ORDER BY logs.created_at DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all faculty logs
// @route   GET /api/admin/faculty-logs
const getAllFacultyLogs = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT logs.*, m.name as mentor_name, s.name as student_name
            FROM faculty_interaction_logs logs
            JOIN users m ON logs.mentor_id = m.id
            JOIN students s ON logs.student_id = s.id
            ORDER BY logs.created_at DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Daily Mentor Head Report
// @route   GET /api/admin/mentor-head-report
const getDailyMentorHeadReport = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Total Students (Overall)
        const [totalRes] = await db.query('SELECT COUNT(*) as cnt FROM students');
        const totalStudents = totalRes[0].cnt;

        // Fetch Mentor Heads and their verification counts
        const [reportData] = await db.query(`
            SELECT 
                u.id as mentor_head_id,
                u.name as mentor_head_name,
                (SELECT COUNT(DISTINCT student_id) FROM student_verification WHERE mentor_head_id = u.id AND date = ?) as checkedToday
            FROM users u
            WHERE u.role = 'mentor_head'
        `, [targetDate]);

        const mappedData = reportData.map(rh => ({
            date: targetDate,
            mentorHeadName: rh.mentor_head_name,
            totalStudents: totalStudents,
            checkedToday: rh.checkedToday,
            remaining: totalStudents - rh.checkedToday
        }));

        res.status(200).json({
            success: true,
            data: mappedData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Admin Notifications
// @route   GET /api/admin/notifications
const getAdminNotifications = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 50');
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark Notification as Read
// @route   PUT /api/admin/notifications/:id/read
const markNotificationRead = async (req, res) => {
    try {
        await db.query('UPDATE admin_notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get All Students
// @route   GET /api/admin/students
const getAllStudentsForAdmin = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, NULL as email, grade, mentor_name as mentor, faculty_name as faculty, subject, time_table as timetable, next_installment_date as nextInstallment, status FROM students WHERE status != "pending"');
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get All Mentors
// @route   GET /api/admin/mentors
const getAllMentorsForAdmin = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, u.name, u.email, u.phone_number as phone, u.status,
                (SELECT COUNT(*) FROM students s WHERE s.mentor_id = u.id AND s.status = 'active') as studentsCount,
                (SELECT COUNT(*) FROM tasks t WHERE t.mentor_id = u.id) as tasksAssigned,
                (SELECT COUNT(*) FROM tasks t WHERE t.mentor_id = u.id AND t.status = 'Completed') as completedTasks
            FROM users u
            WHERE u.role = 'mentor'
            ORDER BY u.name ASC
        `;
        const [rows] = await db.query(query);
        const mappedData = rows.map(row => ({
            ...row,
            completionRate: row.tasksAssigned > 0 ? Math.round((row.completedTasks / row.tasksAssigned) * 100) : 0
        }));
        res.status(200).json({ success: true, count: mappedData.length, data: mappedData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get All Faculties
// @route   GET /api/admin/faculties
const getAllFacultiesForAdmin = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, u.name, u.email, u.phone_number as phone, u.status,
                (SELECT COUNT(*) FROM students s WHERE s.faculty_id = u.id AND s.status = 'active') as studentsUnder,
                (SELECT COUNT(DISTINCT s.mentor_id) FROM students s WHERE s.faculty_id = u.id AND s.mentor_id IS NOT NULL AND s.status = 'active') as mentorsUnder
            FROM users u
            WHERE u.role = 'faculty'
            ORDER BY u.name ASC
        `;
        const [rows] = await db.query(query);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
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
    getAllStudentsForAdmin,
    getAllMentorsForAdmin,
    getAllFacultiesForAdmin
};
