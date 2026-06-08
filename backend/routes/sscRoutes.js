const express = require('express');
const router = express.Router();
const { getDashboardStats, getStudentsTrack, getDailyUpdates } = require('../controllers/sscController');
const { getStudentById, saveExamPlan } = require('../controllers/aoeController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const db = require('../config/db');

router.get('/debug-db', async (req, res) => {
    const db = require('../config/db');
    try {
        const [fs] = await db.query('SELECT * FROM faculty_sessions ORDER BY id DESC LIMIT 10');
        const [tt] = await db.query('SELECT id, faculty_id, date, status FROM timetable ORDER BY id DESC LIMIT 10');
        res.json({ success: true, fs, tt });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

router.use(requireAuth);
router.use(requireRole('ssc', 'super_admin', 'academic_head'));

router.get('/dashboard', getDashboardStats);
router.get('/students', getStudentsTrack);
router.get('/daily-updates', getDailyUpdates);
router.get('/students/:id', getStudentById);

// Exam Schedule routes
router.get('/exam-schedules', async (req, res) => {
    try {
        const { student_id, status } = req.query;
        let sql = `
            SELECT se.*, s.name as student_name, s.course, s.grade, m.name as mentor_name
            FROM student_exams se
            JOIN students s ON se.student_id = s.id
            LEFT JOIN mentors m ON s.mentor_id = m.id
            WHERE 1=1
        `;
        const params = [];
        if (student_id) { sql += ' AND se.student_id = ?'; params.push(student_id); }
        if (status) { sql += ' AND se.status = ?'; params.push(status); }
        sql += ' ORDER BY se.scheduled_date ASC, se.created_at DESC';
        const [rows] = await db.query(sql, params);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/exam-schedules', saveExamPlan);

router.put('/exam-schedules/:id/result', async (req, res) => {
    try {
        const { score, status, notes } = req.body;
        await db.query('UPDATE student_exams SET score = ?, status = ?, reason = ? WHERE id = ?', [score, status || 'Completed', notes, req.params.id]);
        res.json({ success: true, message: 'Exam result updated' });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/exam-schedules/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM student_exams WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Deleted' });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;

