const db = require('../config/db');

const getFacultyQualityChecks = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT q.*, f.name as faculty_name 
            FROM ah_faculty_quality q
            JOIN users f ON q.faculty_id = f.id
            ORDER BY q.date DESC
        `);
        res.status(200).json({ success: true, data: rows });
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

module.exports = {
    getFacultyQualityChecks,
    addFacultyQualityCheck,
    getParentMeetings,
    getExamScores,
    getStudentGrowth,
    getFacultyReplacements,
    addFacultyReplacement,
    getEscalations,
    addEscalation
};
