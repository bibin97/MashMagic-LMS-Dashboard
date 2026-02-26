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
            [result] = await db.query('UPDATE students SET status = "active", isApproved = 1 WHERE id = ?', [req.params.id]);
        } else {
            [result] = await db.query('UPDATE users SET status = "active", isApproved = 1, isActive = 1 WHERE id = ?', [req.params.id]);
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
        const [users] = await db.query(`
            SELECT u.id, u.name, u.email, u.phone_number, u.role, u.place, u.status, u.createdAt as created_at,
                   rb.name as registered_by_name
            FROM users u
            LEFT JOIN users rb ON u.registeredBy = rb.id
            WHERE u.status = "pending" OR u.isApproved = 0
        `);

        // Attempt to fetch students with status pending
        let students = [];
        try {
            const [studentRows] = await db.query(`
                SELECT s.id, s.name, NULL as email, NULL as phone_number, 'student' as role, NULL as place, s.status, s.created_at,
                       rb.name as registered_by_name
                FROM students s
                LEFT JOIN users rb ON s.registeredBy = rb.id
                WHERE s.status = 'pending' OR s.isApproved = 0
            `);
            students = studentRows;
        } catch (e) {
            console.error("Warning: 'status' or 'isApproved' column issue in students table.", e.message);
        }

        const combined = [...users, ...students];
        const enrichedRows = combined.map(r => ({ ...r, created_at: r.created_at || new Date() }));

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
            [result] = await db.query('UPDATE students SET status = "rejected", isApproved = 0 WHERE id = ?', [req.params.id]);
        } else {
            [result] = await db.query('UPDATE users SET status = "rejected", isApproved = 0, isActive = 0 WHERE id = ?', [req.params.id]);
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

// @desc    Update Student
// @route   PUT /api/admin/students/:id
const updateStudentForAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, grade, subject, timetable, nextInstallment, status } = req.body;

        const [result] = await db.query(
            'UPDATE students SET name = ?, grade = ?, subject = ?, time_table = ?, next_installment_date = ?, status = ? WHERE id = ?',
            [name, grade, subject, timetable, nextInstallment, status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        res.status(200).json({ success: true, message: "Student updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update User (Mentor, Faculty, etc.)
// @route   PUT /api/admin/users/:id
const updateUserForAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone_number, status, role } = req.body;

        const [result] = await db.query(
            'UPDATE users SET name = ?, email = ?, phone_number = ?, status = ?, role = ? WHERE id = ?',
            [name, email, phone_number, status, role, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "User updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get All Students
// @route   GET /api/admin/students
const getAllStudentsForAdmin = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, NULL as email, grade, mentor_name as mentor, faculty_name as faculty, subject, time_table as timetable, next_installment_date as nextInstallment, status FROM students');
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========================================================
// ADMIN MANAGEMENT SECTION (SUPER ADMIN ONLY)
// ========================================================

// @desc    Get All Sub Admins
// @route   GET /api/admin/sub-admins
const getSubAdmins = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: "Access Denied. Super Admin only." });
        }

        const [rows] = await db.query(
            'SELECT id, name, email, phone_number, status, isActive, createdAt as created_at FROM users WHERE role = "sub_admin"'
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create Sub Admin
// @route   POST /api/admin/sub-admins
const createSubAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: "Access Denied. Super Admin only." });
        }

        const { name, email, password, phone_number, status } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, Email and Password are required" });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, phone_number, role, status, isActive, createdBy) VALUES (?, ?, ?, ?, "sub_admin", ?, 1, ?)',
            [name, email, hashedPassword, phone_number, status || 'active', req.user.id]
        );

        res.status(201).json({ success: true, message: "Sub Admin created successfully", id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Sub Admin
// @route   PUT /api/admin/sub-admins/:id
const updateSubAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: "Access Denied. Super Admin only." });
        }

        const { id } = req.params;
        const { name, phone_number, status, password } = req.body;

        // Check if target is actually a sub_admin to prevent privilege escalation or modifying super_admin
        const [target] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
        if (!target.length || target[0].role !== 'sub_admin') {
            return res.status(400).json({ success: false, message: "Invalid target. Only sub_admins can be managed here." });
        }

        let query = 'UPDATE users SET name = ?, phone_number = ?, status = ?, isActive = ?';
        let params = [name, phone_number, status, status === 'active' ? 1 : 0];

        if (password) {
            const bcrypt = require('bcrypt');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await db.query(query, params);
        res.status(200).json({ success: true, message: "Sub Admin updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete Sub Admin
// @route   DELETE /api/admin/sub-admins/:id
const deleteSubAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: "Access Denied. Super Admin only." });
        }

        const { id } = req.params;

        // Protection: System must not allow deleting super_admin via this route
        const [target] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
        if (!target.length) return res.status(404).json({ success: false, message: "User not found" });
        if (target[0].role === 'super_admin') {
            return res.status(403).json({ success: false, message: "Fatal Error: Super Admin cannot be deleted." });
        }

        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: "Sub Admin deleted successfully. Integrity maintained." });
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
                (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id) as tasksAssigned,
                (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id AND t.status = 'Completed') as completedTasks
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

// @desc    Get All Staff Members (Mentors, Heads, BDM, etc.)
// @route   GET /api/admin/staff
const getStaffMembers = async (req, res) => {
    try {
        const query = `
            SELECT id, name, email, phone_number as phone, role, status, createdAt as created_at
            FROM users
            WHERE role NOT IN ('student', 'super_admin')
            ORDER BY role ASC, name ASC
        `;
        const [rows] = await db.query(query);
        res.status(200).json({ success: true, count: rows.length, data: rows });
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
    getAllFacultiesForAdmin,
    getStaffMembers,
    getSubAdmins,
    createSubAdmin,
    updateSubAdmin,
    deleteSubAdmin,
    updateStudentForAdmin,
    updateUserForAdmin,
    // @desc    Get exam analytics for graphs
    getExamAnalytics: async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT 
                    subject, 
                    term, 
                    AVG(marks) as avg_marks, 
                    AVG(total) as avg_total,
                    (AVG(marks) / AVG(total)) * 100 as percentage
                FROM student_marks
                GROUP BY subject, term
                ORDER BY term DESC
            `);
            res.status(200).json({ success: true, data: rows });
        } catch (error) {
            console.error('Error fetching exam analytics:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
