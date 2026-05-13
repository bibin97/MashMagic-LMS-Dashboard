const db = require('../config/db');

// @desc    Get dashboard counts (robust summary)
// @route   GET /api/admin/dashboard-summary
const getAdminDashboardSummary = async (req, res) => {
    try {
        const [[{count: students}]] = await db.query('SELECT COUNT(*) as count FROM students');
        const [[{count: mentors}]] = await db.query('SELECT COUNT(*) as count FROM mentors');
        const [[{count: faculties}]] = await db.query('SELECT COUNT(*) as count FROM faculties');
        const [[{count: pending}]] = await db.query('SELECT COUNT(*) as count FROM users WHERE (status = "pending" OR isApproved = 0) AND status != "rejected"');

        res.status(200).json({
            success: true,
            data: {
                students,
                mentors,
                faculties,
                pendingApprovals: pending
            }
        });
    } catch (error) {
        console.error("DASHBOARD_SUMMARY_ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

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
        let result = { affectedRows: 0 };
        let nameRow;

        // 1. Try to find and update in users table first
        [[nameRow]] = await db.query('SELECT name, role FROM users WHERE id = ?', [id]);
        if (nameRow) {
            [result] = await db.query('UPDATE users SET status = "active", isApproved = 1, isActive = 1 WHERE id = ?', [id]);
            
            // If it's a student user, also try to update corresponding record in students table if it exists
            if (nameRow.role === 'student' || role === 'student') {
                await db.query('UPDATE students SET status = "active", isApproved = 1 WHERE user_id = ? OR id = ?', [id, id]);
            }
        } else {
            // 2. If not found in users, try students table
            [[nameRow]] = await db.query('SELECT name FROM students WHERE id = ?', [id]);
            if (nameRow) {
                [result] = await db.query('UPDATE students SET status = "active", isApproved = 1 WHERE id = ?', [id]);
                
                // If there's a user_id linked, update that too
                const [[studentData]] = await db.query('SELECT user_id FROM students WHERE id = ?', [id]);
                if (studentData?.user_id) {
                    await db.query('UPDATE users SET status = "active", isApproved = 1, isActive = 1 WHERE id = ?', [studentData.user_id]);
                }
            }
        }

        if (!nameRow || result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User/Student not found" });
        }

        // Automatically clear all related "Pending Approval" notifications from the activity feed
        await db.query(`
            DELETE FROM admin_notifications 
            WHERE related_id = ? 
            AND action_type IN ('student_registration', 'faculty_registration', 'mentor_registration', 'ssc_registration', 'faculty_onboarding', 'mentor_head_onboarding')
        `, [id]);

        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [
            `<b>Approval Success:</b> ${nameRow?.name || id} is now <span style="color:#008080">Active</span>.`
        ]);
        res.status(200).json({ success: true, message: "Approved successfully" });
    } catch (error) {
        console.error("APPROVE_USER_ERROR:", error);
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
        let result = { affectedRows: 0 };
        let nameRow;

        // Try users table
        [[nameRow]] = await db.query('SELECT name, role FROM users WHERE id = ?', [id]);
        if (nameRow) {
            [result] = await db.query('UPDATE users SET status = "inactive", isActive = 0 WHERE id = ?', [id]);
            if (nameRow.role === 'student' || role === 'student') {
                await db.query('UPDATE students SET status = "inactive" WHERE user_id = ? OR id = ?', [id, id]);
            }
        } else {
            // Try students table
            [[nameRow]] = await db.query('SELECT name FROM students WHERE id = ?', [id]);
            if (nameRow) {
                [result] = await db.query('UPDATE students SET status = "inactive" WHERE id = ?', [id]);
                const [[studentData]] = await db.query('SELECT user_id FROM students WHERE id = ?', [id]);
                if (studentData?.user_id) {
                    await db.query('UPDATE users SET status = "inactive", isActive = 0 WHERE id = ?', [studentData.user_id]);
                }
            }
        }

        if (result.affectedRows === 0) {
            // Final check: try mentors or faculties tables directly
            const tables = ['mentors', 'faculties'];
            for (const table of tables) {
                const [[row]] = await db.query(`SELECT name FROM ${table} WHERE id = ?`, [id]);
                if (row) {
                    nameRow = row;
                    [result] = await db.query(`UPDATE ${table} SET status = "inactive" WHERE id = ?`, [id]);
                    break;
                }
            }
        }

        if (!nameRow || result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User/Staff not found" });
        }

        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [
            `<b>Security Alert:</b> <b>${nameRow?.name || id}</b> has been <span style="color:#e11d48">Blocked</span> by Admin.`
        ]);
        res.status(200).json({ success: true, message: "User blocked successfully" });
    } catch (error) {
        console.error("BLOCK_USER_ERROR:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get pending users
// @route   GET /api/admin/pending
// @access  Private (super_admin, admin)
const getPendingUsers = async (req, res) => {
    try {
        // 1. Fetch non-student users (Faculties, Mentors, SSCs, etc.)
        // We use a robust check for the timestamp column name in users table
        const [tableInfo] = await db.query('SHOW COLUMNS FROM users');
        const hasCreatedAt = tableInfo.some(c => c.Field === 'createdAt');
        const hasCreatedAtSnake = tableInfo.some(c => c.Field === 'created_at');
        const userTimeCol = hasCreatedAt ? 'u.createdAt' : (hasCreatedAtSnake ? 'u.created_at' : 'u.id');

        const [users] = await db.query(`
            SELECT u.id, u.name, u.email, u.phone_number, u.role, u.place, u.status, ${userTimeCol} as created_at,
                   rb.name as registered_by_name
            FROM users u
            LEFT JOIN users rb ON u.registeredBy = rb.id
            WHERE (u.status = "pending" OR u.isApproved = 0) 
            AND u.status != 'rejected'
            AND u.role != 'student'
        `);

        const uniqueRows = users.map(r => ({
            ...r,
            created_at: r.created_at || new Date()
        }));

        res.status(200).json({ success: true, count: uniqueRows.length, data: uniqueRows });
    } catch (error) {
        console.error("GET_PENDING_USERS_ERROR:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Reject user (set status to rejected)
// @route   PUT /api/admin/reject/:id
// @access  Private (super_admin, admin)
const rejectUser = async (req, res) => {
    try {
        const { role } = req.body;
        const { id } = req.params;
        let result = { affectedRows: 0 };

        // Try users table first
        const [[userRow]] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
        if (userRow) {
            [result] = await db.query('UPDATE users SET status = "rejected", isApproved = 0, isActive = 0 WHERE id = ?', [id]);
            if (userRow.role === 'student' || role === 'student') {
                await db.query('UPDATE students SET status = "rejected", isApproved = 0 WHERE user_id = ? OR id = ?', [id, id]);
            }
        } else {
            // Try students table
            const [[studentRow]] = await db.query('SELECT user_id FROM students WHERE id = ?', [id]);
            if (studentRow) {
                [result] = await db.query('UPDATE students SET status = "rejected", isApproved = 0 WHERE id = ?', [id]);
                if (studentRow.user_id) {
                    await db.query('UPDATE users SET status = "rejected", isApproved = 0, isActive = 0 WHERE id = ?', [studentRow.user_id]);
                }
            }
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User/Student not found" });
        }
        // Automatically clear all related "Pending Approval" notifications from the activity feed
        await db.query(`
            DELETE FROM admin_notifications 
            WHERE related_id = ? 
            AND action_type IN ('student_registration', 'faculty_registration', 'mentor_registration', 'ssc_registration', 'faculty_onboarding', 'mentor_head_onboarding')
        `, [id]);

        res.status(200).json({ success: true, message: "Registration rejected" });
    } catch (error) {
        console.error("REJECT_USER_ERROR:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/delete/:id
// @access  Private (super_admin, admin)
const deleteUser = async (req, res) => {
    const { id } = req.params;
    const roleHint = req.query?.role || req.body?.role;

    try {
        // Try to find in users table first
        const [users] = await db.query('SELECT id, name, role, status FROM users WHERE id = ?', [id]);
        
        if (users.length > 0) {
            const target = users[0];
            const userRole = target.role;

            if (userRole === 'super_admin' && target.status === 'active') {
                return res.status(403).json({ success: false, message: "Active Super Admin cannot be deleted." });
            }

            // If it's a student user, or role hint is student, clean up student dependencies first
            if (userRole === 'student' || roleHint === 'student') {
                await cleanupStudentDependencies(id);
                // Also try to delete from students table if it exists
                await db.query('DELETE FROM students WHERE user_id = ? OR id = ?', [id, id]);
            }

            // Consolidated Resilient Cleanup for ALL potential staff dependencies
            const cleanupQueries = [
                'UPDATE users SET registeredBy = NULL WHERE registeredBy = ?',
                'UPDATE students SET registeredBy = NULL WHERE registeredBy = ?',
                'UPDATE tasks SET assigned_by = NULL WHERE assigned_by = ?',
                'UPDATE tasks SET assigned_to = NULL WHERE assigned_to = ?',
                'UPDATE students SET mentor_id = NULL, mentor_name = "Not Assigned" WHERE mentor_id = ?',
                'UPDATE students SET faculty_id = NULL, faculty_name = "Not Assigned" WHERE faculty_id = ?',
                'DELETE FROM faculty_sessions WHERE faculty_id = ?',
                'DELETE FROM student_marks WHERE faculty_id = ?',
                'DELETE FROM student_reports WHERE faculty_id = ?',
                'DELETE FROM faculty_documents WHERE faculty_id = ?',
                'DELETE FROM faculty_interaction_logs WHERE faculty_id = ?',
                'DELETE FROM mentorship_logs WHERE mentor_id = ?',
                'DELETE FROM faculty_verification WHERE academic_head_id = ? OR faculty_id = ?',
                'DELETE FROM student_interaction_logs WHERE mentor_id = ?',
                'DELETE FROM daily_hours_log WHERE mentor_id = ?',
                'DELETE FROM mentor_timetable WHERE mentor_id = ?',
                'DELETE FROM notifications WHERE user_id = ?',
                'DELETE FROM live_class_feedbacks WHERE faculty_id = ?',
                'DELETE FROM activity_logs WHERE user_id = ?',
                'DELETE FROM user_activity_logs WHERE user_id = ?',
                'DELETE FROM admin_actions WHERE user_id = ?'
            ];

            for (const query of cleanupQueries) {
                try {
                    const params = query.includes('OR') ? [id, id] : [id];
                    await db.query(query, params);
                } catch (e) {}
            }

            // Final User Delete from central and specific tables
            await db.query('DELETE FROM users WHERE id = ?', [id]);
            if (userRole === 'mentor') await db.query('DELETE FROM mentors WHERE id = ?', [id]);
            if (userRole === 'faculty') await db.query('DELETE FROM faculties WHERE id = ?', [id]);
            
            try {
                await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [
                    `<b>System Action:</b> Staff member (ID: ${id}) was permanently removed.`
                ]);
            } catch (e) {}
            
            return res.status(200).json({ success: true, message: "Member and associated dependencies cleared successfully" });
        } else {
            // Not found in users, try students table directly
            const [[student]] = await db.query('SELECT name FROM students WHERE id = ?', [id]);
            if (!student) return res.status(404).json({ success: false, message: "User/Student not found" });

            await cleanupStudentDependencies(id);
            await db.query('DELETE FROM students WHERE id = ?', [id]);
            
            return res.status(200).json({ success: true, message: "Student record deleted successfully" });
        }
    } catch (error) {
        console.error("DELETE_USER_ERROR LOG:", error);
        res.status(500).json({ 
            success: false, 
            message: "Database Conflict: " + error.message, 
            error: error.message 
        });
    }
};

// Helper for student cleanup
async function cleanupStudentDependencies(studentId) {
    const queries = [
        'DELETE FROM student_interaction_logs WHERE student_id = ?',
        'DELETE FROM faculty_interaction_logs WHERE student_id = ?',
        'DELETE FROM student_verification WHERE student_id = ?',
        'DELETE FROM daily_hours_log WHERE student_id = ?',
        'DELETE FROM student_marks WHERE student_id = ?',
        'DELETE FROM student_exams WHERE student_id = ?',
        'DELETE FROM session_attendance WHERE student_id = ?',
        'DELETE FROM student_reports WHERE student_id = ?',
        'DELETE FROM live_class_feedbacks WHERE student_id = ?',
        'DELETE FROM mentor_timetable WHERE student_id = ?',
        'DELETE FROM student_daily_updates WHERE student_id = ?',
        'DELETE FROM faculty_class_updates WHERE student_id = ?'
    ];
    for (const q of queries) {
        try { await db.query(q, [studentId]); } catch (e) {}
    }
}

// @desc    Get all student logs
// @route   GET /api/admin/student-logs
const getAllStudentLogs = async (req, res) => {
    try {
        const { student_id, mentor_id, startDate, endDate } = req.query;
        let whereClause = 'WHERE 1=1';
        if (student_id) whereClause += ' AND student_id = ?';
        if (mentor_id) whereClause += ' AND mentor_id = ?';
        if (startDate) whereClause += ' AND created_at >= ?';
        if (endDate) whereClause += ' AND created_at <= ?';

        const buildParams = () => {
            let p = [];
            if (student_id) p.push(student_id);
            if (mentor_id) p.push(mentor_id);
            if (startDate) p.push(startDate);
            if (endDate) p.push(endDate + ' 23:59:59');
            return p;
        };

        const params = [
            ...buildParams(),
            ...buildParams(),
            ...buildParams(),
            ...buildParams()
        ];

        const [rows] = await db.query(`
            SELECT 
                CONVERT('Interaction Hub' USING utf8mb4) COLLATE utf8mb4_unicode_ci as source,
                r.id, r.mentor_id, r.student_id, r.created_at,
                CONVERT(m.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_name, 
                CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name,
                CAST(r.session_type AS CHAR) as session_number,
                CONVERT(r.session_type USING utf8mb4) COLLATE utf8mb4_unicode_ci as session_type,
                CONVERT(COALESCE(
                    JSON_UNQUOTE(JSON_EXTRACT(r.report_data, '$.notes')), 
                    JSON_UNQUOTE(JSON_EXTRACT(r.report_data, '$.action_plan')),
                    JSON_UNQUOTE(JSON_EXTRACT(r.report_data, '$.next_task')),
                    JSON_UNQUOTE(JSON_EXTRACT(r.report_data, '$.study_status')),
                    JSON_UNQUOTE(JSON_EXTRACT(r.report_data, '$.main_problem')),
                    r.session_type
                ) USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_notes,
                CAST(JSON_UNQUOTE(JSON_EXTRACT(r.report_data, '$.self_clarity')) AS CHAR) as understanding_level,
                CAST(JSON_UNQUOTE(JSON_EXTRACT(r.report_data, '$.confidence')) AS CHAR) as student_confidence,
                NULL as stress_level,
                r.is_flagged,
                CONVERT(r.flag_reason USING utf8mb4) COLLATE utf8mb4_unicode_ci as flag_reason,
                NULL as screenshot_url
            FROM mentor_session_reports r
            LEFT JOIN mentors m ON r.mentor_id = m.id
            JOIN students s ON r.student_id = s.id
            ${whereClause.replace(/student_id/g, 'r.student_id').replace(/mentor_id/g, 'r.mentor_id').replace(/created_at/g, 'r.created_at')}

            UNION ALL

            SELECT 
                CONVERT('Session Log' USING utf8mb4) COLLATE utf8mb4_unicode_ci as source,
                l.id, l.mentor_id, l.student_id, l.created_at,
                CONVERT(m.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_name, 
                CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name,
                CONVERT('S-Log' USING utf8mb4) COLLATE utf8mb4_unicode_ci as session_number,
                CONVERT('MEDIUM' USING utf8mb4) COLLATE utf8mb4_unicode_ci as session_type,
                CONVERT(CONCAT(l.main_issue, ': ', l.action_type) USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_notes,
                CAST(l.understanding_after_session AS CHAR) as understanding_level,
                CAST(l.session_quality_rating AS CHAR) as student_confidence,
                CAST(l.stress_level AS CHAR) as stress_level,
                NULL as is_flagged,
                NULL as flag_reason,
                NULL as screenshot_url
            FROM mentor_session_logs l
            LEFT JOIN mentors m ON l.mentor_id = m.id
            JOIN students s ON l.student_id = s.id
            ${whereClause.replace(/student_id/g, 'l.student_id').replace(/mentor_id/g, 'l.mentor_id').replace(/created_at/g, 'l.created_at')}

            UNION ALL

            SELECT 
                CONVERT('Quick Log' USING utf8mb4) COLLATE utf8mb4_unicode_ci as source,
                logs.id, logs.mentor_id, logs.student_id, logs.created_at,
                CONVERT(m.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_name, 
                CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name,
                CONVERT('Q-Log' USING utf8mb4) COLLATE utf8mb4_unicode_ci as session_number,
                CONVERT('QUICK' USING utf8mb4) COLLATE utf8mb4_unicode_ci as session_type,
                CONVERT(logs.mentor_notes USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_notes,
                CAST(logs.self_clarity AS CHAR) as understanding_level,
                CAST(logs.confidence AS CHAR) as student_confidence,
                CAST(logs.exam_anxiety AS CHAR) as stress_level,
                NULL as is_flagged,
                NULL as flag_reason,
                CONVERT(logs.screenshot_url USING utf8mb4) COLLATE utf8mb4_unicode_ci as screenshot_url
            FROM student_interaction_logs logs
            LEFT JOIN mentors m ON logs.mentor_id = m.id
            JOIN students s ON logs.student_id = s.id
            ${whereClause.replace(/student_id/g, 'logs.student_id').replace(/mentor_id/g, 'logs.mentor_id').replace(/created_at/g, 'logs.created_at')}

            UNION ALL

            SELECT 
                CONVERT('Mentorship' USING utf8mb4) COLLATE utf8mb4_unicode_ci as source,
                ml.id, ml.mentor_id, ml.student_id, ml.created_at,
                CONVERT(m.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_name, 
                CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name,
                CONVERT('M-Log' USING utf8mb4) COLLATE utf8mb4_unicode_ci as session_number,
                'DEEP' as session_type,
                CONVERT(ml.action_details USING utf8mb4) as mentor_notes,
                NULL as understanding_level,
                NULL as student_confidence,
                NULL as stress_level,
                NULL as is_flagged,
                NULL as flag_reason,
                NULL as screenshot_url
            FROM mentorship_logs ml
            LEFT JOIN mentors m ON ml.mentor_id = m.id
            JOIN students s ON ml.student_id = s.id
            ${whereClause.replace(/student_id/g, 'ml.student_id').replace(/mentor_id/g, 'ml.mentor_id').replace(/created_at/g, 'ml.created_at')}

            ORDER BY created_at DESC
        `, params);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("GET_ALL_STUDENT_LOGS_ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all faculty logs (Unified Audit)
// @route   GET /api/admin/faculty-logs
const getAllFacultyLogs = async (req, res) => {
    try {
        const { student_id, faculty_id, mentor_id, startDate, endDate } = req.query;
        let params = [];

        // We will build a unified query that pulls from:
        // 1. mentor_faculty_interactions (Mentors logging calls with Faculty)
        // 2. faculty_interaction_logs (Mentors tracking Faculty status)
        // 3. student_reports (Faculty reporting on Students - Intelligence)
        // 4. faculty_sessions (Actual teaching sessions)

        const baseWhere = (tableAlias, studentCol = 'student_id', mentorCol = 'mentor_id', dateCol = 'created_at', facultyCol = 'faculty_id', includeStudent = true, includeMentor = true, includeFaculty = true) => {
            let clause = 'WHERE 1=1';
            if (student_id && includeStudent) clause += ` AND ${tableAlias}.${studentCol} = ?`;
            if (mentor_id && includeMentor) clause += ` AND ${tableAlias}.${mentorCol} = ?`;
            if (faculty_id && includeFaculty) clause += ` AND ${tableAlias}.${facultyCol} = ?`;
            
            if (startDate) {
                clause += ` AND ${tableAlias}.${dateCol} >= ?`;
            }
            if (endDate) {
                clause += ` AND ${tableAlias}.${dateCol} <= ?`;
            }
            return clause;
        };

        const getParams = (includeStudent = true, includeMentor = true, includeFaculty = true) => {
            let p = [];
            if (student_id && includeStudent) p.push(student_id);
            if (mentor_id && includeMentor) p.push(mentor_id);
            if (faculty_id && includeFaculty) p.push(faculty_id);
            if (startDate) p.push(startDate);
            if (endDate) p.push(endDate + ' 23:59:59');
            return p;
        };

        const query = `
            SELECT * FROM (
                -- 1. Mentors logging interactions with Faculty
                SELECT 
                    mfi.id, mfi.created_at, mfi.mentor_id, mfi.student_id,
                    CONVERT(m.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_name, 
                    CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name,
                    CONVERT('Faculty Call' USING utf8mb4) COLLATE utf8mb4_unicode_ci as source,
                    CONVERT(mfi.main_issue USING utf8mb4) COLLATE utf8mb4_unicode_ci as notes,
                    NULL as understanding_level, NULL as student_confidence, NULL as stress_level,
                    mfi.is_flagged, CONVERT(mfi.flag_reason USING utf8mb4) COLLATE utf8mb4_unicode_ci as flag_reason,
                    CONVERT(f.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as faculty_name, mfi.faculty_id
                FROM mentor_faculty_interactions mfi
                LEFT JOIN mentors m ON mfi.mentor_id = m.id
                LEFT JOIN students s ON mfi.student_id = s.id
                LEFT JOIN faculties f ON mfi.faculty_id = f.id
                ${baseWhere('mfi')}

                UNION ALL

                -- 2. Mentors tracking Faculty
                SELECT 
                    fil.id, fil.created_at, fil.mentor_id, fil.student_id,
                    CONVERT(m.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_name, 
                    CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name,
                    CONVERT('Faculty Tracking' USING utf8mb4) COLLATE utf8mb4_unicode_ci as source,
                    CONVERT(fil.notes USING utf8mb4) COLLATE utf8mb4_unicode_ci as notes,
                    NULL as understanding_level, NULL as student_confidence, NULL as stress_level,
                    0 as is_flagged, NULL as flag_reason,
                    CONVERT(f.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as faculty_name, fil.faculty_id
                FROM faculty_interaction_logs fil
                LEFT JOIN mentors m ON fil.mentor_id = m.id
                LEFT JOIN students s ON fil.student_id = s.id
                LEFT JOIN faculties f ON fil.faculty_id = f.id
                ${baseWhere('fil')}

                UNION ALL

                -- 3. Faculty Intelligence Reports
                SELECT 
                    sr.id, sr.created_at, NULL as mentor_id, sr.student_id,
                    NULL as mentor_name, CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name,
                    CONVERT('Faculty Intelligence' USING utf8mb4) COLLATE utf8mb4_unicode_ci as source,
                    CONVERT(sr.remarks USING utf8mb4) COLLATE utf8mb4_unicode_ci as notes,
                    NULL as understanding_level, NULL as student_confidence, NULL as stress_level,
                    0 as is_flagged, NULL as flag_reason,
                    CONVERT(f.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as faculty_name, sr.faculty_id
                FROM student_reports sr
                LEFT JOIN students s ON sr.student_id = s.id
                LEFT JOIN faculties f ON sr.faculty_id = f.id
                ${baseWhere('sr', 'student_id', 'faculty_id', 'created_at', 'faculty_id', true, false, true)}

                UNION ALL

                -- 4. Actual Faculty Sessions
                SELECT 
                    fs.id, fs.created_at, NULL as mentor_id, NULL as student_id,
                    NULL as mentor_name, NULL as student_name,
                    CONVERT('Faculty Session' USING utf8mb4) as source,
                    CONVERT(fs.topic USING utf8mb4) as notes,
                    NULL as understanding_level, NULL as student_confidence, NULL as stress_level,
                    0 as is_flagged, NULL as flag_reason,
                    f.name as faculty_name, fs.faculty_id
                FROM faculty_sessions fs
                LEFT JOIN users f ON fs.faculty_id = f.id
                ${baseWhere('fs', 'faculty_id', 'faculty_id', 'created_at', 'faculty_id', false, false, true)}
            ) as unified_faculty_logs
            ORDER BY created_at DESC
        `;

        // Flatten params for UNION ALL
        const allParams = [
            ...getParams(true, true, true), // mfi
            ...getParams(true, true, true), // fil
            ...getParams(true, false, true), // sr (no mentor_id, using faculty_id twice for logic)
            ...getParams(false, false, true) // fs (no student/mentor id)
        ];

        const [rows] = await db.query(query, allParams);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("GET_ALL_FACULTY_LOGS_ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Daily Mentor Head Report
// @route   GET /api/admin/mentor-head-report
const getDailyMentorHeadReport = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Fetch all active students to calculate remaining
        const [allStudents] = await db.query('SELECT id, name, registration_number FROM students WHERE status = "active"');
        const totalStudents = allStudents.length;

        // Fetch Mentor Heads
        const [mentorHeads] = await db.query(`
            SELECT id as mentor_head_id, name as mentor_head_name
            FROM users 
            WHERE role = 'mentor_head'
        `);

        const mappedData = [];

        for (const rh of mentorHeads) {
            // Get checked students for this mentor head today
            const [checkedRecords] = await db.query(`
                SELECT DISTINCT s.id, s.name, s.registration_number
                FROM student_verification v
                JOIN students s ON v.student_id = s.id
                WHERE v.mentor_head_id = ? AND v.date = ?
            `, [rh.mentor_head_id, targetDate]);

            // Calculate remaining
            const checkedIds = new Set(checkedRecords.map(s => s.id));
            const remainingRecords = allStudents.filter(s => !checkedIds.has(s.id));

            mappedData.push({
                mentorHeadId: rh.mentor_head_id,
                date: targetDate,
                mentorHeadName: rh.mentor_head_name,
                totalStudents: totalStudents,
                checkedToday: checkedRecords.length,
                remaining: remainingRecords.length,
                checkedStudents: checkedRecords,
                remainingStudents: remainingRecords
            });
        }

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
        const { role } = req.user;
        let query = 'SELECT * FROM admin_notifications';
        let params = [];

        if (role === 'mentor_head') {
            query += " WHERE action_type IN ('mentorship_report', 'fraud_alert', 'mentor_registration') OR (action_type = 'staff_update' AND message LIKE '%Mentor%')";
        }

        query += ' ORDER BY created_at DESC LIMIT 100';
        
        const [rows] = await db.query(query, params);
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

// @desc    Delete Single Notification
// @route   DELETE /api/admin/notifications/:id
const deleteNotification = async (req, res) => {
    try {
        await db.query('DELETE FROM admin_notifications WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: "Notification deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Clear All Notifications
// @route   DELETE /api/admin/notifications/clear-all
const clearAllNotifications = async (req, res) => {
    try {
        await db.query('DELETE FROM admin_notifications');
        res.status(200).json({ success: true, message: "All notifications cleared" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Student
// @route   PUT /api/admin/students/:id
const updateStudentForAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone_number, grade, subject, timetable, nextInstallment, status } = req.body;

        const [[oldStudent]] = await db.query('SELECT name FROM students WHERE id = ?', [id]);

        // Update ONLY in students table as requested
        const [result] = await db.query(
            'UPDATE students SET name = ?, email = ?, contact = ?, grade = ?, subject = ?, time_table = ?, next_installment_date = ?, status = ?, course_completed = ? WHERE id = ?',
            [name, email, phone_number, grade, subject, timetable, nextInstallment, status, req.body.course_completed || 0, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        await db.query('INSERT INTO admin_notifications (message, action_type, related_id) VALUES (?, ?, ?)', [
            `<b>Student Updated:</b> Profile of <b>${oldStudent?.name || id}</b> has been modified.`,
            'student_update',
            id
        ]);
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

        let result;
        const staffRoles = ['mentor', 'faculty'];
        const headRoles = ['mentor_head', 'academic_head', 'ssc', 'super_admin', 'sub_admin'];

        if (staffRoles.includes(role)) {
            const targetTable = role === 'mentor' ? 'mentors' : 'faculties';
            [result] = await db.query(
                `UPDATE ${targetTable} SET name = ?, email = ?, phone_number = ?, status = ? WHERE id = ?`,
                [name, email, phone_number, status, id]
            );
        } else if (headRoles.includes(role)) {
            [result] = await db.query(
                'UPDATE users SET name = ?, email = ?, phone_number = ?, status = ?, role = ? WHERE id = ?',
                [name, email, phone_number, status, role, id]
            );
        } else {
            return res.status(400).json({ success: false, message: "Invalid role for update" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User/Staff not found in the target table" });
        }

        await db.query('INSERT INTO admin_notifications (message, action_type, related_id) VALUES (?, ?, ?)', [
            `<b>Staff Updated:</b> ${role} <b>${name || id}</b> details were updated.`,
            'staff_update',
            id
        ]);
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
                id, roll_number, registration_number, name, email, contact as phone_number, grade, course, hour, 
                mentor_name as mentor, faculty_name as faculty, 
                subject, time_table as timetable, 
                next_installment_date as nextInstallment, 
                status, onboarding_status, 
                attendance_percentage, performance_status,
                course_completed,
                created_at,
                mentor_id,
                badge
            FROM students WHERE 1=1
        `;
        let params = [];

        if (mentor_id) {
            sql += ' AND mentor_id = ?';
            params.push(mentor_id);
        }

        if (req.query.faculty_id) {
            sql += ' AND faculty_id = ?';
            params.push(req.query.faculty_id);
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
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: "Access Denied. Admin authority required." });
        }

        // Check common timestamp column names
        const [tableInfo] = await db.query('SHOW COLUMNS FROM users');
        const hasCreatedAt = tableInfo.some(c => c.Field === 'createdAt');
        const hasCreatedAtSnake = tableInfo.some(c => c.Field === 'created_at');
        const timeColumn = hasCreatedAt ? 'createdAt' : (hasCreatedAtSnake ? 'created_at' : 'id');

        const [rows] = await db.query(
            `SELECT id, name, email, phone_number, status, isActive, permissions, ${timeColumn} as created_at FROM users WHERE role = "sub_admin"`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("GET_SUB_ADMINS_ERROR:", error);
        res.status(500).json({ success: false, message: "Failed to fetch sub-admins: " + error.message });
    }
};

// @desc    Create Sub Admin
// @route   POST /api/admin/sub-admins
const createSubAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: "Access Denied. Authority insufficient." });
        }

        const { name, email, password, phone_number, status, permissions } = req.body;

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
            'INSERT INTO users (name, email, password, phone_number, role, status, isActive, createdBy, permissions) VALUES (?, ?, ?, ?, "sub_admin", ?, 1, ?, ?)',
            [name, email, hashedPassword, phone_number, status || 'active', req.user.id, permissions ? JSON.stringify(permissions) : null]
        );

        res.status(201).json({ success: true, message: "Sub Admin created successfully", id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// @desc    Create Staff Member (Mentor, Faculty, Head, etc.)
// @route   POST /api/admin/staff
const createStaffMember = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: "Access Denied. Authority insufficient." });
        }

        const { name, email, password, phone_number, role, status, permissions } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: "Name, Email, Password and Role are required" });
        }

        // Security check: cannot create super_admin or student here
        if (['super_admin', 'student'].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role for this operation" });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, phone_number, role, status, isActive, createdBy, permissions) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
            [name, email, hashedPassword, phone_number, role, status || 'active', req.user.id, permissions ? JSON.stringify(permissions) : null]
        );

        res.status(201).json({ success: true, message: `${role} created successfully`, id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// @route   PUT /api/admin/sub-admins/:id
const updateSubAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: "Access Denied. Authority insufficient." });
        }

        const { id } = req.params;
        const { name, phone_number, status, password, permissions } = req.body;

        // Check if target is actually a sub_admin to prevent privilege escalation or modifying super_admin
        const [target] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
        if (!target.length || target[0].role !== 'sub_admin') {
            return res.status(400).json({ success: false, message: "Invalid target. Only sub_admins can be managed here." });
        }

        let query = 'UPDATE users SET name = ?, phone_number = ?, status = ?, isActive = ?, permissions = ?';
        let params = [name, phone_number, status, status === 'active' ? 1 : 0, permissions ? JSON.stringify(permissions) : null];

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
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: "Access Denied. Authority insufficient." });
        }

        const { id } = req.params;

        // Protection: System must not allow deleting the ACTIVE main super admin via this route
        const [target] = await db.query('SELECT name, role, status FROM users WHERE id = ?', [id]);
        if (!target.length) return res.status(404).json({ success: false, message: "User not found" });
        
        const userRole = target[0].role;
        if (userRole === 'super_admin' && target[0].status === 'active') {
            return res.status(403).json({ success: false, message: "Active Super Admin cannot be deleted." });
        }

        // Handle sub-admin dependencies (they might have registered users or created tasks)
        await db.query('UPDATE users SET registeredBy = NULL WHERE registeredBy = ?', [id]);
        await db.query('UPDATE students SET registeredBy = NULL WHERE registeredBy = ?', [id]);
        await db.query('UPDATE tasks SET assigned_by = NULL WHERE assigned_by = ?', [id]);
        await db.query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = ?', [id]);

        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: "Sub Admin deleted successfully. Integrity maintained." });
    } catch (error) {
        console.error("DELETE_SUBADMIN_ERROR:", error);
        res.status(500).json({ success: false, message: "Failed to delete sub-admin due to data dependency.", error: error.message });
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
                (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id AND t.status = 'Completed') as completedTasks,
                (SELECT COUNT(*) FROM student_interaction_logs sil WHERE sil.mentor_id = u.id) as logsReportCount,
                (SELECT COUNT(DISTINCT s.faculty_id) FROM students s WHERE s.mentor_id = u.id AND s.faculty_id IS NOT NULL AND s.status = 'active') as facultyCount,
                (SELECT COUNT(*) FROM students s WHERE s.mentor_id = u.id AND LOWER(s.performance_status) = 'critical' AND s.status = 'active') as criticalStudentsCount
            FROM mentors u
            WHERE ${whereClauses.join(' AND ').replace(/u\.role = 'mentor' AND? /g, '')}
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
            SELECT id, name, email, phone_number as phone, role, status, createdAt as created_at FROM users
            UNION ALL
            SELECT id, name, email, phone_number as phone, role, status, createdAt as created_at FROM mentors
            UNION ALL
            SELECT id, name, email, phone_number as phone, role, status, createdAt as created_at FROM faculties
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
            FROM faculties u
            WHERE 1=1
            ORDER BY u.name ASC
        `;
        const [rows] = await db.query(query);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
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
                FROM mentors u
                WHERE u.status = 'active'
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
                'this_week': 7,
                'last_week': 7,
                'last14': 14,
                'last30': 30,
                'this_month': 30,
                'last_month': 30,
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
                    DATE_FORMAT(created_at, '%Y-%m-%d') as date_label,
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN (status = 'Completed' OR status = 'Success') THEN 1 ELSE 0 END) as completed_tasks
                FROM tasks
                WHERE created_at >= ?
                GROUP BY date_label
                ORDER BY date_label ASC
            `, [startDate]);

            // Create a lookup map
            const dbDataMap = {};
            rows.forEach(row => {
                dbDataMap[row.date_label] = {
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
                JOIN faculties u ON fs.faculty_id = u.id
                JOIN session_attendance sa ON fs.id = sa.session_id
                JOIN students s ON sa.student_id = s.id
                LEFT JOIN mentors m ON s.mentor_id = m.id
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
