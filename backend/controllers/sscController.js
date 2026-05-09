const db = require('../config/db');

// @desc    Get SSC Dashboard Stats
// @route   GET /api/ssc/dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        // Placeholder stats
        res.status(200).json({
            success: true,
            data: {
                activeStudents: 0,
                mentorSyncs: 0,
                successRate: '0%',
                pendingReviews: 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Students for SSC Tracking
// @route   GET /api/ssc/students
exports.getStudentsTrack = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, enrollment_type, performance_status, status FROM students WHERE status = "active" ORDER BY name ASC');
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
