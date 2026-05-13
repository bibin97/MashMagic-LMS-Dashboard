const db = require('../config/db');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// @desc    Get exam analytics
const getExamAnalytics = async (req, res) => {
    try {
        const { student_id } = req.query;
        let query = student_id ? 
            'SELECT milestone_session as subject, CAST(score AS DECIMAL(10,2)) as percentage FROM student_exams WHERE status = "Completed" AND student_id = ?' :
            'SELECT milestone_session as subject, AVG(CAST(score AS DECIMAL(10,2))) as percentage FROM student_exams WHERE status = "Completed" GROUP BY milestone_session';
        const [stats] = await db.query(query, student_id ? [student_id] : []);
        res.status(200).json({ success: true, data: stats });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const safeQuery = async (q, p, l) => { try { const [r] = await db.query(q, p); return r; } catch (e) { console.error(`[AH Dashboard Error] ${l}:`, e.message); return []; } };

        const students = await safeQuery('SELECT COUNT(*) as c FROM students WHERE status != "rejected"', [], 'students');
        const faculties = await safeQuery('SELECT COUNT(*) as c FROM faculties WHERE status != "rejected"', [], 'faculties');
        const mentors = await safeQuery('SELECT COUNT(*) as c FROM mentors WHERE status != "rejected"', [], 'mentors');

        const schedule = await safeQuery('SELECT tt.*, s.name as student_name, u.name as faculty_name FROM mentor_timetable tt JOIN students s ON tt.student_id = s.id LEFT JOIN faculties u ON s.faculty_id = u.id WHERE tt.date = ? ORDER BY tt.start_time ASC', [today], 'schedule');

        const activityFeed = await safeQuery(`
            SELECT * FROM (
                (SELECT 'Quick Log' as type, sil.mentor_notes, s.name as student_name, m.name as origin_name, sil.created_at as date FROM student_interaction_logs sil JOIN students s ON sil.student_id = s.id JOIN mentors m ON sil.mentor_id = m.id)
                UNION ALL
                (SELECT 'Session Log' as type, msl.main_issue as mentor_notes, s.name as student_name, m.name as origin_name, msl.created_at as date FROM mentor_session_logs msl JOIN students s ON msl.student_id = s.id JOIN mentors m ON msl.mentor_id = m.id)
            ) as logs ORDER BY date DESC LIMIT 20
        `, [], 'activity');

        res.status(200).json({ success: true, data: { stats: { totalStudents: students[0]?.c || 0, totalFaculties: faculties[0]?.c || 0, totalMentors: mentors[0]?.c || 0, todaySessions: schedule.length }, schedule, activityFeed } });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getAllFacultyActivity = async (req, res) => {
    try {
        const [sessions] = await db.query('SELECT s.*, u.name as faculty_name FROM faculty_sessions s JOIN faculties u ON s.faculty_id = u.id ORDER BY s.date DESC');
        const [reports] = await db.query('SELECT r.*, s.name as student_name, u.name as faculty_name FROM student_reports r JOIN students s ON r.student_id = s.id JOIN faculties u ON r.faculty_id = u.id ORDER BY r.created_at DESC');
        res.status(200).json({ success: true, data: { sessions, reports } });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const performAutoSync = async () => {
    try {
        const [ms] = await db.query('SELECT * FROM users WHERE role = "mentor"');
        for (const m of ms) await db.query('INSERT INTO mentors (id, name, email, phone_number, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)', [m.id, m.name, m.email, m.phone_number, m.status]);
        const [fs] = await db.query('SELECT * FROM users WHERE role = "faculty"');
        for (const f of fs) await db.query('INSERT INTO faculties (id, name, email, phone_number, status, subject) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)', [f.id, f.name, f.email, f.phone_number, f.status, f.subject || null]);
    } catch (e) { console.error("AUTO_SYNC_ERR:", e.message); }
};

const getAvailableFaculties = async (req, res) => {
    try {
        await performAutoSync();
        const [rows] = await db.query('SELECT id, name, subject FROM faculties WHERE status = "active"');
        res.status(200).json({ success: true, data: rows.map(r => ({ ...r, isAvailable: true })) });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getDropdownData = async (req, res) => {
    try {
        await performAutoSync();
        const [ms] = await db.query('SELECT id, name FROM mentors WHERE status = "active"');
        const [mhs] = await db.query('SELECT id, name FROM users WHERE role = "mentor_head" AND status = "active"');
        const [fs] = await db.query('SELECT id, name, subject FROM faculties WHERE status = "active"');
        res.status(200).json({ success: true, data: { mentors: ms, mentorHeads: mhs, faculties: fs } });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const registerStudent = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { name, email, contact, password, grade, course, mentorId } = req.body;
        const hash = await bcrypt.hash(password || "student123", 10);
        await conn.beginTransaction();
        const [ur] = await conn.query('INSERT INTO users (name, email, phone_number, password, role, status) VALUES (?, ?, ?, ?, "student", "pending")', [name, email || null, contact || null, hash]);
        await conn.query('INSERT INTO students (name, email, password, user_id, grade, course, mentor_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, "pending")', [name, email || null, hash, ur.insertId, grade, course, mentorId || null]);
        await conn.commit();
        conn.release();
        res.status(201).json({ success: true, message: "Student registered" });
    } catch (e) { await conn.rollback(); conn.release(); res.status(500).json({ success: false, message: e.message }); }
};

const registerFaculty = async (req, res) => {
    try {
        const { name, email, phone_number, password } = req.body;
        const hash = await bcrypt.hash(password || phone_number || "faculty123", 10);
        await User.create({ name, email, phone_number, password: hash, role: 'faculty', status: 'pending' });
        res.status(201).json({ success: true, message: "Faculty registered" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const registerSSC = async (req, res) => {
    try {
        const { name, email, phone_number, password } = req.body;
        const hash = await bcrypt.hash(password || phone_number || "ssc123", 10);
        await User.create({ name, email, phone_number, password: hash, role: 'ssc', status: 'pending' });
        res.status(201).json({ success: true, message: "SSC registered" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getStudentInteractionLogs = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT sil.id, sil.created_at, 'Quick' as source, sil.mentor_notes as notes, m.name as mentor_name, s.name as student_name 
            FROM student_interaction_logs sil 
            JOIN mentors m ON sil.mentor_id = m.id 
            JOIN students s ON sil.student_id = s.id 
            ORDER BY created_at DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getFacultyInteractionLogs = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT f.*, u.name as faculty_name, s.name as student_name FROM faculty_interaction_logs f JOIN faculties u ON f.faculty_id = u.id JOIN students s ON f.student_id = s.id ORDER BY f.created_at DESC');
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getAcademicActions = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 50');
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getDailyFacultyChecks = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM faculty_sessions WHERE date = CURDATE()');
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const checkFacultySessionToday = async (req, res) => {
    try {
        await db.query('UPDATE faculty_sessions SET status = "Completed" WHERE id = ?', [req.params.sessionId]);
        res.status(200).json({ success: true, message: "Done" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const uncheckFacultySession = async (req, res) => {
    try {
        await db.query('UPDATE faculty_sessions SET status = "Scheduled" WHERE id = ?', [req.params.sessionId]);
        res.status(200).json({ success: true, message: "Unchecked" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getFacultyDirectory = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM faculties ORDER BY name ASC');
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getAcademicDocuments = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM academic_documents ORDER BY created_at DESC');
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const uploadAcademicDocument = async (req, res) => {
    try {
        await db.query('INSERT INTO academic_documents (title, type, url) VALUES (?, ?, ?)', [req.body.title, req.body.type, req.body.url]);
        res.status(201).json({ success: true, message: "Uploaded" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const deleteAcademicDocument = async (req, res) => {
    try {
        await db.query('DELETE FROM academic_documents WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getLiveClassEvaluations = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT e.*, uf.name as faculty_name FROM live_class_feedbacks e JOIN faculties uf ON e.faculty_id = uf.id ORDER BY e.created_at DESC');
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const submitLiveClassEvaluation = async (req, res) => {
    try {
        await db.query('INSERT INTO live_class_feedbacks (academic_head_id, faculty_id, student_id, remarks) VALUES (?, ?, ?, ?)', [req.user.id, req.body.faculty_id, req.body.student_id || null, req.body.remarks]);
        res.status(201).json({ success: true, message: "Submitted" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getPendingFacultyLogs = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT f.*, u.name as faculty_name FROM faculty_interaction_logs f JOIN faculties u ON f.faculty_id = u.id WHERE verification_status = "Pending" ORDER BY f.created_at DESC');
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const verifyFacultyLog = async (req, res) => {
    try {
        await db.query('UPDATE faculty_interaction_logs SET verification_status = ?, verified_by = ? WHERE id = ?', [req.body.status, req.user.id, req.params.id]);
        res.status(200).json({ success: true, message: "Verified" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const editFaculty = async (req, res) => {
    try {
        const { name, email, phone_number, subject } = req.body;
        await db.query('UPDATE faculties SET name = ?, email = ?, phone_number = ?, subject = ? WHERE id = ?', [name, email, phone_number, subject, req.params.id]);
        res.status(200).json({ success: true, message: "Updated" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const deleteFaculty = async (req, res) => {
    try {
        await db.query('DELETE FROM faculties WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const editStudent = async (req, res) => {
    try {
        const { name, email, contact, grade } = req.body;
        await db.query('UPDATE students SET name = ?, email = ?, contact = ?, grade = ? WHERE id = ?', [name, email, contact, grade, req.params.id]);
        res.status(200).json({ success: true, message: "Updated" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const deleteStudent = async (req, res) => {
    try {
        await db.query('DELETE FROM students WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getStudentById = async (req, res) => {
    try {
        const [[s]] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, data: s });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getStudents = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM students ORDER BY name ASC');
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getMentors = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM mentors ORDER BY name ASC');
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const editMentor = async (req, res) => {
    try {
        const { name, email, phone_number } = req.body;
        await db.query('UPDATE mentors SET name = ?, email = ?, phone_number = ? WHERE id = ?', [name, email, phone_number, req.params.id]);
        res.status(200).json({ success: true, message: "Updated" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const deleteMentor = async (req, res) => {
    try {
        await db.query('DELETE FROM mentors WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getLiveMonitoring = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT fs.*, u.name as faculty_name, s.name as student_name FROM faculty_sessions fs JOIN faculties u ON fs.faculty_id = u.id JOIN session_attendance sa ON fs.id = sa.session_id JOIN students s ON sa.student_id = s.id WHERE fs.date = CURDATE()');
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getStaff = async (req, res) => {
    try {
        const [us] = await db.query('SELECT id, name, email, role FROM users WHERE role != "student"');
        const [ms] = await db.query('SELECT id, name, email, "mentor" as role FROM mentors');
        const [fs] = await db.query('SELECT id, name, email, "faculty" as role FROM faculties');
        res.status(200).json({ success: true, data: [...us, ...ms, ...fs] });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const syncLegacyData = async (req, res) => {
    try { await performAutoSync(); res.status(200).json({ success: true, message: "Synced" }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const saveExamPlan = async (req, res) => {
    try {
        const { student_id, milestone, portions, scheduled_date } = req.body;
        await db.query('INSERT INTO student_exams (student_id, milestone_session, portions, scheduled_date, status) VALUES (?, ?, ?, ?, "Pending") ON DUPLICATE KEY UPDATE portions = VALUES(portions), scheduled_date = VALUES(scheduled_date)', [student_id, milestone, portions, scheduled_date]);
        res.status(200).json({ success: true, message: "Saved" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

module.exports = {
    getExamAnalytics, getDashboardStats, getAllFacultyActivity, getAvailableFaculties, getDropdownData, registerStudent, registerFaculty, registerSSC, getStudentInteractionLogs, getFacultyInteractionLogs, getAcademicActions, getDailyFacultyChecks, checkFacultySessionToday, uncheckFacultySession, getFacultyDirectory, getAcademicDocuments, uploadAcademicDocument, deleteAcademicDocument, getLiveClassEvaluations, submitLiveClassEvaluation, getPendingFacultyLogs, verifyFacultyLog, editFaculty, deleteFaculty, editStudent, deleteStudent, getStudentById, getStudents, getMentors, editMentor, deleteMentor, getLiveMonitoring, getStaff, syncLegacyData, saveExamPlan
};
