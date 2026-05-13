const db = require('../config/db');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// @desc    Get dashboard metrics and today's schedule
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const safeQuery = async (query, params, label) => {
            try {
                const [result] = await db.query(query, params);
                return result;
            } catch (err) {
                console.error(`[Academic Head Dashboard Error] ${label}:`, err.message);
                return [];
            }
        };

        const studentsStats = await safeQuery('SELECT COUNT(*) as totalStudents FROM students WHERE status != "rejected"', [], 'totalStudents');
        const facultiesStats = await safeQuery('SELECT COUNT(*) as totalFaculties FROM faculties WHERE status != "rejected"', [], 'totalFaculties');
        const mentorsStats = await safeQuery('SELECT COUNT(*) as totalMentors FROM mentors WHERE status != "rejected"', [], 'totalMentors');

        const totalStudents = studentsStats[0]?.totalStudents || 0;
        const totalFaculties = facultiesStats[0]?.totalFaculties || 0;
        const totalMentors = mentorsStats[0]?.totalMentors || 0;

        const schedule = await safeQuery(`
            SELECT 
                tt.id, tt.start_time, tt.end_time, tt.chapter, tt.status,
                s.name as student_name, s.subject,
                u.name as faculty_name
            FROM mentor_timetable tt
            JOIN students s ON tt.student_id = s.id
            LEFT JOIN users u ON s.faculty_id = u.id AND u.role = 'faculty'
            WHERE tt.date = ?
            ORDER BY tt.start_time ASC
        `, [today], 'schedule');

        const activityFeed = await safeQuery(`
            SELECT * FROM (
                 (SELECT CONVERT('Quick Log' USING utf8mb4) COLLATE utf8mb4_unicode_ci as type, CONVERT(sil.mentor_notes USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_notes, CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name, CONVERT(u.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as origin_name, sil.created_at as date
                  FROM student_interaction_logs sil
                  JOIN students s ON sil.student_id = s.id
                  JOIN users u ON sil.mentor_id = u.id WHERE u.role = 'mentor')
                 UNION ALL
                 (SELECT CONVERT('Session Log' USING utf8mb4) COLLATE utf8mb4_unicode_ci as type, CONVERT(CONCAT(msl.main_issue, ': ', msl.action_type) USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_notes, CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name, CONVERT(u.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as origin_name, msl.created_at as date
                  FROM mentor_session_logs msl
                  JOIN students s ON msl.student_id = s.id
                  JOIN users u ON msl.mentor_id = u.id WHERE u.role = 'mentor')
                 UNION ALL
                 (SELECT CONVERT('Hub Report' USING utf8mb4) COLLATE utf8mb4_unicode_ci as type, 
                          CONVERT(COALESCE(
                              JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.notes')), 
                              JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.action_plan')),
                              JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.next_task')),
                              JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.study_status')),
                              JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.main_problem')),
                              msr.session_type
                          ) USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_notes, 
                          CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name, CONVERT(u.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as origin_name, msr.created_at as date
                  FROM mentor_session_reports msr
                  JOIN students s ON msr.student_id = s.id
                  JOIN users u ON msr.mentor_id = u.id WHERE u.role = 'mentor'
                  AND msr.report_data IS NOT NULL AND JSON_VALID(msr.report_data))
                UNION ALL
                (SELECT CONVERT('Mentorship' USING utf8mb4) COLLATE utf8mb4_unicode_ci as type, CONVERT(ml.action_details USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_notes, CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name, CONVERT(u.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as origin_name, ml.created_at as date
                 FROM mentorship_logs ml
                 JOIN students s ON ml.student_id = s.id
                 JOIN mentors u ON ml.mentor_id = u.id)
                UNION ALL
                (SELECT CONVERT('Faculty Interaction' USING utf8mb4) COLLATE utf8mb4_unicode_ci as type, CONVERT(fil.notes USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_notes, CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name, CONVERT(u.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as origin_name, fil.created_at as date
                 FROM faculty_interaction_logs fil
                 JOIN students s ON fil.student_id = s.id
                 JOIN mentors u ON fil.mentor_id = u.id)
                UNION ALL
                (SELECT CONVERT('Staff Call' USING utf8mb4) COLLATE utf8mb4_unicode_ci as type, CONVERT(mfi.main_issue USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_notes, CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name, CONVERT(u.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as origin_name, mfi.created_at as date
                 FROM mentor_faculty_interactions mfi
                 JOIN students s ON mfi.student_id = s.id
                 JOIN mentors u ON mfi.mentor_id = u.id)
                UNION ALL
                 (SELECT CONVERT('Intelligence' USING utf8mb4) COLLATE utf8mb4_unicode_ci as type, CONVERT(COALESCE(r.remarks, 'No details') USING utf8mb4) COLLATE utf8mb4_unicode_ci as mentor_notes, CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as student_name, CONVERT(u.name USING utf8mb4) COLLATE utf8mb4_unicode_ci as origin_name, r.created_at as date
                  FROM student_reports r 
                  JOIN students s ON r.student_id = s.id 
                  JOIN faculties u ON r.faculty_id = u.id)
            ) as combined_logs
            ORDER BY date DESC
            LIMIT 20
        `, [], 'activityFeed');

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalStudents,
                    totalFaculties,
                    totalMentors,
                    todaySessions: (schedule || []).length
                },
                schedule: schedule || [],
                activityFeed: activityFeed || []
            }
        });
    } catch (error) {
        console.error('FATAL ERROR in getDashboardStats:', error);
        res.status(500).json({ success: false, message: "Dashboard Critical Error", error: error.message });
    }
};

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

