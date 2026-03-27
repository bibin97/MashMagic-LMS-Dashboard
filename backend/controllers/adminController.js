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
        const { id } = req.params;
        let result;
        let nameRow;

        if (role === 'student') {
            [[nameRow]] = await db.query('SELECT name FROM students WHERE id = ?', [id]);
            [result] = await db.query('UPDATE students SET status = "active", isApproved = 1 WHERE id = ?', [id]);
        } else {
            [[nameRow]] = await db.query('SELECT name FROM users WHERE id = ?', [id]);
            [result] = await db.query('UPDATE users SET status = "active", isApproved = 1, isActive = 1 WHERE id = ?', [id]);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User/Student not found" });
        }

        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [`Admin (${req.user.name}) approved ${role}: ${nameRow?.name || id}`]);
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
        const { id } = req.params;
        let result;
        let nameRow;

        if (role === 'student') {
            [[nameRow]] = await db.query('SELECT name FROM students WHERE id = ?', [id]);
            [result] = await db.query('UPDATE students SET status = "inactive" WHERE id = ?', [id]);
        } else {
            [[nameRow]] = await db.query('SELECT name FROM users WHERE id = ?', [id]);
            [result] = await db.query('UPDATE users SET status = "inactive" WHERE id = ?', [id]);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [`Admin (${req.user.name}) blocked ${role}: ${nameRow?.name || id}`]);
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
        const { id } = req.params;
        let result;
        let nameRow;

        if (role === 'student') {
            [[nameRow]] = await db.query('SELECT name FROM students WHERE id = ?', [id]);
            if (!nameRow) return res.status(404).json({ success: false, message: "Student not found" });

            // Handle student-specific logs/entries if any (usually cascade in DB but explicit is safer if no cascade)
            await db.query('DELETE FROM student_interaction_logs WHERE student_id = ?', [id]);
            await db.query('DELETE FROM faculty_interaction_logs WHERE student_id = ?', [id]);
            await db.query('DELETE FROM student_verification WHERE student_id = ?', [id]);
            await db.query('DELETE FROM daily_hours_log WHERE student_id = ?', [id]); // or similar student hours table

            [result] = await db.query('DELETE FROM students WHERE id = ?', [id]);
        } else {
            [[nameRow]] = await db.query('SELECT name, role FROM users WHERE id = ?', [id]);
            if (!nameRow) return res.status(404).json({ success: false, message: "User not found" });

            const userRole = nameRow.role;

            // Handle cross-table dependencies based on role
            if (userRole === 'mentor') {
                // Remove assignments from students but keep student records
                await db.query('UPDATE students SET mentor_id = NULL, mentor_name = NULL WHERE mentor_id = ?', [id]);
                
                // PRESERVE HISTORY: Nullify mentor_id instead of deleting logs
                await db.query('UPDATE student_interaction_logs SET mentor_id = NULL WHERE mentor_id = ?', [id]);
                await db.query('UPDATE faculty_interaction_logs SET mentor_id = NULL WHERE mentor_id = ?', [id]);
                await db.query('UPDATE daily_hours_log SET mentor_id = NULL WHERE mentor_id = ?', [id]);
                await db.query('UPDATE mentor_timetable SET mentor_id = NULL WHERE mentor_id = ?', [id]);
                
                // Tasks are better kept for audit. Let's keep them with NULL assigned_to.
                await db.query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = ?', [id]);
            } else if (userRole === 'faculty') {
                await db.query('UPDATE students SET faculty_id = NULL, faculty_name = NULL WHERE faculty_id = ?', [id]);
                await db.query('UPDATE faculty_interaction_logs SET faculty_id = NULL WHERE faculty_id = ?', [id]);
            } else if (userRole === 'mentor_head') {
                await db.query('UPDATE student_verification SET mentor_head_id = NULL WHERE mentor_head_id = ?', [id]);
            }

            [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const adminName = req.user?.name || 'Admin';
        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [`Admin (${adminName}) deleted ${role || 'user'}: ${nameRow?.name || id}`]);
        
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("DELETE_USER_ERROR LOG:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server Error: Dependency conflict. Deletion failed.", 
            error: error.message 
        });
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
            LEFT JOIN users m ON logs.mentor_id = m.id
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
            LEFT JOIN users m ON logs.mentor_id = m.id
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

        const [[oldStudent]] = await db.query('SELECT name FROM students WHERE id = ?', [id]);

        const [result] = await db.query(
            'UPDATE students SET name = ?, grade = ?, subject = ?, time_table = ?, next_installment_date = ?, status = ? WHERE id = ?',
            [name, grade, subject, timetable, nextInstallment, status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [`Admin (${req.user.name}) updated student: ${oldStudent?.name || id}`]);
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

        const [[oldUser]] = await db.query('SELECT name FROM users WHERE id = ?', [id]);

        const [result] = await db.query(
            'UPDATE users SET name = ?, email = ?, phone_number = ?, status = ?, role = ? WHERE id = ?',
            [name, email, phone_number, status, role, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [`Admin (${req.user.name}) updated ${role}: ${oldUser?.name || id}`]);
        res.status(200).json({ success: true, message: "User updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get All Students
// @route   GET /api/admin/students
const getAllStudentsForAdmin = async (req, res) => {
    try {
        const { startDate, endDate, category, search, sortBy, mentor_id } = req.query;
        let sql = `
            SELECT 
                id, roll_number, registration_number, name, grade, course, hour, 
                mentor_name as mentor, faculty_name as faculty, 
                subject, time_table as timetable, 
                next_installment_date as nextInstallment, 
                status, onboarding_status, 
                attendance_percentage, performance_status,
                course_completed,
                created_at,
                mentor_id
            FROM students WHERE 1=1
        `;
        let params = [];

        if (mentor_id) {
            sql += ' AND mentor_id = ?';
            params.push(mentor_id);
        }

        if (startDate) {
            sql += ' AND created_at >= ?';
            params.push(startDate);
        }
        if (endDate) {
            sql += ' AND created_at <= ?';
            params.push(endDate + ' 23:59:59');
        }

        if (category === 'Active Records') {
            sql += ' AND status = "active"';
        } else if (category === 'Archived Records') {
            sql += ' AND status IN ("inactive", "rejected", "completed")';
        }

        if (search) {
            sql += ' AND (name LIKE ? OR registration_number LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (sortBy === 'oldest') {
            sql += ' ORDER BY created_at ASC';
        } else {
            sql += ' ORDER BY created_at DESC';
        }

        const [rows] = await db.query(sql, params);
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
        const { startDate, endDate, category } = req.query;
        let whereClauses = ["u.role = 'mentor'"];
        let params = [];

        if (startDate) {
            whereClauses.push("u.createdAt >= ?");
            params.push(startDate);
        }
        if (endDate) {
            whereClauses.push("u.createdAt <= ?");
            params.push(endDate + ' 23:59:59');
        }

        if (category === 'Active Records') {
            whereClauses.push("u.status = 'active'");
        } else if (category === 'Archived Records') {
            whereClauses.push("u.status != 'active'");
        }

        const query = `
            SELECT 
                u.id, u.name, u.email, u.phone_number as phone, u.status, u.createdAt as created_at,
                (SELECT COUNT(*) FROM students s WHERE s.mentor_id = u.id AND s.status = 'active') as studentsCount,
                (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id) as tasksAssigned,
                (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id AND t.status = 'Completed') as completedTasks
            FROM users u
            WHERE ${whereClauses.join(' AND ')}
            ORDER BY u.name ASC
        `;
        const [rows] = await db.query(query, params);
        const mappedData = rows.map(row => ({
            ...row,
            completionRate: row.tasksAssigned > 0 ? Math.round((row.completedTasks / row.tasksAssigned) * 100) : 0
        }));
        res.status(200).json({ success: true, count: mappedData.length, data: mappedData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get All Staff Members (Mentors, Heads, etc.)
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
    },
    // @desc    Get mentor student distribution
    // @route   GET /api/admin/mentor-distribution
    getMentorDistribution: async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT 
                    u.name as mentor_name,
                    (SELECT COUNT(*) FROM students s WHERE s.mentor_id = u.id AND s.status = 'active') as student_count
                FROM users u
                WHERE u.role = 'mentor' AND u.status = 'active'
                HAVING student_count > 0
                ORDER BY student_count DESC
            `);
            res.status(200).json({ success: true, data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // @desc    Get task performance analytics
    // @route   GET /api/admin/task-analytics
    getTaskAnalytics: async (req, res) => {
        try {
            const { range } = req.query;
            let daysCount = 7; // Default

            const mapping = {
                'today': 1,
                'yesterday': 2,
                'last3': 3,
                'last7': 7,
                'last14': 14,
                'last30': 30,
                'last60': 60,
                'last90': 90
            };

            if (mapping[range]) {
                daysCount = mapping[range];
            }

            // Create helper to format date as YYYY-MM-DD in local time
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const startDate = new Date(today);
            startDate.setDate(today.getDate() - (daysCount - 1));

            console.log(`ANALYTICS_DEBUG: range=${range}, daysCount=${daysCount}, startDate=${startDate.toISOString()}, today=${today.toISOString()}`);

            // Query DB
            const [rows] = await db.query(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m-%d') as date,
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN (status = 'Completed' OR status = 'Success') THEN 1 ELSE 0 END) as completed_tasks
                FROM tasks
                WHERE created_at >= ?
                GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
                ORDER BY DATE_FORMAT(created_at, '%Y-%m-%d') ASC
            `, [startDate]);

            // Create a lookup map
            const dbDataMap = {};
            rows.forEach(row => {
                dbDataMap[row.date] = {
                    total_tasks: parseInt(row.total_tasks) || 0,
                    completed_tasks: parseInt(row.completed_tasks) || 0
                };
            });

            // Generate full date range
            const fullRangeData = [];
            let currentDate = new Date(startDate);

            while (currentDate <= today) {
                const dateStr = formatDate(currentDate);
                const dayData = dbDataMap[dateStr] || { total_tasks: 0, completed_tasks: 0 };

                // Always use Month Date labels as per user request
                const name = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                fullRangeData.push({
                    date: dateStr,
                    name: name,
                    tasks: dayData.total_tasks,
                    completed: dayData.completed_tasks
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }

            console.log(`ANALYTICS_DEBUG: returning ${fullRangeData.length} days`);
            res.status(200).json({ success: true, data: fullRangeData });
        } catch (error) {
            console.error("TASK_ANALYTICS_ERROR:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // @desc    Get currently running sessions across the platform
    // @route   GET /api/admin/live-monitoring
    getLiveMonitoring: async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT 
                    fs.id, fs.topic, fs.date, fs.start_time, fs.end_time, fs.status,
                    u.name as faculty_name,
                    s.name as student_name,
                    s.meeting_link,
                    s.registration_number,
                    m.name as mentor_name
                FROM faculty_sessions fs
                JOIN users u ON fs.faculty_id = u.id
                JOIN session_attendance sa ON fs.id = sa.session_id
                JOIN students s ON sa.student_id = s.id
                LEFT JOIN users m ON s.mentor_id = m.id
                WHERE fs.date = CURDATE()
                ORDER BY fs.start_time ASC
            `);
            res.status(200).json({ success: true, count: rows.length, data: rows });
        } catch (error) {
            console.error("LIVE_MONITORING_ERROR:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
