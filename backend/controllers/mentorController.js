const db = require('../config/db');

// @desc    Get mentor dashboard stats
// @route   GET /api/mentor/dashboard
const getMentorDashboard = async (req, res) => {
    try {
        const mentorId = req.user.id;

        // Stats queries
        let studentCount, sessionCount, pendingTasks, completedTasks;

        try {
            [studentCount] = await db.query('SELECT COUNT(*) as count FROM students WHERE mentor_id = ?', [mentorId]);
        } catch (err) { console.error("Error fetching students count:", err); throw err; }

        try {
            [sessionCount] = await db.query('SELECT COUNT(*) as count FROM mentor_timetable WHERE mentor_id = ?', [mentorId]);
        } catch (err) { console.error("Error fetching timetable count:", err); throw err; }

        try {
            [pendingTasks] = await db.query('SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status != "Completed"', [mentorId]);
        } catch (err) { console.error("Error fetching pending tasks:", err); throw err; }

        try {
            [completedTasks] = await db.query('SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = "Completed"', [mentorId]);
        } catch (err) { console.error("Error fetching completed tasks:", err); throw err; }

        res.status(200).json({
            success: true,
            data: {
                totalStudents: studentCount[0].count,
                totalSessions: sessionCount[0].count,
                pendingTasks: pendingTasks[0].count,
                completedTasks: completedTasks[0].count
            }
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get assigned students
// @route   GET /api/mentor/students
const getMentorStudents = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const [rows] = await db.query(`
            SELECT s.*, 
            CASE WHEN EXISTS (
                SELECT 1 FROM student_interaction_logs sil 
                WHERE sil.student_id = s.id AND sil.date = CURDATE() AND sil.connected_today = TRUE
            ) THEN 1 ELSE 0 END as connected_today,
            s.onboarding_status
            FROM students s 
            WHERE s.mentor_id = ?
        `, [mentorId]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get student details
// @route   GET /api/mentor/students/:id
const getStudentDetails = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const studentId = req.params.id;

        const [student] = await db.query('SELECT * FROM students WHERE id = ? AND mentor_id = ?', [studentId, mentorId]);

        if (!student.length) {
            return res.status(404).json({ success: false, message: "Student not found or not assigned to you" });
        }

        const [timetable] = await db.query('SELECT * FROM mentor_timetable WHERE student_id = ? ORDER BY date ASC, start_time ASC', [studentId]);
        const [studentLogs] = await db.query('SELECT * FROM student_interaction_logs WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
        const [facultyLogs] = await db.query(`
            SELECT *, IF(parent_update_needed = 1, 'Yes', 'No') as parent_update_needed 
            FROM faculty_interaction_logs 
            WHERE student_id = ? 
            ORDER BY created_at DESC
        `, [studentId]);

        res.status(200).json({
            success: true,
            data: {
                ...student[0],
                timetable,
                studentLogs,
                facultyLogs
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get mentor tasks
// @route   GET /api/mentor/tasks
const getMentorTasks = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const [rows] = await db.query('SELECT * FROM tasks WHERE assigned_to = ? ORDER BY created_at DESC', [mentorId]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Complete mentor task
// @route   PUT /api/mentor/tasks/:id/complete
const completeMentorTask = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const taskId = req.params.id;

        const [result] = await db.query(
            'UPDATE tasks SET status = "Completed", completed_at = CURRENT_TIMESTAMP WHERE id = ? AND assigned_to = ?',
            [taskId, mentorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        res.status(200).json({ success: true, message: "Task marked as completed" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get mentor timetable with filters and summary
// @route   GET /api/mentor/timetable
const getMentorTimetable = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { student_id, status, start_date, end_date } = req.query;

        let query = `
            SELECT t.*, s.name as student_name 
            FROM mentor_timetable t
            JOIN students s ON t.student_id = s.id
            WHERE t.mentor_id = ?
        `;
        const params = [mentorId];

        if (student_id) {
            query += ' AND t.student_id = ?';
            params.push(student_id);
        }
        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }
        if (start_date && end_date) {
            query += ' AND t.date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query += ' ORDER BY t.date DESC, t.start_time DESC';

        const [rows] = await db.query(query, params);

        // Calculate summary
        const summary = {
            total: rows.length,
            completed: rows.filter(r => r.status === 'Completed').length,
            cancelled: rows.filter(r => r.status === 'Cancelled').length,
            postponed: rows.filter(r => r.status === 'Postponed').length,
            upcoming: rows.filter(r => r.status === 'Scheduled').length,
            noShow: rows.filter(r => r.status === 'No Show').length
        };

        res.status(200).json({ success: true, data: rows, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new session
// @route   POST /api/mentor/timetable
const createSession = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const {
            student_id, date, start_time, end_time,
            chapter, session_type, status, status_reason, notes
        } = req.body;

        // 1. Conflict Check for Mentor
        const [conflicts] = await db.query(`
            SELECT id FROM mentor_timetable 
            WHERE mentor_id = ? AND date = ? 
            AND status != 'Cancelled'
            AND (
                (start_time < ? AND end_time > ?)
            )
        `, [mentorId, date, end_time, start_time]);

        if (conflicts.length > 0) {
            return res.status(400).json({ success: false, message: "Time conflict detected with another session." });
        }

        // 2. Auto-generate Session Number per Student
        const [lastSession] = await db.query(
            'SELECT MAX(session_number) as lastNum FROM mentor_timetable WHERE student_id = ?',
            [student_id]
        );
        const session_number = (lastSession[0].lastNum || 0) + 1;

        // 3. Calculate Duration
        const start = new Date(`1970-01-01T${start_time}`);
        const end = new Date(`1970-01-01T${end_time}`);
        const diffMs = end - start;
        const diffMins = Math.round(diffMs / 60000);
        const duration = `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;

        const [result] = await db.query(`
            INSERT INTO mentor_timetable (
                mentor_id, student_id, session_number, date, start_time, end_time,
                duration, chapter, session_type, status, status_reason, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            mentorId, student_id, session_number, date, start_time, end_time,
            duration, chapter, session_type, status || 'Scheduled', status_reason, notes
        ]);

        res.status(201).json({ success: true, message: "Session created successfully", id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update session
// @route   PUT /api/mentor/timetable/:id
const updateSession = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const sessionId = req.params.id;
        const {
            date, start_time, end_time,
            chapter, session_type, status, status_reason, notes
        } = req.body;

        // Conflict check excluding current session
        const [conflicts] = await db.query(`
            SELECT id FROM mentor_timetable 
            WHERE mentor_id = ? AND date = ? AND id != ?
            AND status != 'Cancelled'
            AND (
                (start_time < ? AND end_time > ?)
            )
        `, [mentorId, date, sessionId, end_time, start_time]);

        if (conflicts.length > 0) {
            return res.status(400).json({ success: false, message: "Time conflict detected." });
        }

        // Calculate Duration
        const start = new Date(`1970-01-01T${start_time}`);
        const end = new Date(`1970-01-01T${end_time}`);
        const diffMs = end - start;
        const diffMins = Math.round(diffMs / 60000);
        const duration = `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;

        await db.query(`
            UPDATE mentor_timetable SET 
                date = ?, start_time = ?, end_time = ?, duration = ?,
                chapter = ?, session_type = ?, status = ?, status_reason = ?, notes = ?
            WHERE id = ? AND mentor_id = ?
        `, [
            date, start_time, end_time, duration,
            chapter, session_type, status, status_reason, notes,
            sessionId, mentorId
        ]);

        res.status(200).json({ success: true, message: "Session updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete session
const deleteSession = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const sessionId = req.params.id;

        const [result] = await db.query('DELETE FROM mentor_timetable WHERE id = ? AND mentor_id = ?', [sessionId, mentorId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        res.status(200).json({ success: true, message: "Session deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Removed complete/cancel/postpone legacy routes in favor of unified updateSession

// @desc    Create student interaction log
// @route   POST /api/mentor/student-log
// @desc    Create student interaction log
// @route   POST /api/mentor/student-log
const createStudentLog = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const {
            student_id, date, connection_method,
            // Section 2
            self_clarity, confusing_topic, can_solve_independently,
            // Section 3
            homework_status, homework_difficulty, revision_quality,
            // Section 4
            confidence, motivation_level, exam_anxiety, focus_level,
            // Section 5
            student_requests, parent_update_priority, mentor_action_needed, mentor_notes, connected_today = false,
            screenshot_url = null
        } = req.body;

        if (!student_id || !date || !connection_method) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Validate numeric ranges
        if (self_clarity < 0 || self_clarity > 100) {
            return res.status(400).json({ success: false, message: "Self Clarity must be 0-100" });
        }
        if (confidence < 1 || confidence > 5) {
            return res.status(400).json({ success: false, message: "Confidence must be 1-5" });
        }

        // Auto-increment session number for this student
        const [maxSessionResult] = await db.query(
            'SELECT MAX(session_number) as max_sn FROM student_interaction_logs WHERE student_id = ?',
            [student_id]
        );
        const nextSessionNumber = (maxSessionResult[0].max_sn || 0) + 1;

        const query = `
            INSERT INTO student_interaction_logs (
                mentor_id, student_id, date, session_number,
                connection_method,
                self_clarity, confusing_topic, can_solve_independently,
                homework_status, homework_difficulty, revision_quality,
                confidence, motivation_level, exam_anxiety, focus_level,
                student_requests, parent_update_priority, mentor_action_needed, mentor_notes, connected_today,
                screenshot_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [
            mentorId, student_id, date, nextSessionNumber,
            connection_method,
            self_clarity, confusing_topic, can_solve_independently,
            homework_status, homework_difficulty, revision_quality,
            confidence, motivation_level, exam_anxiety, focus_level,
            student_requests, parent_update_priority, mentor_action_needed, mentor_notes, connected_today,
            screenshot_url
        ]);

        res.status(201).json({ success: true, message: "Student interaction log saved successfully", session_number: nextSessionNumber });
    } catch (error) {
        console.error("Create Log Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create faculty interaction log
// @route   POST /api/mentor/faculty-log
const createFacultyLog = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const {
            student_id, session_id, date, session_number,
            chapter, session_type, topics_covered,
            student_performance, engagement_level, homework_given, homework_status, test_score,
            issues_reported, risk_level, remedial_plan, parent_update_needed,
            faculty_intervention_required, notes, screenshot_url
        } = req.body;

        // Fetch faculty_id from students table
        const [student] = await db.query('SELECT faculty_id FROM students WHERE id = ?', [student_id]);
        const facultyId = student.length > 0 ? student[0].faculty_id : null;

        // Auto-increment session number if not provided
        let finalSessionNumber = session_number;
        if (!finalSessionNumber) {
            const [lastSession] = await db.query(
                'SELECT MAX(session_number) as lastNum FROM faculty_interaction_logs WHERE student_id = ? AND mentor_id = ?',
                [student_id, mentorId]
            );
            finalSessionNumber = (lastSession[0].lastNum || 0) + 1;
        }

        const query = `
            INSERT INTO faculty_interaction_logs (
                mentor_id, faculty_id, student_id, session_id, date, session_number,
                chapter, session_type, topics_covered,
                student_performance, engagement_level, homework_given, homework_status, test_score,
                issues_reported, risk_level, remedial_plan, parent_update_needed,
                faculty_intervention_required, notes, screenshot_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [
            mentorId, facultyId, student_id, session_id || null, date, finalSessionNumber,
            chapter, session_type, topics_covered,
            student_performance, engagement_level, homework_given, homework_status, test_score || null,
            issues_reported, risk_level, remedial_plan, parent_update_needed === 'Yes' ? 1 : 0,
            faculty_intervention_required, notes, screenshot_url
        ]);

        res.status(201).json({ success: true, message: "Faculty interaction log saved", session_number: finalSessionNumber });
    } catch (error) {
        console.error("Create Faculty Log Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get mentor student logs
// @route   GET /api/mentor/student-logs
const getStudentLogs = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const [rows] = await db.query(`
            SELECT logs.*, s.name as student_name 
            FROM student_interaction_logs logs
            JOIN students s ON logs.student_id = s.id
            WHERE logs.mentor_id = ? 
            ORDER BY logs.created_at DESC
        `, [mentorId]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get mentor faculty logs
const getFacultyLogs = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const [rows] = await db.query(`
            SELECT logs.*, s.name as student_name,
            IF(logs.parent_update_needed = 1, 'Yes', 'No') as parent_update_needed
            FROM faculty_interaction_logs logs
            JOIN students s ON logs.student_id = s.id
            WHERE logs.mentor_id = ?
            ORDER BY logs.date DESC, logs.session_number DESC
        `, [mentorId]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update faculty interaction log
// @route   PUT /api/mentor/faculty-log/:id
const updateFacultyLog = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const logId = req.params.id;
        const {
            date, session_number, chapter, session_type, topics_covered,
            student_performance, engagement_level, homework_given, homework_status, test_score,
            issues_reported, risk_level, remedial_plan, parent_update_needed,
            faculty_intervention_required, notes, screenshot_url
        } = req.body;

        const [result] = await db.query(`
            UPDATE faculty_interaction_logs SET 
                date = ?, session_number = ?, chapter = ?, session_type = ?, topics_covered = ?,
                student_performance = ?, engagement_level = ?, homework_given = ?, homework_status = ?, test_score = ?,
                issues_reported = ?, risk_level = ?, remedial_plan = ?, parent_update_needed = ?,
                faculty_intervention_required = ?, notes = ?, screenshot_url = ?
            WHERE id = ? AND mentor_id = ?
        `, [
            date, session_number, chapter, session_type, topics_covered,
            student_performance, engagement_level, homework_given, homework_status, test_score || null,
            issues_reported, risk_level, remedial_plan, parent_update_needed === 'Yes' ? 1 : 0,
            faculty_intervention_required, notes, screenshot_url,
            logId, mentorId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Log not found or unauthorized" });
        }

        res.status(200).json({ success: true, message: "Faculty log updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete faculty interaction log
// @route   DELETE /api/mentor/faculty-log/:id
const deleteFacultyLog = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const logId = req.params.id;

        const [result] = await db.query('DELETE FROM faculty_interaction_logs WHERE id = ? AND mentor_id = ?', [logId, mentorId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Log not found or unauthorized" });
        }

        res.status(200).json({ success: true, message: "Faculty log deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle student connected today status
// @route   PUT /api/mentor/students/:studentId/connection
const toggleStudentConnection = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { studentId } = req.params;
        const { connected_today } = req.body;
        const date = new Date().toISOString().split('T')[0];

        if (connected_today) {
            // Check if log already exists
            const [existing] = await db.query('SELECT id FROM student_interaction_logs WHERE mentor_id = ? AND student_id = ? AND date = ?', [mentorId, studentId, date]);
            if (!existing.length) {
                await db.query(`
                    INSERT INTO student_interaction_logs (mentor_id, student_id, date, mentor_notes, connected_today)
                    VALUES (?, ?, ?, 'Quick connection marked by Mentor', TRUE)
                 `, [mentorId, studentId, date]);
            } else {
                await db.query(`
                    UPDATE student_interaction_logs SET connected_today = TRUE WHERE mentor_id = ? AND student_id = ? AND date = ?
                 `, [mentorId, studentId, date]);
            }
        } else {
            await db.query(`
                UPDATE student_interaction_logs SET connected_today = FALSE WHERE mentor_id = ? AND student_id = ? AND date = ?
             `, [mentorId, studentId, date]);
        }
        res.status(200).json({ success: true, message: 'Connection status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Complete student onboarding
// @route   PUT /api/mentor/students/:id/onboard
const completeOnboarding = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { studentId } = req.params;

        const [result] = await db.query(
            'UPDATE students SET onboarding_status = "completed" WHERE id = ? AND mentor_id = ?',
            [studentId, mentorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Student not found or not assigned to you" });
        }

        res.status(200).json({ success: true, message: "Student onboarding completed" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create batch timetable (For Onboarding)
// @route   POST /api/mentor/timetable/batch
const createBatchTimetable = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const mentorId = req.user.id;
        const { student_id, sessions } = req.body;

        if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
            return res.status(400).json({ success: false, message: "No sessions provided" });
        }

        // 1. Get starting session number
        const [lastSession] = await connection.query(
            'SELECT MAX(session_number) as lastNum FROM mentor_timetable WHERE student_id = ?',
            [student_id]
        );
        let currentSessionNum = (lastSession[0].lastNum || 0) + 1;

        // 2. Prepare and Insert each session
        for (const session of sessions) {
            const { date, start_time, end_time, chapter, session_type, notes } = session;

            // Calculate duration
            const start = new Date(`1970-01-01T${start_time}`);
            const end = new Date(`1970-01-01T${end_time}`);
            const diffMs = end - start;
            const diffMins = Math.round(diffMs / 60000);
            const duration = `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;

            await connection.query(`
                INSERT INTO mentor_timetable (
                    mentor_id, student_id, session_number, date, start_time, end_time,
                    duration, chapter, session_type, status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?)
            `, [
                mentorId, student_id, currentSessionNum++, date, start_time, end_time,
                duration, chapter, session_type || 'Regular Class', notes || ''
            ]);
        }

        // 3. Mark student as onboarded if not already
        await connection.query(
            'UPDATE students SET onboarding_status = "completed" WHERE id = ? AND mentor_id = ?',
            [student_id, mentorId]
        );

        await connection.commit();
        res.status(201).json({ success: true, message: "Timetable created and onboarding completed" });
    } catch (error) {
        await connection.rollback();
        console.error("Batch Timetable Error:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// @desc    Get pending exams list for mentor
// @route   GET /api/mentor/exams/pending
const getPendingExams = async (req, res) => {
    try {
        const mentorId = req.user.id;

        // 1. Get all active students for this mentor
        const [students] = await db.query('SELECT id, name FROM students WHERE mentor_id = ? AND status = "active"', [mentorId]);

        let pendingExams = [];

        for (const student of students) {
            // 2. Get current session number milestone for this student
            const [rows] = await db.query(
                'SELECT MAX(session_number) as current_max FROM mentor_timetable WHERE student_id = ? AND status != "Cancelled"',
                [student.id]
            );

            const currentMax = rows[0].current_max || 0;

            // 3. For every 5 sessions (5, 10, 15...), check if an exam record exists
            for (let milestone = 5; milestone <= currentMax; milestone += 5) {
                const [existing] = await db.query(
                    'SELECT id, status, score, postponed_date FROM student_exams WHERE student_id = ? AND milestone_session = ?',
                    [student.id, milestone]
                );

                if (existing.length === 0) {
                    pendingExams.push({
                        student_id: student.id,
                        student_name: student.name,
                        milestone: milestone,
                        status: 'Required',
                        session_count: currentMax
                    });
                } else if (existing[0].status === 'Postponed') {
                    const postponedDate = new Date(existing[0].postponed_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (today >= postponedDate) {
                        pendingExams.push({
                            id: existing[0].id,
                            student_id: student.id,
                            student_name: student.name,
                            milestone: milestone,
                            status: 'Postponed (Due)',
                            session_count: currentMax,
                            postponed_date: existing[0].postponed_date
                        });
                    }
                }
            }
        }

        res.status(200).json({ success: true, data: pendingExams });
    } catch (error) {
        console.error("Get Pending Exams Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit exam result or postponement
// @route   POST /api/mentor/exams/submit
const submitExamResult = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { student_id, milestone, score, type, postponed_date, reason } = req.body;

        if (!student_id || !milestone || !type) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        if (type === 'Complete') {
            if (!score) return res.status(400).json({ success: false, message: "Score is required for completion" });

            await db.query(`
                INSERT INTO student_exams (student_id, mentor_id, milestone_session, score, status)
                VALUES (?, ?, ?, ?, 'Completed')
                ON DUPLICATE KEY UPDATE score = VALUES(score), status = 'Completed', postponed_date = NULL, reason = NULL
            `, [student_id, mentorId, milestone, score]);

            res.status(200).json({ success: true, message: "Exam score submitted successfully" });
        } else if (type === 'Postpone') {
            if (!postponed_date || !reason) {
                return res.status(400).json({ success: false, message: "Postponed date and reason are required" });
            }

            await db.query(`
                INSERT INTO student_exams (student_id, mentor_id, milestone_session, status, postponed_date, reason)
                VALUES (?, ?, ?, 'Postponed', ?, ?)
                ON DUPLICATE KEY UPDATE status = 'Postponed', postponed_date = VALUES(postponed_date), reason = VALUES(reason)
            `, [student_id, mentorId, milestone, postponed_date, reason]);

            res.status(200).json({ success: true, message: "Exam postponed successfully" });
        } else {
            res.status(400).json({ success: false, message: "Invalid submission type" });
        }
    } catch (error) {
        console.error("Submit Exam Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Daily Hours Log ---
const logDailyHours = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { student_id, hours, date } = req.body;

        if (!student_id || !hours || !date) {
            return res.status(400).json({ success: false, message: 'Student ID, hours, and date are required' });
        }

        const formattedDate = new Date(date).toISOString().split('T')[0];

        // Upsert daily log
        await db.query(`
            INSERT INTO daily_hours_log (student_id, mentor_id, hours, date)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE hours = VALUES(hours)
        `, [student_id, mentorId, hours, formattedDate]);

        res.status(200).json({ success: true, message: 'Daily hours logged successfully' });
    } catch (error) {
        console.error("Error logging daily hours:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getDailyHours = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const [logs] = await db.query('SELECT * FROM daily_hours_log WHERE student_id = ? ORDER BY date DESC', [studentId]);
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error("Error fetching daily hours:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
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
    createFacultyLog,
    updateFacultyLog,
    deleteFacultyLog,
    getStudentLogs,
    getFacultyLogs,
    toggleStudentConnection,

    completeOnboarding,
    createBatchTimetable,
    getPendingExams,
    submitExamResult,
    logDailyHours,
    getDailyHours
};