const getAllFacultyActivity = async (req, res) => {
    try {
        const [sessions] = await db.query('SELECT s.*, u.name as faculty_name FROM faculty_sessions s JOIN faculties u ON s.faculty_id = u.id ORDER BY s.date DESC');
        const [reports] = await db.query('SELECT r.*, s.name as student_name, u.name as faculty_name FROM student_reports r JOIN students s ON r.student_id = s.id JOIN faculties u ON r.faculty_id = u.id ORDER BY r.created_at DESC');
        res.status(200).json({ success: true, data: { sessions, reports } });
    } catch (error) { res.status(500).json({ success: false, message: "Server Error", error: error.message }); }
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
        const { days, day, startTime, endTime } = req.query;
        const daysList = days ? (Array.isArray(days) ? days : days.split(',')) : [day];
        
        const conflictConditions = daysList.map(() => `(fs.day_of_week = ? AND STR_TO_DATE(fs.start_time, '%h:%i %p') < STR_TO_DATE(?, '%h:%i %p') AND STR_TO_DATE(fs.end_time, '%h:%i %p') > STR_TO_DATE(?, '%h:%i %p'))`).join(' OR ');
        let params = [];
        daysList.forEach(d => params.push(d, endTime, startTime));

        const [faculties] = await db.query(`SELECT u.id, u.name, u.subject, EXISTS (SELECT 1 FROM faculty_schedules fs WHERE fs.faculty_id = u.id AND (${conflictConditions})) as hasConflict FROM users u WHERE u.role = 'faculty' AND u.status = 'active'`, params);
        res.status(200).json({ success: true, data: faculties.map(f => ({ ...f, isAvailable: !f.hasConflict })) });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getDropdownData = async (req, res) => {
    try {
        await performAutoSync();
        const [ms] = await db.query('SELECT id, name FROM mentors WHERE status = "active"');
        const [mhs] = await db.query('SELECT id, name FROM users WHERE role = "mentor_head" AND status = "active"');
        const [fs] = await db.query('SELECT id, name, subject FROM users WHERE role = "faculty" AND status = "active"');
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
        const { student_id, mentor_id, startDate, endDate } = req.query;
        let params = [];
        const baseWhere = (tableAlias, dateCol = 'created_at') => {
            let clause = 'WHERE 1=1';
            if (student_id) { clause += ` AND ${tableAlias}.student_id = ?`; params.push(student_id); }
            if (mentor_id) { clause += ` AND ${tableAlias}.mentor_id = ?`; params.push(mentor_id); }
            if (startDate) { clause += ` AND ${tableAlias}.${dateCol} >= ?`; params.push(startDate); }
            if (endDate) { clause += ` AND ${tableAlias}.${dateCol} <= ?`; params.push(endDate + ' 23:59:59'); }
            return clause;
        };

        const query = `
            SELECT * FROM (
                SELECT sil.id, sil.created_at, CONVERT('Quick' USING utf8mb4) COLLATE utf8mb4_unicode_ci as source, CONVERT(sil.mentor_notes USING utf8mb4) COLLATE utf8mb4_unicode_ci as notes, m.name as mentor_name, s.name as student_name 
                FROM student_interaction_logs sil 
                JOIN mentors m ON sil.mentor_id = m.id 
                JOIN students s ON sil.student_id = s.id 
                ${baseWhere('sil')}
                UNION ALL
                SELECT msl.id, msl.created_at, CONVERT('Session' USING utf8mb4) COLLATE utf8mb4_unicode_ci as source, CONVERT(msl.main_issue USING utf8mb4) COLLATE utf8mb4_unicode_ci as notes, m.name as mentor_name, s.name as student_name 
                FROM mentor_session_logs msl 
                JOIN mentors m ON msl.mentor_id = m.id 
                JOIN students s ON msl.student_id = s.id 
                ${baseWhere('msl')}
            ) as logs ORDER BY created_at DESC
        `;
        // Since baseWhere pushes to params, we need to handle UNION parameters carefully. 
        // For simplicity in this rewrite, I'll reset params and just pass what's needed.
        let finalParams = [];
        const getP = () => { let p = []; if(student_id) p.push(student_id); if(mentor_id) p.push(mentor_id); if(startDate) p.push(startDate); if(endDate) p.push(endDate + ' 23:59:59'); return p; };
        finalParams = [...getP(), ...getP()];

        const [rows] = await db.query(query, finalParams);
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
        // 1. Fetch Milestones (Students needing exam plans)
        const [milestones] = await db.query(`
            SELECT 
                r.student_id, s.name as student_name, r.session_number as milestone,
                m.name as mentor_name,
                MAX(e.portions) as portions, MAX(e.chapter) as chapter, 
                MAX(e.exam_type) as exam_type, MAX(e.scheduled_date) as scheduled_date
            FROM mentor_timetable r
            JOIN students s ON r.student_id = s.id
            JOIN users m ON s.mentor_id = m.id AND m.role = 'mentor'
            LEFT JOIN student_exams e ON r.student_id = e.student_id AND r.session_number = e.milestone_session
            WHERE (r.session_number % 5 = 0)
            AND r.status = 'Completed'
            AND (e.id IS NULL OR e.status = 'Pending')
            GROUP BY r.student_id, r.session_number, s.name, m.name
            ORDER BY MAX(r.date) DESC
        `);

        // 2. Fetch Daily Logs (Faculty sessions today)
        const [dailyLogs] = await db.query(`
            SELECT fs.*, f.name as faculty_name 
            FROM faculty_sessions fs
            JOIN faculties f ON fs.faculty_id = f.id
            WHERE fs.date = CURDATE()
            ORDER BY fs.start_time ASC
        `);

        res.status(200).json({ 
            success: true, 
            data: { 
                milestones: milestones || [], 
                dailyLogs: dailyLogs || [] 
            } 
        });
    } catch (e) {
        console.error("GET_ACADEMIC_ACTIONS_ERROR:", e);
        res.status(500).json({ success: false, message: e.message });
    }
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
        const [rows] = await db.query('SELECT f.*, u.name as faculty_name FROM faculty_interaction_logs f JOIN users u ON f.faculty_id = u.id WHERE u.role = "faculty" AND verification_status = "Pending" ORDER BY f.created_at DESC');
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
        const [[s]] = await db.query('SELECT s.*, m.name as mentor_name, f.name as faculty_name FROM students s LEFT JOIN mentors m ON s.mentor_id = m.id LEFT JOIN faculties f ON s.faculty_id = f.id WHERE s.id = ?', [req.params.id]);
        res.status(200).json({ success: true, data: s });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getStudents = async (req, res) => {
    try {
        const { mentor_id, faculty_id } = req.query;
        let sql = 'SELECT s.*, m.name as mentor_name, f.name as faculty_name FROM students s LEFT JOIN mentors m ON s.mentor_id = m.id LEFT JOIN faculties f ON s.faculty_id = f.id WHERE 1=1';
        let params = [];
        if (mentor_id) { sql += ' AND s.mentor_id = ?'; params.push(mentor_id); }
        if (faculty_id) { sql += ' AND s.faculty_id = ?'; params.push(faculty_id); }
        sql += ' ORDER BY s.name ASC';
        const [rows] = await db.query(sql, params);
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getMentors = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT m.*, (SELECT COUNT(*) FROM students WHERE mentor_id = m.id) as studentCount FROM users m WHERE m.role = "mentor" ORDER BY m.name ASC');
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
        const [rows] = await db.query('SELECT fs.*, u.name as faculty_name, s.name as student_name FROM faculty_sessions fs JOIN users u ON fs.faculty_id = u.id JOIN session_attendance sa ON fs.id = sa.session_id JOIN students s ON sa.student_id = s.id WHERE u.role = "faculty" AND fs.date = CURDATE()');
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getStaff = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email, phone_number as phone, role, status FROM users WHERE role IN ("mentor", "faculty", "ssc", "admin", "academic_head", "mentor_head") ORDER BY name ASC');
        res.status(200).json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const syncLegacyData = async (req, res) => {
    try { await performAutoSync(); res.status(200).json({ success: true, message: "Synced" }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const saveExamPlan = async (req, res) => {
    try {
        const { student_id, milestone, portions, chapter, exam_type, scheduled_date } = req.body;
        await db.query(`
            INSERT INTO student_exams 
                (student_id, milestone_session, portions, chapter, exam_type, scheduled_date, status) 
            VALUES (?, ?, ?, ?, ?, ?, "Pending") 
            ON DUPLICATE KEY UPDATE 
                portions = VALUES(portions), 
                chapter = VALUES(chapter), 
                exam_type = VALUES(exam_type), 
                scheduled_date = VALUES(scheduled_date)
        `, [student_id, milestone, portions, chapter, exam_type, scheduled_date]);
        res.status(200).json({ success: true, message: "Saved" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

module.exports = {
    getExamAnalytics, getDashboardStats, getAllFacultyActivity, getAvailableFaculties, getDropdownData, registerStudent, registerFaculty, registerSSC, getStudentInteractionLogs, getFacultyInteractionLogs, getAcademicActions, getDailyFacultyChecks, checkFacultySessionToday, uncheckFacultySession, getFacultyDirectory, getAcademicDocuments, uploadAcademicDocument, deleteAcademicDocument, getLiveClassEvaluations, submitLiveClassEvaluation, getPendingFacultyLogs, verifyFacultyLog, editFaculty, deleteFaculty, editStudent, deleteStudent, getStudentById, getStudents, getMentors, editMentor, deleteMentor, getLiveMonitoring, getStaff, syncLegacyData, saveExamPlan
};
