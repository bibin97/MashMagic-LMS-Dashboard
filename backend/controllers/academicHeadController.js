const db = require('../config/db');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// @desc    Get dashboard metrics and today's schedule
// @route   GET /api/academic-head/dashboard
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Basic Stats
        const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) as totalStudents FROM students WHERE status = "active"');
        const [[{ totalFaculties }]] = await db.query('SELECT COUNT(*) as totalFaculties FROM users WHERE role = "faculty" AND status = "active"');
        const [[{ totalMentors }]] = await db.query('SELECT COUNT(*) as totalMentors FROM users WHERE role = "mentor" AND status = "active"');

        // 2. Today's Schedule
        const [schedule] = await db.query(`
            SELECT 
                tt.id, tt.start_time, tt.end_time, tt.chapter, tt.status,
                s.name as student_name, s.subject,
                u.name as mentor_name
            FROM mentor_timetable tt
            JOIN students s ON tt.student_id = s.id
            JOIN users u ON tt.mentor_id = u.id
            WHERE tt.date = ?
            ORDER BY tt.start_time ASC
        `, [today]);

        // 3. Newest Actions/Reports from Faculties
        const [recentReports] = await db.query(`
            SELECT r.*, s.name as student_name, u.name as faculty_name 
            FROM student_reports r 
            JOIN students s ON r.student_id = s.id 
            JOIN users u ON r.faculty_id = u.id 
            ORDER BY r.created_at DESC 
            LIMIT 5
        `);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalStudents,
                    totalFaculties,
                    totalMentors,
                    todaySessions: schedule.length
                },
                schedule,
                recentReports
            }
        });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get all faculty session logs and reports
