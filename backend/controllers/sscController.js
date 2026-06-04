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
        const [rows] = await db.query('SELECT * FROM students WHERE status != "rejected" ORDER BY name ASC');
        const { calculateStudentHours } = require('../utils/studentHoursHelper');
        const augmentedRows = await calculateStudentHours(rows, db);
        res.status(200).json({ success: true, data: augmentedRows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Daily Updates from Faculties
// @route   GET /api/ssc/daily-updates
exports.getDailyUpdates = async (req, res) => {
    try {
        const [updates] = await db.query(`
            SELECT u.*, 
                   s.name as student_name, 
                   s.grade as student_grade,
                   f.name as faculty_name 
            FROM faculty_class_updates u
            JOIN students s ON u.student_id = s.id
            JOIN users f ON u.faculty_id = f.id
            ORDER BY u.created_at DESC
        `);
        res.status(200).json({ success: true, data: updates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
