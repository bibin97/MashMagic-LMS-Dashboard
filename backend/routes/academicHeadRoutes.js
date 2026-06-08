const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const academicHeadController = require('../controllers/academicHeadController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for course completion files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/completions/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
// All routes require academic_head role
router.use(requireAuth);
router.use(requireRole('academic_head', 'super_admin'));

// Academic Quality
router.get('/faculty-quality', academicHeadController.getFacultyQualityChecks);
router.post('/faculty-quality', upload.single('proof'), academicHeadController.addFacultyQualityCheck);

// Daily Faculty Rotation
router.get('/faculty-rotation', academicHeadController.getDailyFacultyRotation);
router.put('/faculty-rotation/:id', academicHeadController.updateFacultyRotation);

// Parent Meetings
router.get('/parent-meetings', academicHeadController.getParentMeetings);

// Exam Scores
router.get('/exam-scores', academicHeadController.getExamScores);

// Daily Updates
router.put('/daily-updates/:id', academicHeadController.editDailyUpdate);

// Student Growth
router.get('/student-growth', academicHeadController.getStudentGrowth);

// All Students
router.get('/students-all', academicHeadController.getAllStudents);

// Faculty Replacements
router.get('/faculty-replacements', academicHeadController.getFacultyReplacements);
router.post('/faculty-replacements', academicHeadController.addFacultyReplacement);

// Escalations
router.get('/escalations', academicHeadController.getEscalations);
router.post('/escalations', academicHeadController.addEscalation);

// Course Completions
router.get('/course-completions', academicHeadController.getCourseCompletions);
router.post('/course-completions/:id', upload.single('completion_file'), academicHeadController.markCourseCompleted);

module.exports = router;