// @route   GET /api/academic-head/faculty-logs
const getAllFacultyActivity = async (req, res) => {
    try {
        // 1. Faculty Sessions
        const [sessions] = await db.query(`
            SELECT s.*, u.name as faculty_name 
            FROM faculty_sessions s
            JOIN users u ON s.faculty_id = u.id
            ORDER BY s.date DESC
        `);

        // 2. Student Reports (Faculty intelligence logs)
        const [reports] = await db.query(`
            SELECT r.*, s.name as student_name, u.name as faculty_name
            FROM student_reports r
            JOIN students s ON r.student_id = s.id
            JOIN users u ON r.faculty_id = u.id
            ORDER BY r.created_at DESC
        `);

        res.status(200).json({
            success: true,
            data: {
                sessions,
                reports
            }
        });
    } catch (error) {
        console.error('Error in getAllFacultyActivity:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get dropdown data for student registration
// @route   GET /api/academic-head/dropdowns
const getDropdownData = async (req, res) => {
    try {
        const [mentors] = await db.query('SELECT id, name FROM users WHERE role = "mentor" AND status = "active"');
        const [mentorHeads] = await db.query('SELECT id, name FROM users WHERE role = "mentor_head" AND status = "active"');
        const [faculties] = await db.query('SELECT id, name FROM users WHERE role = "faculty" AND status = "active"');
        res.status(200).json({
            success: true,
            data: {
                mentors,
                mentorHeads,
                faculties
            }
        });
    } catch (error) {
        console.error('Error in getDropdownData:', error);
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

        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: "User session invalid. Please re-login." });
        }

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
                time_table, status, onboarding_status, isApproved, registeredBy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `;

        const [studentResult] = await db.query(query, [
            name, grade, subject, course, hour,
            mentorId || null, mentorName, facultyId || null, facultyName, nextInstallmentDate || null,
            JSON.stringify({}), // Empty timetable initially
            'pending', // This is global status (approval status)
            onboardingStatus,
            req.user.id // Registering user ID
        ]);

        const studentId = studentResult.insertId;

        // Schedule first session if mentor exists
        if (mentorId) {
            await db.query(`
                INSERT INTO mentor_timetable (
                    mentor_id, student_id, session_number, date, status, 
                    chapter, start_time, end_time, duration, session_type
                ) VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)
            `, [
                mentorId, studentId, 1, 'Scheduled',
                'Initial Introduction Session', '10:00', '11:00', '1h 0m', 'Regular Class'
            ]);
        }

        res.status(201).json({ success: true, message: "Student registered successfully. Pending Admin approval." });
    } catch (error) {
        console.error('Error in registerStudent:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Register a new faculty (Signup style)
// @route   POST /api/academic-head/register-faculty
const registerFaculty = async (req, res) => {
    try {
        const { name, email, phone_number, place, password } = req.body;
        const requesterId = req.user?.id;

        console.log(`[FACULTY REG] Attempting registration: ${email} (By Admin ID: ${requesterId})`);

        if (!requesterId) {
            return res.status(401).json({ success: false, message: "User session invalid. Please re-login." });
        }

        const salt = await bcrypt.genSalt(10);
        // Explicit password priority: Form > Phone > Default
        const passwordToHash = (password && password.trim() !== '') ? password.trim() : (phone_number || "faculty123");
        const hashedPassword = await bcrypt.hash(passwordToHash, salt);

        console.log(`[FACULTY REG] Password source applied. Identifier to use for login: ${email || phone_number}`);

        // Faculty registration starts as PENDING. 
        // Admin must approve via Admin Panel before they can log in.
        const userId = await User.create({
            name,
            email: email?.trim() || null,
            phone_number: phone_number?.trim() || null,
            place,
            password: hashedPassword,
            role: 'faculty',
            status: 'pending',
            isApproved: 0,
            registeredBy: requesterId
        });

        console.log(`[FACULTY REG] SUCCESS! New Faculty ID: ${userId} | Status: PENDING`);
        res.status(201).json({
            success: true,
            message: "Faculty account created successfully. Please wait for Admin approval.",
            userId
        });
    } catch (error) {
        console.error('[FACULTY REG] CRITICAL ERROR:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Email or Phone already exists." });
        }
        res.status(500).json({ success: false, message: "Internal server error during registration" });
    }
};

// @desc    Register a new counselor
// @route   POST /api/academic-head/register-counselor
const registerCounselor = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: "User session invalid. Please re-login." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Using model for consistency
        const userId = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'academic_counsellor',
            status: 'pending',
            isApproved: 0,
            registeredBy: req.user.id
        });

        res.status(201).json({ success: true, message: "BDM account created successfully. Pending Admin approval.", userId });
    } catch (error) {
        console.error('Error in registerCounselor:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Email already exists." });
        }
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get all student interaction logs (Mentor logs)
// @route   GET /api/academic-head/student-interaction-logs
const getStudentInteractionLogs = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT logs.*, s.name as student_name, u.name as mentor_name
            FROM student_interaction_logs logs
            JOIN students s ON logs.student_id = s.id
            JOIN users u ON logs.mentor_id = u.id
            ORDER BY logs.created_at DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error in getStudentInteractionLogs:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get all faculty interaction logs (Mentor & Faculty logs)
// @route   GET /api/academic-head/faculty-interaction-logs
const getFacultyInteractionLogs = async (req, res) => {
    try {
        // 1. Logs from Mentors about Faculty Sessions
        const [mentorLogs] = await db.query(`
            SELECT logs.*, s.name as student_name, u.name as mentor_name, f.name as faculty_name,
            'mentor' as log_source
            FROM faculty_interaction_logs logs
            JOIN students s ON logs.student_id = s.id
            JOIN users u ON logs.mentor_id = u.id
            LEFT JOIN users f ON logs.faculty_id = f.id
            ORDER BY logs.created_at DESC
        `);

        // 2. Session reports from Faculty
        const [facultyLogs] = await db.query(`
            SELECT s.*, u.name as faculty_name,
            'faculty' as log_source
            FROM faculty_sessions s
            JOIN users u ON s.faculty_id = u.id
            WHERE s.status = 'Completed'
            ORDER BY s.date DESC
        `);

        res.status(200).json({
            success: true,
            data: {
                mentorLogs,
                facultyLogs
            }
        });
    } catch (error) {
        console.error('Error in getFacultyInteractionLogs:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get consolidated actions (Milestones & Daily Logs)
// @route   GET /api/academic-head/actions
const getAcademicActions = async (req, res) => {
    try {
        // 1. Get Exam Milestones (Due/Pending)
        // Similar to mentor logic but for all students
        const [students] = await db.query('SELECT id, name, mentor_id FROM students WHERE status = "active"');

        let pendingMilestones = [];

        for (const student of students) {
            const [rows] = await db.query(
                'SELECT MAX(session_number) as current_max FROM mentor_timetable WHERE student_id = ? AND status != "Cancelled"',
                [student.id]
            );

            const currentMax = rows[0].current_max || 0;

            for (let milestone = 5; milestone <= currentMax; milestone += 5) {
                const [existing] = await db.query(
                    'SELECT status, score FROM student_exams WHERE student_id = ? AND milestone_session = ?',
                    [student.id, milestone]
                );

                if (existing.length === 0 || existing[0].status !== 'Completed') {
                    pendingMilestones.push({
                        student_id: student.id,
                        student_name: student.name,
                        milestone: milestone,
                        current_sessions: currentMax,
                        status: existing.length > 0 ? existing[0].status : 'Pending',
                        mentor_id: student.mentor_id
                    });
                }
            }
        }

        // 2. Today's Faculty Activity
        const today = new Date().toISOString().split('T')[0];
        const [dailyLogs] = await db.query(`
            SELECT fs.*, fs.topic as chapter, u.name as faculty_name
            FROM faculty_sessions fs
            JOIN users u ON fs.faculty_id = u.id
            WHERE DATE(fs.date) = ?
            ORDER BY fs.created_at DESC
        `, [today]);

        // 3. Mentors responsible for these milestones
        const mentorIds = [...new Set(pendingMilestones.map(m => m.mentor_id))].filter(Boolean);
        let mentors = {};
        if (mentorIds.length > 0) {
            const [mentorRows] = await db.query('SELECT id, name FROM users WHERE id IN (?)', [mentorIds]);
            mentorRows.forEach(m => mentors[m.id] = m.name);
        }

        const enrichedMilestones = pendingMilestones.map(m => ({
            ...m,
            mentor_name: mentors[m.mentor_id] || 'Unassigned'
        }));

        res.status(200).json({
            success: true,
            data: {
                milestones: enrichedMilestones,
                dailyLogs: dailyLogs
            }
        });
    } catch (error) {
        console.error('Error in getAcademicActions:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get Daily Faculty Checks (for Academic Head)
// @route   GET /api/academic-head/daily-faculty-checks
const getDailyFacultyChecks = async (req, res) => {
    try {
        const query = `
            SELECT 
                fs.id as session_id,
                fs.date,
                fs.topic as chapter,
                fs.topic as topics_covered,
                u.name as faculty_name,
                u.id as faculty_id,
                (SELECT COUNT(*) FROM faculty_verification WHERE session_id = fs.id) AS check_count
            FROM faculty_sessions fs
            JOIN users u ON fs.faculty_id = u.id
            WHERE fs.status = 'Completed'
            ORDER BY fs.date DESC
        `;
        const [sessions] = await db.query(query);
        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        console.error('Error in getDailyFacultyChecks:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add a manual check marker for faculty session
// @route   POST /api/academic-head/sessions/:sessionId/check
const checkFacultySessionToday = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const academicHeadId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        await db.query(
            'INSERT INTO faculty_verification (session_id, academic_head_id, date) VALUES (?, ?, ?)',
            [sessionId, academicHeadId, today]
        );

        res.status(200).json({ success: true, message: 'Faculty session audit check added' });
    } catch (error) {
        console.error('Error in checkFacultySessionToday:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Remove the latest manual check marker for faculty session
// @route   DELETE /api/academic-head/sessions/:sessionId/uncheck
const uncheckFacultySession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        await db.query(`
            DELETE FROM faculty_verification 
            WHERE id = (
                SELECT id FROM (
                    SELECT id FROM faculty_verification 
                    WHERE session_id = ? 
                    ORDER BY id DESC LIMIT 1
                ) as t
            )
        `, [sessionId]);

        res.status(200).json({ success: true, message: 'Latest faculty session check removed' });
    } catch (error) {
        console.error('Error in uncheckFacultySession:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all faculties with their students and schedules
// @route   GET /api/academic-head/faculties
const getFacultyDirectory = async (req, res) => {
    try {
        const [faculties] = await db.query(`
            SELECT id, name, email, phone_number, status, created_at 
            FROM users 
            WHERE role = "faculty" 
            ORDER BY name ASC
        `);

        const today = new Date().toISOString().split('T')[0];

        const enrichedFaculties = await Promise.all(faculties.map(async (faculty) => {
            const [[{ studentCount }]] = await db.query(
                'SELECT COUNT(*) as studentCount FROM students WHERE faculty_id = ? AND status = "active"',
                [faculty.id]
            );

            const [assignedStudents] = await db.query(
                'SELECT id, name, grade, subject FROM students WHERE faculty_id = ? AND status = "active"',
                [faculty.id]
            );

            const [todaySchedule] = await db.query(`
                SELECT fs.*, 
                (SELECT GROUP_CONCAT(st.name) 
                 FROM session_attendance sa 
                 JOIN students st ON sa.student_id = st.id 
                 WHERE sa.session_id = fs.id) as students_present
                FROM faculty_sessions fs
                WHERE fs.faculty_id = ? AND DATE(fs.date) = ?
                ORDER BY fs.start_time ASC
            `, [faculty.id, today]);

            return {
                ...faculty,
                studentCount,
                assignedStudents,
                todaySchedule
            };
        }));

        res.status(200).json({ success: true, count: faculties.length, data: enrichedFaculties });
    } catch (error) {
        console.error('Error in getFacultyDirectory:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get all academic documents
// @route   GET /api/academic-head/documents
const getAcademicDocuments = async (req, res) => {
    try {
        const [documents] = await db.query(`
            SELECT d.*, u.name as uploaded_by_name 
            FROM academic_documents d
            LEFT JOIN users u ON d.uploaded_by = u.id
            ORDER BY d.created_at DESC
        `);
        res.status(200).json({ success: true, data: documents });
    } catch (error) {
        console.error('Error in getAcademicDocuments:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Upload an academic document
// @route   POST /api/academic-head/documents
const uploadAcademicDocument = async (req, res) => {
    try {
        const { title, description, file_url, category } = req.body;
        const uploaded_by = req.user.id;

        if (!title || !file_url) {
            return res.status(400).json({ success: false, message: "Title and File URL are required" });
        }

        await db.query(`
            INSERT INTO academic_documents (title, description, file_url, uploaded_by, category)
            VALUES (?, ?, ?, ?, ?)
        `, [title, description, file_url, uploaded_by, category || 'General']);

        res.status(201).json({ success: true, message: "Document uploaded successfully" });
    } catch (error) {
        console.error('Error in uploadAcademicDocument:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Delete an academic document
// @route   DELETE /api/academic-head/documents/:id
const deleteAcademicDocument = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM academic_documents WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
        console.error('Error in deleteAcademicDocument:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get Live Class Evaluations
// @route   GET /api/academic-head/live-class-evaluations
const getLiveClassEvaluations = async (req, res) => {
    try {
        const [evals] = await db.query(`
            SELECT e.*, uf.name as faculty_name 
            FROM live_class_feedbacks e
            JOIN users uf ON e.faculty_id = uf.id
            ORDER BY e.created_at DESC
        `);
        res.status(200).json({ success: true, data: evals });
    } catch (error) {
        console.error('Error fetching live class evaluations:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit Live Class Evaluation
// @route   POST /api/academic-head/live-class-evaluations
const submitLiveClassEvaluation = async (req, res) => {
    try {
        const { faculty_id, student_id, joined_class, faculty_active, interactive, faculty_camera_on, student_camera_on, remarks, proof_url, class_date } = req.body;
        const academic_head_id = req.user.id;

        await db.query(`
            INSERT INTO live_class_feedbacks (academic_head_id, faculty_id, student_id, joined_class, faculty_active, interactive, faculty_camera_on, student_camera_on, remarks, proof_url, class_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [academic_head_id, faculty_id, student_id || null, joined_class, faculty_active, interactive, faculty_camera_on, student_camera_on, remarks, proof_url, class_date]);

        res.status(201).json({ success: true, message: 'Live class evaluation submitted successfully' });
    } catch (error) {
        console.error('Error submitting live class evaluation:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get pending faculty interaction logs for verification
// @route   GET /api/academic-head/faculty-logs-pending
const getPendingFacultyLogs = async (req, res) => {
    try {
        const [logs] = await db.query(`
            SELECT f.*, u.name as faculty_name, s.name as student_name
            FROM faculty_interaction_logs f
            LEFT JOIN users u ON f.faculty_id = u.id
            LEFT JOIN students s ON f.student_id = s.id
            ORDER BY f.created_at DESC
        `);
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error('Error fetching pending faculty logs:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify Faculty Interaction Log
// @route   PUT /api/academic-head/faculty-logs/:id/verify
const verifyFacultyLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { verification_status, verification_remarks } = req.body;
        const verified_by = req.user.id;

        await db.query(`
            UPDATE faculty_interaction_logs
            SET verification_status = ?, verification_remarks = ?, verified_by = ?
            WHERE id = ?
        `, [verification_status, verification_remarks, verified_by, id]);

        res.status(200).json({ success: true, message: 'Log verified successfully' });
    } catch (error) {
        console.error('Error verifying faculty log:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get exam analytics for graphs
const getExamAnalytics = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                subject, 
                term, 
                AVG(marks) as avg_marks, 
                AVG(total) as avg_total,
                (AVG(marks) / AVG(total)) * 100 as percentage
            FROM student_marks
            GROUP BY subject, term
            ORDER BY term DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching exam analytics:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getExamAnalytics,
    getDropdownData,
    registerStudent,
    registerFaculty,
    registerCounselor,
    getDashboardStats,
    getAllFacultyActivity,
    getStudentInteractionLogs,
    getFacultyInteractionLogs,
    getAcademicActions,
    getDailyFacultyChecks,
    checkFacultySessionToday,
    uncheckFacultySession,
    getFacultyDirectory,
    getAcademicDocuments,
    uploadAcademicDocument,
    deleteAcademicDocument,
    getLiveClassEvaluations,
    submitLiveClassEvaluation,
    getPendingFacultyLogs,
    verifyFacultyLog
};



