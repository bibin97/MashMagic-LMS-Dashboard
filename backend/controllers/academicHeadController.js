const db = require('../config/db');
const bcrypt = require('bcrypt');

// @desc    Get dropdown data for student registration
// @route   GET /api/academic-head/dropdowns
const getDropdownData = async (req, res) => {
    try {
        const [mentors] = await db.query('SELECT id, name FROM users WHERE role = "mentor" AND status = "active"');
        const [faculties] = await db.query('SELECT id, name FROM users WHERE role = "faculty" AND status = "active"');
        res.status(200).json({ success: true, count: { mentors: mentors.length, faculties: faculties.length }, data: { mentors, faculties } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Register a new student
// @route   POST /api/academic-head/register-student
const registerStudent = async (req, res) => {
    try {
        const {
            name, grade, subject, facultyId, mentorId, course, hour, nextInstallmentDate, admissionType
        } = req.body;

        // Fetch names for legacy columns if needed
        let mentorName = null;
        let facultyName = null;

        if (mentorId) {
            const [mRows] = await db.query('SELECT name FROM users WHERE id = ?', [mentorId]);
            if (mRows.length) mentorName = mRows[0].name;
        }

        if (facultyId) {
            const [fRows] = await db.query('SELECT name FROM users WHERE id = ?', [facultyId]);
            if (fRows.length) facultyName = fRows[0].name;
        }

        const onboardingStatus = admissionType === 'existing' ? 'completed' : 'pending';

        const query = `
            INSERT INTO students (
                name, grade, subject, course, hour, 
                mentor_id, mentor_name, faculty_id, faculty_name, next_installment_date,
                time_table, status, onboarding_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [studentResult] = await db.query(query, [
            name, grade, subject, course, hour,
            mentorId || null, mentorName, facultyId || null, facultyName, nextInstallmentDate || null,
            JSON.stringify({}), // Empty timetable initially
            'pending', // This is global status (approval status)
            onboardingStatus
        ]);

        const studentId = studentResult.insertId;

        // Schedule first session if mentor exists
        if (mentorId) {
            await db.query(`
                INSERT INTO mentor_timetable (
                    mentor_id, student_id, session_number, date, status, chapter_topic
                ) VALUES (?, ?, ?, CURDATE(), ?, ?)
            `, [mentorId, studentId, 1, 'Scheduled', 'Initial Introduction Session']);
        }

        res.status(201).json({ success: true, message: "Student registered successfully. Pending Admin approval." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Register a new faculty
// @route   POST /api/academic-head/register-faculty
const registerFaculty = async (req, res) => {
    try {
        const { name, email, phone_number, place } = req.body;

        // Default password for faculty added by head
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(phone_number || "faculty123", salt);

        const [result] = await db.query(
            'INSERT INTO users (name, email, phone_number, place, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, phone_number, place, hashedPassword, 'faculty', 'pending']
        );

        res.status(201).json({ success: true, message: "Faculty registered successfully. Pending Admin approval." });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Email or Phone already exists." });
        }
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Register a new counselor
// @route   POST /api/academic-head/register-counselor
const registerCounselor = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, 'academic_counselor', 'pending']
        );

        res.status(201).json({ success: true, message: "Counselor account created successfully. Pending Admin approval." });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Email already exists." });
        }
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

module.exports = {
    getDropdownData,
    registerStudent,
    registerFaculty,
    registerCounselor
};
