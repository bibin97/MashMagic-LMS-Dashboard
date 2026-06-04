const db = require('../config/db');

const getDailyFacultyRotation = async (req, res) => {
    try {
        const ah_id = req.user.id;
        
        // Check if rotation already generated for today
        const [existing] = await db.query(`
            SELECT r.*, f.name as faculty_name, f.phone_number, f.subject
            FROM ah_faculty_rotation r
            JOIN users f ON r.faculty_id = f.id
            WHERE r.academic_head_id = ? AND r.rotation_date = CURDATE()
        `, [ah_id]);

        if (existing.length > 0) {
            return res.status(200).json({ success: true, data: existing });
        }

        // If not, fetch 3 faculties who haven't been in rotation recently
        const [faculties] = await db.query(`
            SELECT id FROM users 
            WHERE role = 'faculty' AND status = 'active'
            ORDER BY (SELECT MAX(rotation_date) FROM ah_faculty_rotation WHERE faculty_id = users.id) ASC, RAND()
            LIMIT 3
        `);

        if (faculties.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Insert into rotation
        const insertPromises = faculties.map(f => 
            db.query(`
                INSERT INTO ah_faculty_rotation (faculty_id, academic_head_id, rotation_date)
                VALUES (?, ?, CURDATE())
            `, [f.id, ah_id])
        );
        await Promise.all(insertPromises);

        // Fetch newly created rotation
        const [newRotation] = await db.query(`
            SELECT r.*, f.name as faculty_name, f.phone_number, f.subject
            FROM ah_faculty_rotation r
            JOIN users f ON r.faculty_id = f.id
            WHERE r.academic_head_id = ? AND r.rotation_date = CURDATE()
        `, [ah_id]);

        res.status(200).json({ success: true, data: newRotation });
    } catch (error) {
        console.error("Error generating daily rotation:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const updateFacultyRotation = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, next_call_date, notes } = req.body;
        const ah_id = req.user.id;

        await db.query(`
            UPDATE ah_faculty_rotation 
            SET status = ?, next_call_date = ?, notes = ?
            WHERE id = ? AND academic_head_id = ?
        `, [status, next_call_date || null, notes, id, ah_id]);

        res.status(200).json({ success: true, message: "Rotation updated" });
    } catch (error) {
        console.error("Error updating rotation:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getFacultyQualityChecks = async (req, res) => {
    try {
        const [evaluations] = await db.query(`
            SELECT q.*, f.name as faculty_name 
            FROM ah_faculty_quality q
            JOIN users f ON q.faculty_id = f.id
            ORDER BY q.date DESC
        `);

        // Fetch live scheduled sessions for today (from timetable)
        const [liveSessions] = await db.query(`
            SELECT t.id, t.faculty_id, t.start_time, t.end_time, COALESCE(t.chapter, t.session_type, 'General Session') as topic, t.status, s.meeting_link,
                   f.name as faculty_name, s.name as student_name
            FROM timetable t
            LEFT JOIN users f ON t.faculty_id = f.id
            JOIN students s ON t.student_id = s.id
            WHERE t.date = CURDATE()
            ORDER BY t.start_time ASC
        `);

        res.status(200).json({ success: true, data: { evaluations, liveSessions } });
    } catch (error) {
        console.error("Error fetching faculty quality:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const addFacultyQualityCheck = async (req, res) => {
    try {
        const { faculty_id, class_topic, score, remarks } = req.body;
        const ah_id = req.user.id;
        
        await db.query(`
            INSERT INTO ah_faculty_quality (faculty_id, academic_head_id, class_topic, score, remarks)
            VALUES (?, ?, ?, ?, ?)
        `, [faculty_id, ah_id, class_topic, score, remarks]);
        
        res.status(201).json({ success: true, message: "Quality check added successfully" });
    } catch (error) {
        console.error("Error adding faculty quality:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getParentMeetings = async (req, res) => {
    try {
        // We reuse the existing ah_parent_meetings table to keep it synchronized across heads
        const [rows] = await db.query(`
            SELECT p.*, s.name as student_name, u.name as academic_head_name
            FROM ah_parent_meetings p
            JOIN students s ON p.student_id = s.id
            JOIN users u ON p.academic_head_id = u.id
            ORDER BY p.meeting_date DESC, p.meeting_time DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching parent meetings:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getExamScores = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.*, s.name as student_name 
            FROM student_exams e
            JOIN students s ON e.student_id = s.id
            ORDER BY e.created_at DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching exam scores:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getStudentGrowth = async (req, res) => {
    try {
        // Fetch students with active status and their assigned mentors/faculties
        const [rows] = await db.query(`
            SELECT s.id, s.name, s.batch, m.name as mentor_name, f.name as faculty_name,
                   (SELECT AVG(score) FROM student_exams WHERE student_id = s.id) as avg_score
            FROM students s
            LEFT JOIN users m ON s.mentor_id = m.id
            LEFT JOIN users f ON s.faculty_id = f.id
            WHERE s.status = 'active'
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching student growth:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getFacultyReplacements = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, f.name as faculty_name 
            FROM ah_faculty_replacements r
            JOIN users f ON r.faculty_id = f.id
            ORDER BY r.date DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching replacements:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const addFacultyReplacement = async (req, res) => {
    try {
        const { faculty_id, reason } = req.body;
        const ah_id = req.user.id;
        
        await db.query(`
            INSERT INTO ah_faculty_replacements (faculty_id, academic_head_id, reason)
            VALUES (?, ?, ?)
        `, [faculty_id, ah_id, reason]);
        
        res.status(201).json({ success: true, message: "Replacement request added" });
    } catch (error) {
        console.error("Error adding replacement:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getEscalations = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.*, s.name as student_name 
            FROM ah_escalations e
            LEFT JOIN students s ON e.student_id = s.id
            ORDER BY e.created_at DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching escalations:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const addEscalation = async (req, res) => {
    try {
        const { student_id, issue_type, description, priority } = req.body;
        const ah_id = req.user.id;
        
        await db.query(`
            INSERT INTO ah_escalations (student_id, academic_head_id, issue_type, description, priority)
            VALUES (?, ?, ?, ?, ?)
        `, [student_id || null, ah_id, issue_type, description, priority || 'medium']);
        
        res.status(201).json({ success: true, message: "Escalation created" });
    } catch (error) {
        console.error("Error adding escalation:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getAllStudents = async (req, res) => {
    try {
        let query = `
            SELECT id, name, course, subject, grade, mentor_id, mentor_name, faculty_id, faculty_name, course_completed
            FROM students
            WHERE 1=1
        `;
        const queryParams = [];

        if (req.query.mentor_id) {
            query += ` AND mentor_id = ?`;
            queryParams.push(req.query.mentor_id);
        }

        query += ` ORDER BY name ASC`;

        const [students] = await db.query(query, queryParams);
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        console.error("Error fetching all students:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getCourseCompletions = async (req, res) => {
    try {
        const [students] = await db.query(`
            SELECT 
                s.id, s.name, s.course, s.subject, s.course_completed,
                s.completion_remarks, s.completion_file, s.course_completed_date,
                s.mentor_name, s.faculty_name
            FROM students s
            ORDER BY s.id DESC
        `);
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        console.error("Error fetching course completions:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const markCourseCompleted = async (req, res) => {
    try {
        const studentId = req.params.id;
        const { remarks } = req.body;
        const file = req.file;

        let completionFileUrl = null;
        if (file) {
            completionFileUrl = `/uploads/completions/${file.filename}`;
        }

        await db.query(`
            UPDATE students 
            SET course_completed = 1,
                completion_remarks = ?,
                completion_file = ?,
                course_completed_date = CURDATE()
            WHERE id = ?
        `, [remarks || '', completionFileUrl, studentId]);

        res.status(200).json({ success: true, message: "Course marked as completed" });
    } catch (error) {
        console.error("Error marking course complete:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    getDailyFacultyRotation,
    updateFacultyRotation,
    getFacultyQualityChecks,
    addFacultyQualityCheck,
    getParentMeetings,
    getExamScores,
    getStudentGrowth,
    getFacultyReplacements,
    addFacultyReplacement,
    getEscalations,
    addEscalation,
    getAllStudents,
    getCourseCompletions,
    markCourseCompleted
};
