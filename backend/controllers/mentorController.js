const db = require('../config/db');

// @desc    Get mentor dashboard stats
// @route   GET /api/mentor/dashboard
const getMentorDashboard = async (req, res) => {
    try {
        const mentorId = req.user.id;
        console.log("Fetching dashboard for mentor:", mentorId);

        // Stats queries
        let studentCount, sessionCount, pendingTasks, completedTasks;

        try {
            [studentCount] = await db.query('SELECT COUNT(*) as count FROM students WHERE mentor_id = ?', [mentorId]);
        } catch (err) { console.error("Error fetching students count:", err); throw err; }

        try {
            [sessionCount] = await db.query('SELECT COUNT(*) as count FROM mentor_timetable WHERE mentor_id = ?', [mentorId]);
        } catch (err) { console.error("Error fetching timetable count:", err); throw err; }

        try {
            [pendingTasks] = await db.query('SELECT COUNT(*) as count FROM tasks WHERE mentor_id = ? AND status != "Completed"', [mentorId]);
        } catch (err) { console.error("Error fetching pending tasks:", err); throw err; }

        try {
            [completedTasks] = await db.query('SELECT COUNT(*) as count FROM tasks WHERE mentor_id = ? AND status = "Completed"', [mentorId]);
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
            WHERE s.mentor_id = ? AND s.status = 'active'
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
        const [facultyLogs] = await db.query('SELECT * FROM faculty_interaction_logs WHERE student_id = ? ORDER BY created_at DESC', [studentId]);

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
        const [rows] = await db.query('SELECT * FROM tasks WHERE mentor_id = ? ORDER BY created_at DESC', [mentorId]);
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
            'UPDATE tasks SET status = "Completed" WHERE id = ? AND mentor_id = ?',
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

// @desc    Get mentor timetable
// @route   GET /api/mentor/timetable
const getMentorTimetable = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const [rows] = await db.query(`
            SELECT t.*, s.name as student_name 
            FROM mentor_timetable t
            JOIN students s ON t.student_id = s.id
            WHERE t.mentor_id = ? 
            ORDER BY t.date ASC, t.start_time ASC
        `, [mentorId]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Complete session
// @route   PUT /api/mentor/timetable/:id/complete
const completeSession = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const sessionId = req.params.id;

        const [result] = await db.query(
            'UPDATE mentor_timetable SET status = "Completed", completed_at = NOW() WHERE id = ? AND mentor_id = ?',
            [sessionId, mentorId]
        );

        res.status(200).json({ success: true, message: "Session marked as completed" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Cancel session
// @route   PUT /api/mentor/timetable/:id/cancel
const cancelSession = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const sessionId = req.params.id;

        await db.query(
            'UPDATE mentor_timetable SET status = "Cancelled" WHERE id = ? AND mentor_id = ?',
            [sessionId, mentorId]
        );

        res.status(200).json({ success: true, message: "Session cancelled" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Postpone session
// @route   PUT /api/mentor/timetable/:id/postpone
const postponeSession = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const sessionId = req.params.id;
        const { new_date } = req.body;

        await db.query(
            'UPDATE mentor_timetable SET status = "Postponed", new_date = ? WHERE id = ? AND mentor_id = ?',
            [new_date, sessionId, mentorId]
        );

        res.status(200).json({ success: true, message: "Session postponed" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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
            student_requests, parent_update_priority, mentor_action_needed, mentor_notes, connected_today = false
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
                student_requests, parent_update_priority, mentor_action_needed, mentor_notes, connected_today
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [
            mentorId, student_id, date, nextSessionNumber,
            connection_method,
            self_clarity, confusing_topic, can_solve_independently,
            homework_status, homework_difficulty, revision_quality,
            confidence, motivation_level, exam_anxiety, focus_level,
            student_requests, parent_update_priority, mentor_action_needed, mentor_notes, connected_today
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
            student_performance, homework_given, homework_status,
            issues_reported, mentor_action, parent_update_needed,
            notes, screenshot_url
        } = req.body;

        // Note: Faculty logs might not be tied to a mentor_timetable if it's a faculty session, 
        // but the Mentor is Recording it.
        // We will just insert it.

        const query = `
            INSERT INTO faculty_interaction_logs (
                mentor_id, student_id, session_id, date, session_number,
                chapter, session_type, topics_covered,
                student_performance, homework_given, homework_status,
                issues_reported, mentor_action, parent_update_needed,
                notes, screenshot_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [
            mentorId, student_id, session_id, date, session_number,
            chapter, session_type, topics_covered,
            student_performance, homework_given, homework_status,
            issues_reported, mentor_action, parent_update_needed,
            notes, screenshot_url
        ]);

        res.status(201).json({ success: true, message: "Faculty interaction log saved" });
    } catch (error) {
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
// @route   GET /api/mentor/faculty-logs
const getFacultyLogs = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const [rows] = await db.query(`
            SELECT logs.*, s.name as student_name
            FROM faculty_interaction_logs logs
            JOIN students s ON logs.student_id = s.id
            WHERE logs.mentor_id = ?
            ORDER BY logs.created_at DESC
        `, [mentorId]);
        res.status(200).json({ success: true, data: rows });
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

module.exports = {
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
};
