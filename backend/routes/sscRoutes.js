const express = require('express');
const router = express.Router();
const { getDashboardStats, getStudentsTrack } = require('../controllers/sscController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

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

module.exports = router;
