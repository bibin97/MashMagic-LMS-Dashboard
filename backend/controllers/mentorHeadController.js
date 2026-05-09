const db = require('../config/db');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// @desc    Register a new mentor
// @route   POST /api/mentor-head/register-mentor
// @access  Private (Mentor Head)
exports.registerMentor = async (req, res) => {
    try {
        const { name, email, phone_number, place, password } = req.body;

        // Validation
        if (!name || !email || !phone_number || !place || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all fields (name, email, phone_number, place, password)",
            });
        }

        // Check if mentor already exists
        const [existingPhone] = await db.query('SELECT id FROM users WHERE phone_number = ?', [phone_number]);
        const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

        if (existingPhone.length > 0) {
            return res.status(400).json({ success: false, message: "Mentor already registered with this phone number" });
        }
        if (existingEmail.length > 0) {
            return res.status(400).json({ success: false, message: "Mentor already registered with this email" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create mentor
        const mentorId = await User.create({
            name,
            email,
            phone_number,
            place,
            password: hashedPassword,
            role: 'mentor',
            status: 'pending',
            isApproved: 0,
            registeredBy: req.user.id
        });

        // Notify Admin
        const msg = `<span class="font-bold text-blue-600">${req.user.name}</span> <span class="text-xs bg-blue-100 text-blue-800 px-1 rounded">(Mentor Head)</span> added <span class="font-bold text-indigo-600">${name}</span> <span class="text-xs bg-indigo-100 text-indigo-800 px-1 rounded">(Mentor)</span>`;
        await db.query('INSERT INTO admin_notifications (message, related_id, action_type) VALUES (?, ?, ?)', [msg, mentorId, 'mentor_registration']);

        res.status(201).json({
            success: true,
            message: "Mentor registration successful. Pending Admin approval.",
            mentorId
        });
    } catch (error) {
        console.error('Error in registerMentor:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update a mentor's details (Handover account)
// @route   PUT /api/mentor-head/mentors/:mentorId
// @access  Private (Mentor Head)
// Consolidated version of editMentor moved to bottom for cleanliness, or just kept here. I'll keep one here and remove the others.
exports.editMentor = async (req, res) => {
    try {
        const id = req.params.mentorId || req.params.id;
        const { name, email, phone_number, place, password } = req.body;

        if (!name || !email || !phone_number) {
            return res.status(400).json({ success: false, message: "Name, email, and phone number are required fields" });
        }

        const [existingPhone] = await db.query('SELECT id FROM users WHERE phone_number = ? AND id != ?', [phone_number, id]);
        const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);

        if (existingPhone.length > 0) return res.status(400).json({ success: false, message: "Phone number already in use" });
        if (existingEmail.length > 0) return res.status(400).json({ success: false, message: "Email already in use" });

        let query = 'UPDATE users SET name = ?, email = ?, phone_number = ?, place = ?';
        let params = [name, email, phone_number, place || ''];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ? AND role = "mentor"';
        params.push(id);

        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Mentor not found" });

        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [`Mentor Head (${req.user.name}) updated mentor: ${name}`]);
        res.status(200).json({ success: true, message: "Mentor updated successfully" });
    } catch (error) {
        console.error('Error updating mentor:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};


// @desc    Get mentor's completed student interactions
// @route   GET /api/mentor-head/mentor/:mentorId/students
// @access  Private (Mentor Head)
exports.getMentorStudents = async (req, res) => {
    try {
        const { mentorId } = req.params;

        const query = `
            SELECT 
                s.name as student_name, 
                logs.date,
                logs.log_id,
                logs.type
            FROM (
                SELECT id as log_id, student_id, date, 'Quick' as type FROM student_interaction_logs WHERE mentor_id = ?
                UNION ALL
                SELECT id as log_id, student_id, DATE(created_at) as date, 'Session' as type FROM mentor_session_logs WHERE mentor_id = ?
                UNION ALL
                SELECT id as log_id, student_id, DATE(created_at) as date, 'Hub' as type FROM mentor_session_reports WHERE mentor_id = ?
                UNION ALL
                SELECT id as log_id, student_id, DATE(created_at) as date, 'Mentorship' as type FROM mentorship_logs WHERE mentor_id = ?
            ) as logs
            JOIN students s ON s.id = logs.student_id
            ORDER BY logs.date DESC
        `;

        const [students] = await db.query(query, [mentorId, mentorId, mentorId, mentorId]);

        res.status(200).json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('Error in getMentorStudents:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
// @desc    Get all mentor interaction logs (Student & Faculty calls)
// @route   GET /api/mentor-head/mentor-logs
// @access  Private (Mentor Head)
exports.getMentorInteractionLogs = async (req, res) => {
    try {
        const { mentor_id, mentor_name, date } = req.query;
        // 1. Fetch Student Logs (Merged from all possible student log sources)
        let studentQuery = `
            SELECT * FROM (
                (SELECT 
                    CAST(sil.id AS CHAR) as id,
                    COALESCE(sil.created_at, sil.date) as sort_date,
                    CONVERT(s.name USING utf8mb4) as student_name, 
                    CONVERT(m.name USING utf8mb4) as mentor_name,
                    CONVERT(sil.mentor_notes USING utf8mb4) as mentor_notes,
                    CAST(sil.mentor_id AS CHAR) as mentor_id, 
                    CAST(sil.student_id AS CHAR) as student_id, 
                    sil.date,
                    CONVERT('Student Call' USING utf8mb4) as category, 
                    CONVERT('Quick' USING utf8mb4) as sub_type,
                    CAST(sil.connected_today AS CHAR) as connected_today, 
                    CAST(sil.self_clarity AS CHAR) as self_clarity, 
                    CAST(sil.confidence AS CHAR) as confidence, 
                    CAST(sil.exam_anxiety AS CHAR) as exam_anxiety,
                    CAST(sil.motivation_level AS CHAR) as motivation_level, 
                    CONVERT(sil.mentor_action_needed USING utf8mb4) as mentor_action_needed, 
                    CONVERT(sil.confusing_topic USING utf8mb4) as confusing_topic,
                    sil.created_at,
                    CONVERT(sil.connection_method USING utf8mb4) as connection_method, 
                    CAST(sil.can_solve_independently AS CHAR) as can_solve_independently, 
                    CONVERT(sil.homework_status USING utf8mb4) as homework_status,
                    CAST(sil.homework_difficulty AS CHAR) as homework_difficulty, 
                    CAST(sil.revision_quality AS CHAR) as revision_quality, 
                    CAST(sil.focus_level AS CHAR) as focus_level,
                    CONVERT(sil.student_requests USING utf8mb4) as student_requests, 
                    CONVERT(sil.parent_update_priority USING utf8mb4) as parent_update_priority,
                    NULL as main_issue, NULL as secondary_issue, NULL as weak_subject,
                    NULL as action_type, NULL as action_detail, NULL as followup_required,
                    NULL as followup_date, NULL as student_status, NULL as session_quality_rating,
                    NULL as understanding_after_session
                FROM student_interaction_logs sil
                JOIN students s ON sil.student_id = s.id
                JOIN users m ON sil.mentor_id = m.id)

                UNION ALL

                (SELECT 
                    CAST(msl.id AS CHAR) as id,
                    msl.created_at as sort_date,
                    CONVERT(s.name USING utf8mb4) as student_name, 
                    CONVERT(m.name USING utf8mb4) as mentor_name,
                    CONVERT(msl.action_detail USING utf8mb4) as mentor_notes,
                    CAST(msl.mentor_id AS CHAR) as mentor_id, 
                    CAST(msl.student_id AS CHAR) as student_id, 
                    msl.date,
                    CONVERT('Student Call' USING utf8mb4) as category, 
                    CONVERT('Session' USING utf8mb4) as sub_type,
                    '1' as connected_today, 
                    NULL as self_clarity, 
                    CAST(msl.session_quality_rating AS CHAR) as confidence, 
                    CAST(msl.stress_level AS CHAR) as exam_anxiety,
                    NULL as motivation_level, 
                    CONVERT(msl.action_detail USING utf8mb4) as mentor_action_needed, 
                    CONVERT(msl.main_issue USING utf8mb4) as confusing_topic,
                    msl.created_at,
                    CONVERT(msl.connection_method USING utf8mb4) as connection_method, 
                    NULL as can_solve_independently, 
                    CONVERT(msl.homework_status USING utf8mb4) as homework_status,
                    NULL as homework_difficulty, 
                    CAST(msl.revision_done AS CHAR) as revision_quality, 
                    CAST(msl.focus_level AS CHAR) as focus_level,
                    NULL as student_requests, 
                    CONVERT('Medium' USING utf8mb4) as parent_update_priority,
                    CONVERT(msl.main_issue USING utf8mb4) as main_issue, 
                    CONVERT(msl.secondary_issue USING utf8mb4) as secondary_issue, 
                    CONVERT(msl.weak_subject USING utf8mb4) as weak_subject,
                    CONVERT(msl.action_type USING utf8mb4) as action_type, 
                    CONVERT(msl.action_detail USING utf8mb4) as action_detail, 
                    CAST(msl.followup_required AS CHAR) as followup_required,
                    CAST(msl.followup_date AS CHAR) as followup_date, 
                    CONVERT(msl.student_status USING utf8mb4) as student_status, 
                    CAST(msl.session_quality_rating AS CHAR) as session_quality_rating,
                    CAST(msl.understanding_after_session AS CHAR) as understanding_after_session
                FROM mentor_session_logs msl
                JOIN students s ON msl.student_id = s.id
                JOIN users m ON msl.mentor_id = m.id)

                UNION ALL

                (SELECT 
                    CAST(msr.id AS CHAR) as id,
                    msr.created_at as sort_date,
                    CONVERT(s.name USING utf8mb4) as student_name, 
                    CONVERT(m.name USING utf8mb4) as mentor_name,
                    CONVERT(COALESCE(
                        JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.notes')), 
                        JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.action_plan')),
                        JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.next_task')),
                        JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.study_status')),
                        JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.main_problem')),
                        msr.session_type
                    ) USING utf8mb4) as mentor_notes,
                    CAST(msr.mentor_id AS CHAR) as mentor_id, 
                    CAST(msr.student_id AS CHAR) as student_id, 
                    DATE(msr.created_at) as date,
                    CONVERT('Interaction Hub' USING utf8mb4) as category, 
                    CONVERT(msr.session_type USING utf8mb4) as sub_type,
                    '1' as connected_today, 
                    CAST(JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.self_clarity')) AS CHAR) as self_clarity,
                    CAST(JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.confidence')) AS CHAR) as confidence,
                    NULL as exam_anxiety, NULL as motivation_level, NULL as mentor_action_needed,
                    CONVERT(JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.confusing_topic')) USING utf8mb4) as confusing_topic,
                    msr.created_at,
                    CONVERT('Hub' USING utf8mb4) as connection_method, NULL as can_solve_independently, NULL as homework_status,
                    NULL as homework_difficulty, NULL as revision_quality, NULL as focus_level,
                    NULL as student_requests, CONVERT('Medium' USING utf8mb4) as parent_update_priority,
                    NULL as main_issue, NULL as secondary_issue, NULL as weak_subject,
                    NULL as action_type, NULL as action_detail, NULL as followup_required,
                    NULL as followup_date, NULL as student_status, NULL as session_quality_rating,
                    NULL as understanding_after_session
                FROM mentor_session_reports msr
                JOIN students s ON msr.student_id = s.id
                JOIN users m ON msr.mentor_id = m.id
                WHERE JSON_VALID(msr.report_data))

                UNION ALL

                (SELECT 
                    CAST(ml.id AS CHAR) as id,
                    ml.created_at as sort_date,
                    CONVERT(s.name USING utf8mb4) as student_name, 
                    CONVERT(m.name USING utf8mb4) as mentor_name,
                    CONVERT(ml.action_details USING utf8mb4) as mentor_notes,
                    CAST(ml.mentor_id AS CHAR) as mentor_id, 
                    CAST(ml.student_id AS CHAR) as student_id, 
                    DATE(ml.created_at) as date,
                    CONVERT('Mentorship' USING utf8mb4) as category, 
                    CONVERT('General' USING utf8mb4) as sub_type,
                    '1' as connected_today, NULL as self_clarity, NULL as confidence, NULL as exam_anxiety,
                    NULL as motivation_level, CONVERT(ml.action_details USING utf8mb4) as mentor_action_needed, NULL as confusing_topic,
                    ml.created_at,
                    CONVERT('Mentorship' USING utf8mb4) as connection_method, NULL as can_solve_independently, 
                    CONVERT(ml.homework_status USING utf8mb4) as homework_status,
                    NULL as homework_difficulty, NULL as revision_quality, 
                    CAST(ml.focus_rating AS CHAR) as focus_level,
                    NULL as student_requests, CONVERT(ml.priority USING utf8mb4) as parent_update_priority,
                    NULL as main_issue, NULL as secondary_issue, NULL as weak_subject,
                    NULL as action_type, CONVERT(ml.action_details USING utf8mb4) as action_detail, NULL as followup_required,
                    NULL as followup_date, CONVERT(ml.student_status USING utf8mb4) as student_status, NULL as session_quality_rating,
                    NULL as understanding_after_session
                FROM mentorship_logs ml
                JOIN students s ON ml.student_id = s.id
                JOIN users m ON ml.mentor_id = m.id)

                UNION ALL

                (SELECT 
                    CAST(r.id AS CHAR) as id,
                    r.created_at as sort_date,
                    CONVERT(s.name USING utf8mb4) as student_name, 
                    CONVERT(f.name USING utf8mb4) as mentor_name,
                    CONVERT(r.remarks USING utf8mb4) as mentor_notes,
                    CAST(r.faculty_id AS CHAR) as mentor_id, 
                    CAST(r.student_id AS CHAR) as student_id, 
                    DATE(r.created_at) as date,
                    CONVERT('Faculty Intel' USING utf8mb4) as category, 
                    CONVERT(r.type USING utf8mb4) as sub_type,
                    '1' as connected_today, NULL as self_clarity, NULL as confidence, NULL as exam_anxiety,
                    NULL as motivation_level, CONVERT(r.action_taken USING utf8mb4) as mentor_action_needed, NULL as confusing_topic,
                    r.created_at,
                    CONVERT('Report' USING utf8mb4) as connection_method, NULL as can_solve_independently, 
                    NULL as homework_status, NULL as homework_difficulty, NULL as revision_quality, 
                    NULL as focus_level, NULL as student_requests, CONVERT('Low' USING utf8mb4) as parent_update_priority,
                    NULL as main_issue, NULL as secondary_issue, NULL as weak_subject,
                    NULL as action_type, CONVERT(r.remarks USING utf8mb4) as action_detail, NULL as followup_required,
                    CAST(r.follow_up_date AS CHAR) as followup_date, CONVERT(r.status USING utf8mb4) as student_status, NULL as session_quality_rating,
                    NULL as understanding_after_session
                FROM student_reports r
                JOIN students s ON r.student_id = s.id
                JOIN users f ON r.faculty_id = f.id)
            ) as combined_student_logs
            WHERE 1=1
        `;

        // 2. Fetch Faculty Logs (Logs from Mentors about Faculty)
        let facultyQuery = `
            SELECT * FROM (
                (SELECT 
                    CAST(fil.id AS CHAR) as id, 
                    COALESCE(fil.created_at, fil.date) as sort_date, 
                    CONVERT(s.name USING utf8mb4) as student_name, 
                    CONVERT(m.name USING utf8mb4) as mentor_name, 
                    CAST(fil.mentor_id AS CHAR) as mentor_id,
                    CONVERT('Intelligence' USING utf8mb4) as category,
                    CONVERT(fil.notes USING utf8mb4) as remarks,
                    NULL as action_plan,
                    NULL as followup_required,
                    NULL as followup_date,
                    DATE(fil.date) as date
                FROM faculty_interaction_logs fil
                JOIN students s ON fil.student_id = s.id
                JOIN users m ON fil.mentor_id = m.id)

                UNION ALL

                (SELECT 
                    CAST(mfi.id AS CHAR) as id,
                    mfi.created_at as sort_date,
                    CONVERT(s.name USING utf8mb4) as student_name,
                    CONVERT(m.name USING utf8mb4) as mentor_name,
                    CAST(mfi.mentor_id AS CHAR) as mentor_id,
                    CONVERT('Faculty Tracking' USING utf8mb4) as category,
                    CONVERT(mfi.main_issue USING utf8mb4) as remarks,
                    CONVERT(mfi.action_plan USING utf8mb4) as action_plan,
                    CAST(mfi.followup_required AS CHAR) as followup_required,
                    CAST(mfi.followup_date AS CHAR) as followup_date,
                    DATE(mfi.date) as date
                FROM mentor_faculty_interactions mfi
                JOIN students s ON mfi.student_id = s.id
                JOIN users m ON mfi.mentor_id = m.id)
            ) as combined_faculty_logs
            WHERE 1=1
        `;
        let studentParams = [];
        let facultyParams = [];

        if (mentor_id) {
            studentQuery += " AND mentor_id = ?";
            facultyQuery += " AND mentor_id = ?";
            studentParams.push(mentor_id);
            facultyParams.push(mentor_id);
        } else if (mentor_name) {
            studentQuery += " AND mentor_name LIKE ?";
            facultyQuery += " AND mentor_name LIKE ?";
            studentParams.push(`%${mentor_name}%`);
            facultyParams.push(`%${mentor_name}%`);
        }

        if (date) {
            studentQuery += " AND date = ?";
            facultyQuery += " AND date = ?";
            studentParams.push(date);
            facultyParams.push(date);
        }

        studentQuery += " ORDER BY sort_date DESC";
        facultyQuery += " ORDER BY sort_date DESC";

        const [studentLogs] = await db.query(studentQuery, studentParams);
        const [facultyLogs] = await db.query(facultyQuery, facultyParams);

        res.status(200).json({
            success: true,
            data: {
                studentLogs,
                facultyLogs
            }
        });
    } catch (error) {
        console.error('Error in getMentorInteractionLogs:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};


// @desc    Get all intelligence reports submitted by faculties
// @route   GET /api/mentor-head/faculty-intelligence
// @access  Private (Mentor Head)
exports.getFacultyIntelligenceLogs = async (req, res) => {
    try {
        const [reports] = await db.query(`
            SELECT r.*, 
                   CONVERT(s.name USING utf8mb4) as student_name, 
                   CONVERT(u.name USING utf8mb4) as faculty_name
            FROM student_reports r
            JOIN students s ON r.student_id = s.id
            JOIN users u ON r.faculty_id = u.id
            ORDER BY r.created_at DESC
        `);

        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Error in getFacultyIntelligenceLogs:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
// @desc    Get all recent activities (interaction logs) from all mentors
// @route   GET /api/mentor-head/activities
// @access  Private (Mentor Head)
exports.getAllActivities = async (req, res) => {
    try {
        const { mentor_id, mentor_name, date } = req.query;
        let params = [];
        let query = `
            SELECT * FROM (
                (SELECT 
                    CAST(sil.id AS CHAR) as log_id,
                    COALESCE(sil.created_at, sil.date) as date,
                    CONVERT(sil.mentor_notes USING utf8mb4) as mentor_notes,
                    CONVERT(COALESCE(s.name, 'Unknown Student') USING utf8mb4) as student_name,
                    CONVERT(COALESCE(m.name, 'Unknown Mentor') USING utf8mb4) as mentor_name,
                    CAST(sil.mentor_id AS CHAR) as mentor_id,
                    CONVERT(COALESCE(m.place, 'N/A') USING utf8mb4) as mentor_place,
                    CONVERT('Quick Log' USING utf8mb4) as type,
                    CONVERT('Quick Log' USING utf8mb4) as source,
                    CAST(sil.self_clarity AS CHAR) as understanding_level,
                    CAST(sil.confidence AS CHAR) as student_confidence,
                    CAST(sil.exam_anxiety AS CHAR) as stress_level,
                    sil.created_at
                FROM student_interaction_logs sil
                LEFT JOIN students s ON s.id = sil.student_id
                LEFT JOIN users m ON m.id = sil.mentor_id)
                
                UNION ALL
                
                (SELECT 
                    CAST(msl.id AS CHAR) as log_id,
                    msl.created_at as date,
                    CONVERT(CONCAT(msl.main_issue, ': ', msl.action_type) USING utf8mb4) as mentor_notes,
                    CONVERT(COALESCE(s.name, 'Unknown Student') USING utf8mb4) as student_name,
                    CONVERT(COALESCE(m.name, 'Unknown Mentor') USING utf8mb4) as mentor_name,
                    CAST(msl.mentor_id AS CHAR) as mentor_id,
                    CONVERT(COALESCE(m.place, 'N/A') USING utf8mb4) as mentor_place,
                    CONVERT('Session Log' USING utf8mb4) as type,
                    CONVERT('Session Log' USING utf8mb4) as source,
                    CAST(msl.understanding_after_session AS CHAR) as understanding_level,
                    CAST(msl.session_quality_rating AS CHAR) as student_confidence,
                    CAST(msl.stress_level AS CHAR) as stress_level,
                    msl.created_at
                FROM mentor_session_logs msl
                LEFT JOIN students s ON s.id = msl.student_id
                LEFT JOIN users m ON m.id = msl.mentor_id)

                UNION ALL

                (SELECT 
                    CAST(msr.id AS CHAR) as log_id,
                    msr.created_at as date,
                    CONVERT(COALESCE(
                        JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.notes')), 
                        JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.action_plan')),
                        JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.next_task')),
                        JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.study_status')),
                        JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.main_problem')),
                        msr.session_type
                    ) USING utf8mb4) as mentor_notes,
                    CONVERT(COALESCE(s.name, 'Unknown Student') USING utf8mb4) as student_name,
                    CONVERT(COALESCE(m.name, 'Unknown Mentor') USING utf8mb4) as mentor_name,
                    CAST(msr.mentor_id AS CHAR) as mentor_id,
                    CONVERT(COALESCE(m.place, 'N/A') USING utf8mb4) as mentor_place,
                    CONVERT(CONCAT('Hub: ', msr.session_type) USING utf8mb4) as type,
                    CONVERT('Interaction Hub' USING utf8mb4) as source,
                    CAST(JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.understanding_level')) AS CHAR) as understanding_level,
                    CAST(JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.confidence')) AS CHAR) as student_confidence,
                    NULL as stress_level,
                    msr.created_at
                FROM mentor_session_reports msr
                LEFT JOIN students s ON s.id = msr.student_id
                LEFT JOIN users m ON m.id = msr.mentor_id
                WHERE JSON_VALID(msr.report_data))

                UNION ALL

                (SELECT 
                    CAST(ml.id AS CHAR) as log_id,
                    ml.created_at as date,
                    CONVERT(ml.action_details USING utf8mb4) as mentor_notes,
                    CONVERT(COALESCE(s.name, 'Unknown Student') USING utf8mb4) as student_name,
                    CONVERT(COALESCE(m.name, 'Unknown Mentor') USING utf8mb4) as mentor_name,
                    CAST(ml.mentor_id AS CHAR) as mentor_id,
                    CONVERT(COALESCE(m.place, 'N/A') USING utf8mb4) as mentor_place,
                    CONVERT('Mentorship' USING utf8mb4) as type,
                    CONVERT('Mentorship' USING utf8mb4) as source,
                    NULL as understanding_level,
                    NULL as student_confidence,
                    NULL as stress_level,
                    ml.created_at
                FROM mentorship_logs ml
                LEFT JOIN students s ON s.id = ml.student_id
                LEFT JOIN users m ON m.id = ml.mentor_id)

                UNION ALL
                
                (SELECT 
                    CAST(mfi.id AS CHAR) as log_id,
                    mfi.created_at as date,
                    CONVERT(mfi.main_issue USING utf8mb4) as mentor_notes,
                    CONVERT(COALESCE(s.name, 'Unknown Student') USING utf8mb4) as student_name,
                    CONVERT(COALESCE(m.name, 'Unknown Mentor') USING utf8mb4) as mentor_name,
                    CAST(mfi.mentor_id AS CHAR) as mentor_id,
                    CONVERT(COALESCE(m.place, 'N/A') USING utf8mb4) as mentor_place,
                    CONVERT('Faculty Call' USING utf8mb4) as type,
                    CONVERT('Faculty Interaction' USING utf8mb4) as source,
                    NULL as understanding_level,
                    NULL as student_confidence,
                    NULL as stress_level,
                    mfi.created_at
                FROM mentor_faculty_interactions mfi
                LEFT JOIN students s ON s.id = mfi.student_id
                LEFT JOIN users m ON m.id = mfi.mentor_id)
                
                UNION ALL
                
                (SELECT 
                    CAST(fil.id AS CHAR) as log_id,
                    COALESCE(fil.created_at, fil.date) as date,
                    CONVERT(fil.notes USING utf8mb4) as mentor_notes,
                    CONVERT(COALESCE(s.name, 'Unknown Student') USING utf8mb4) as student_name,
                    CONVERT(COALESCE(m.name, 'Unknown Mentor') USING utf8mb4) as mentor_name,
                    CAST(fil.mentor_id AS CHAR) as mentor_id,
                    CONVERT(COALESCE(m.place, 'N/A') USING utf8mb4) as mentor_place,
                    CONVERT('Faculty Tracking' USING utf8mb4) as type,
                    CONVERT('Faculty Tracking' USING utf8mb4) as source,
                    NULL as understanding_level,
                    NULL as student_confidence,
                    NULL as stress_level,
                    fil.created_at
                FROM faculty_interaction_logs fil
                LEFT JOIN students s ON s.id = fil.student_id
                LEFT JOIN users m ON m.id = fil.mentor_id)
            ) as activities
            WHERE 1=1
        `;

        if (mentor_id) {
            query += " AND mentor_id = ?";
            params.push(mentor_id);
        } else if (mentor_name) {
            query += " AND mentor_name LIKE ?";
            params.push(`%${mentor_name}%`);
        }

        if (date) {
            query += " AND DATE(date) = ?";
            params.push(date);
        }

        query += " ORDER BY date DESC LIMIT 100";

        const [activities] = await db.query(query, params);

        res.status(200).json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('Error in getAllActivities:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
// @desc    Get detailed view of a specific mentor
// @route   GET /api/mentor-head/mentor/:mentorId/details
// @access  Private (Mentor Head)
exports.getMentorDetails = async (req, res) => {
    try {
        const { mentorId } = req.params;

        // 1. Profile Query
        let mentorProfile;
        try {
            [mentorProfile] = await db.query(
                'SELECT id, name, phone_number, place, status, createdAt as created_at FROM users WHERE id = ? AND role = "mentor"',
                [mentorId]
            );
            if (mentorProfile.length === 0) {
                return res.status(404).json({ success: false, message: "Mentor not found" });
            }
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error in Profile Query", error: err.message });
        }

        // 2. Assigned Students Query
        let assignedStudents;
        try {
            [assignedStudents] = await db.query(
                'SELECT id, name, grade, course, subject, onboarding_status, faculty_name FROM students WHERE mentor_id = ?',
                [mentorId]
            );
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error in Students Query", error: err.message });
        }

        // 3. Interaction Logs Query
        let interactionLogs;
        try {
            [interactionLogs] = await db.query(
                `SELECT * FROM (
                    SELECT sil.id, sil.student_id, sil.date, sil.mentor_notes as details, s.name as student_name, 'Quick Log' as type, sil.created_at
                    FROM student_interaction_logs sil 
                    JOIN students s ON s.id = sil.student_id 
                    WHERE sil.mentor_id = ?
                    
                    UNION ALL
                    
                    SELECT msl.id, msl.student_id, DATE(msl.created_at) as date, CONCAT(msl.main_issue, ': ', msl.action_type) as details, s.name as student_name, 'Session Log' as type, msl.created_at
                    FROM mentor_session_logs msl
                    JOIN students s ON s.id = msl.student_id
                    WHERE msl.mentor_id = ?
                    
                    UNION ALL
                    
                    SELECT msr.id, msr.student_id, DATE(msr.created_at) as date, JSON_UNQUOTE(JSON_EXTRACT(msr.report_data, '$.notes')) as details, s.name as student_name, CONCAT('Hub: ', msr.session_type) as type, msr.created_at
                    FROM mentor_session_reports msr
                    JOIN students s ON s.id = msr.student_id
                    WHERE msr.mentor_id = ? AND JSON_VALID(msr.report_data)
                    
                    UNION ALL
                    
                    SELECT ml.id, ml.student_id, DATE(ml.created_at) as date, ml.action_details as details, s.name as student_name, 'Mentorship' as type, ml.created_at
                    FROM mentorship_logs ml
                    JOIN students s ON s.id = ml.student_id
                    WHERE ml.mentor_id = ?
                ) as combined_logs
                ORDER BY created_at DESC`,
                [mentorId, mentorId, mentorId, mentorId]
            );
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error in Interaction Logs Query", error: err.message });
        }

        // 4. Faculty Logs Query
        let facultyLogs;
        try {
            [facultyLogs] = await db.query(
                `SELECT * FROM (
                    SELECT fil.id, fil.student_id, fil.date, fil.notes as details, s.name as student_name, 'Tracking' as type, fil.created_at
                    FROM faculty_interaction_logs fil 
                    JOIN students s ON s.id = fil.student_id 
                    WHERE fil.mentor_id = ?
                    
                    UNION ALL
                    
                    SELECT mfi.id, mfi.student_id, DATE(mfi.created_at) as date, mfi.main_issue as details, s.name as student_name, 'Interaction' as type, mfi.created_at
                    FROM mentor_faculty_interactions mfi
                    JOIN students s ON s.id = mfi.student_id
                    WHERE mfi.mentor_id = ?
                ) as combined_faculty
                ORDER BY created_at DESC`,
                [mentorId, mentorId]
            );
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error in Faculty Logs Query", error: err.message });
        }

        res.status(200).json({
            success: true,
            data: {
                profile: mentorProfile[0],
                assignedStudents,
                logs: interactionLogs,
                facultyLogs
            }
        });
    } catch (error) {
        console.error('Error in getMentorDetails:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get Mentor Activity Dashboard
// @route   GET /api/mentor-head/mentor-activity
exports.getMentorActivityDashboard = async (req, res) => {
    try {
        // Fetch mentors with their basic counts first
        const query = `
            SELECT 
                u.id as mentor_id,
                u.name as mentor_name,
                u.email,
                u.phone_number,
                u.place,
                (SELECT COUNT(*) FROM students WHERE mentor_id = u.id) AS total_assigned_students,
                (SELECT COUNT(DISTINCT student_id) FROM student_interaction_logs WHERE mentor_id = u.id AND date = CURDATE() AND connected_today = TRUE) AS students_connected_today,
                (SELECT COUNT(*) FROM tasks WHERE mentor_id = u.id AND status = 'Completed' AND DATE(created_at) = CURDATE()) AS tasks_completed_today
            FROM users u
            WHERE u.role IN ('mentor', 'Mentor')
        `;
        const [mentors] = await db.query(query);

        // For each mentor, fetch their student list separately
        const mentorsWithStudents = await Promise.all(mentors.map(async (mentor) => {
            try {
                const [students] = await db.query(
                    'SELECT id, name, grade, course, faculty_name, is_shifted, shifted_from FROM students WHERE mentor_id = ?',
                    [mentor.mentor_id]
                );
                return {
                    ...mentor,
                    students_list: students
                };
            } catch (err) {
                console.error(`Error fetching students for mentor ${mentor.mentor_id}:`, err);
                return { ...mentor, students_list: [] };
            }
        }));

        res.status(200).json({ success: true, data: mentorsWithStudents });
    } catch (error) {
        console.error("Dashboard Global Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get specific mentor monitoring details
// @route   GET /api/mentor-head/mentors/:mentorId/monitoring
exports.getMentorMonitoringDetails = async (req, res) => {
    try {
        const { mentorId } = req.params;
        
        // 1. Mentor Profile
        let mentorProfile;
        try {
            [mentorProfile] = await db.query('SELECT id, name, phone_number, place FROM users WHERE id = ?', [mentorId]);
            if (mentorProfile.length === 0) return res.status(404).json({ success: false, message: 'Mentor not found in Monitoring' });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error in Monitoring Profile Query", error: err.message });
        }

        // 2. Assigned Students with Today's Connection Status
        let assignedStudents;
        try {
            [assignedStudents] = await db.query(`
                SELECT s.id, s.name, s.course, s.grade, s.onboarding_status, s.faculty_name, s.is_shifted, s.shifted_from,
                       CASE WHEN EXISTS(SELECT 1 FROM student_interaction_logs sil WHERE sil.student_id = s.id AND sil.date = CURDATE() AND sil.connected_today = TRUE) THEN 1 ELSE 0 END AS connected_today
                FROM students s
                WHERE s.mentor_id = ?
            `, [mentorId]);
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error in Monitoring Students Query", error: err.message });
        }

        // 3. Monthly Stats
        let monthlyStats;
        try {
            [monthlyStats] = await db.query(`
                SELECT COUNT(DISTINCT CONCAT(student_id, date)) as total_connections 
                FROM student_interaction_logs 
                WHERE mentor_id = ? AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
            `, [mentorId]);
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error in Monitoring Stats Query", error: err.message });
        }

        res.status(200).json({
            success: true,
            data: {
                profile: mentorProfile[0],
                assignedStudents,
                todayConnectionCount: assignedStudents.filter(s => s.connected_today).length,
                monthlyConnections: monthlyStats[0].total_connections
            }
        });
    } catch (error) {
        console.error('Monitoring Error:', error);
        res.status(500).json({ success: false, message: "Monitoring Server Error", error: error.message });
    }
};

// @desc    Get all students for shifting
// @route   GET /api/mentor-head/all-students
exports.getAllStudents = async (req, res) => {
    try {
        const [students] = await db.query('SELECT id, name, course, grade, mentor_id, onboarding_status FROM students');
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Shift student to another mentor
// @route   PUT /api/mentor-head/students/:studentId/shift
exports.shiftStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { newMentorId } = req.body;

        const [oldMentorRes] = await db.query('SELECT mentor_name FROM students WHERE id = ?', [studentId]);
        const oldMentorName = oldMentorRes.length > 0 ? oldMentorRes[0].mentor_name : 'Unknown';

        const [mentor] = await db.query('SELECT name FROM users WHERE id = ?', [newMentorId]);
        if (mentor.length === 0) return res.status(404).json({ success: false, message: 'Mentor not found' });
        const mentorName = mentor[0].name;

        // Shift student, mark as shifted, and CLEAR faculty assignment
        await db.query(
            'UPDATE students SET mentor_id = ?, mentor_name = ?, faculty_id = NULL, faculty_name = "Not Assigned", is_shifted = 1, shifted_from = ? WHERE id = ?',
            [newMentorId, mentorName, oldMentorName, studentId]
        );

        // Preserve history and ensure it appears in the new mentor's activity/panel
        // We update the mentor_id to the new mentor so it shows up in their dashboard/lists
        // while the student_id keeps it tied to the student's history.
        await db.query('UPDATE student_interaction_logs SET mentor_id = ? WHERE student_id = ?', [newMentorId, studentId]);
        await db.query('UPDATE faculty_interaction_logs SET mentor_id = ? WHERE student_id = ?', [newMentorId, studentId]);
        await db.query('UPDATE mentor_timetable SET mentor_id = ? WHERE student_id = ?', [newMentorId, studentId]);
        await db.query('UPDATE daily_hours_log SET mentor_id = ? WHERE student_id = ?', [newMentorId, studentId]);

        // Notify
        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [`Student shifted from ${oldMentorName} to ${mentorName}. All history transferred.`]);

        res.status(200).json({ success: true, message: 'Student and history shifted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Daily Student Checks (for Mentor Head)
// @route   GET /api/mentor-head/daily-student-checks
exports.getDailyStudentChecks = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id as student_id,
                s.name as student_name,
                s.onboarding_status,
                u.name as mentor_name,
                (SELECT MAX(date) FROM student_interaction_logs WHERE student_id = s.id) AS last_interaction_date,
                (SELECT COUNT(*) FROM student_interaction_logs WHERE student_id = s.id) AS total_interaction_count,
                (SELECT COUNT(*) FROM student_verification WHERE student_id = s.id) AS total_check_count
            FROM students s
            LEFT JOIN users u ON s.mentor_id = u.id
        `;
        const [students] = await db.query(query);
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add a manual check marker
// @route   POST /api/mentor-head/students/:studentId/check
exports.checkStudentToday = async (req, res) => {
    try {
        const { studentId } = req.params;
        const mentorHeadId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        // "Every click creates a new record. Repetition allowed"
        await db.query(
            'INSERT INTO student_verification (student_id, mentor_head_id, date) VALUES (?, ?, ?)',
            [studentId, mentorHeadId, today]
        );

        res.status(200).json({ success: true, message: 'Student verification check added' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Remove the latest manual check marker
// @route   DELETE /api/mentor-head/students/:studentId/uncheck
exports.uncheckStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        await db.query(`
            DELETE FROM student_verification 
            WHERE id = (
                SELECT id FROM (
                    SELECT id FROM student_verification 
                    WHERE student_id = ? 
                    ORDER BY id DESC LIMIT 1
                ) as t
            )
        `, [studentId]);

        res.status(200).json({ success: true, message: 'Latest student verification check removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Daily Summary (for Mentor Head)
// @route   GET /api/mentor-head/daily-summary
exports.getDailySummary = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) AS totalStudents FROM students WHERE status = "active"');
        const [[{ checkedToday }]] = await db.query(`
            SELECT COUNT(DISTINCT student_id) as checkedToday FROM (
                SELECT student_id FROM student_interaction_logs WHERE DATE(created_at) = ?
                UNION
                SELECT student_id FROM mentor_session_logs WHERE DATE(created_at) = ?
                UNION
                SELECT student_id FROM mentor_session_reports WHERE DATE(created_at) = ?
                UNION
                SELECT student_id FROM mentorship_logs WHERE DATE(created_at) = ?
                UNION
                SELECT student_id FROM student_verification WHERE date = ?
            ) as daily_checks
        `, [today, today, today, today, today]);

        const remaining = totalStudents - checkedToday;

        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                checkedToday,
                remaining
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Edit Mentor Details
// @route   PUT /api/mentor-head/mentors/:mentorId
exports.editMentor = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const { name, phone_number, place } = req.body;
        const mentorHeadName = req.user.name || 'Mentor Head';

        const [result] = await db.query(
            'UPDATE users SET name = ?, phone_number = ?, place = ? WHERE id = ? AND role = "mentor"',
            [name, phone_number, place, mentorId]
        );

        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Mentor not found' });

        // Notify Admin
        const msg = `${mentorHeadName} updated details for mentor: ${name}`;
        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [msg]);

        res.status(200).json({ success: true, message: 'Mentor updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete Mentor
// @route   DELETE /api/mentor-head/mentors/:mentorId
exports.deleteMentor = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const mentorHeadName = req.user.name || 'Mentor Head';

        const [mentor] = await db.query('SELECT name FROM users WHERE id = ? AND role = "mentor"', [mentorId]);
        if (mentor.length === 0) return res.status(404).json({ success: false, message: 'Mentor not found' });

        const mentorName = mentor[0].name;

        await db.query('UPDATE students SET mentor_id = NULL WHERE mentor_id = ?', [mentorId]);
        await db.query('DELETE FROM users WHERE id = ? AND role = "mentor"', [mentorId]);

        const msg = `${mentorHeadName} deleted mentor: ${mentorName}`;
        try {
            await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [msg]);
        } catch (e) { }

        res.status(200).json({ success: true, message: 'Mentor deleted successfully' });
    } catch (error) {
        console.error('Error deleting mentor:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get exam analytics for graphs
exports.getExamAnalytics = async (req, res) => {
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

exports.editStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, grade, subject, course } = req.body;
        const [[student]] = await db.query('SELECT name FROM students WHERE id = ?', [id]);
        await db.query('UPDATE students SET name = ?, grade = ?, subject = ?, course = ? WHERE id = ?', [name, grade, subject, course, id]);
        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [`Mentor Head (${req.user.name}) edited student: ${student.name}`]);
        res.status(200).json({ success: true, message: 'Student updated' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const [[student]] = await db.query('SELECT name FROM students WHERE id = ?', [id]);
        await db.query('DELETE FROM students WHERE id = ?', [id]);
        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [`Mentor Head (${req.user.name}) deleted student: ${student.name}`]);
        res.status(200).json({ success: true, message: 'Student deleted' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getFaculties = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email, phone_number, place, status, createdAt FROM users WHERE role = "faculty" ORDER BY name ASC');
        res.status(200).json({ success: true, data: rows });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getStudents = async (req, res) => {
    try {
        const { mentor_id } = req.query;
        let query = 'SELECT s.*, m.name as mentor_name, f.name as faculty_name FROM students s LEFT JOIN users m ON s.mentor_id = m.id LEFT JOIN users f ON s.faculty_id = f.id';
        let params = [];
        
        if (mentor_id) {
            query += ' WHERE s.mentor_id = ?';
            params.push(mentor_id);
        }
        
        query += ' ORDER BY s.created_at DESC';
        const [rows] = await db.query(query, params);
        res.status(200).json({ success: true, data: rows });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.editFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone_number, place } = req.body;
        const [[user]] = await db.query('SELECT name FROM users WHERE id = ?', [id]);
        await db.query('UPDATE users SET name = ?, email = ?, phone_number = ?, place = ? WHERE id = ?', [name, email, phone_number, place, id]);
        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [`Mentor Head (${req.user.name}) edited faculty: ${user.name}`]);
        res.status(200).json({ success: true, message: 'Faculty updated' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        const [[user]] = await db.query('SELECT name FROM users WHERE id = ?', [id]);
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [`Mentor Head (${req.user.name}) deleted faculty: ${user.name}`]);
        res.status(200).json({ success: true, message: 'Faculty deleted' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getMentors = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.name, u.email, u.phone_number, u.place, u.status,
            (SELECT COUNT(*) FROM students WHERE mentor_id = u.id) as studentCount
            FROM users u WHERE u.role = 'mentor' ORDER BY u.name ASC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Toggle Course Completed status for a student
// @route   PUT /api/mentor-head/students/:studentId/course-complete
exports.toggleCourseCompleted = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { isCompleted } = req.body;

        await db.query('UPDATE students SET course_completed = ? WHERE id = ?', [isCompleted ? 1 : 0, studentId]);

        const [[student]] = await db.query('SELECT name FROM students WHERE id = ?', [studentId]);
        const statusMsg = isCompleted ? 'marked as Course Completed' : 'unmarked from Course Completed';
        await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [`Mentor Head (${req.user.name}) ${statusMsg} for student: ${student.name}`]);

        res.status(200).json({ success: true, message: `Student ${statusMsg}` });
    } catch (error) {
        console.error('Error in toggleCourseCompleted:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get dashboard stats (mentors with completed counts)
// @route   GET /api/mentor-head/dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        // Frontend expects an array of mentors to calculate stats
        const [mentors] = await db.query(`
            SELECT 
                u.id, 
                u.name, 
                u.status,
                (SELECT COUNT(*) FROM student_interaction_logs WHERE mentor_id = u.id) as completed_count
            FROM users u 
            WHERE u.role = 'mentor' AND u.status = 'active'
        `);

        res.status(200).json({
            success: true,
            data: mentors
        });
    } catch (error) {
        console.error('Error in getMentorHeadDashboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Daily Summary (Mentors and Students)
// @route   GET /api/mentor-head/daily-summary
exports.getDailySummary = async (req, res) => {
    try {
        const [totalRes] = await db.query("SELECT COUNT(*) as count FROM students WHERE status = 'active'");
        const [checkedRes] = await db.query("SELECT COUNT(DISTINCT student_id) as count FROM student_interaction_logs WHERE DATE(created_at) = CURDATE()");
        
        const totalStudents = totalRes[0].count;
        const checkedToday = checkedRes[0].count;
        const remaining = totalStudents - checkedToday;

        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                checkedToday,
                remaining: remaining > 0 ? remaining : 0
            }
        });
    } catch (error) {
        console.error('Error in getDailySummary:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Exam Analytics
// @route   GET /api/mentor-head/exam-analytics
exports.getExamAnalytics = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                subject, 
                AVG(marks) as avg_marks, 
                AVG(total) as avg_total,
                (AVG(marks) / AVG(total) * 100) as percentage,
                MAX(marks) as max_marks, 
                COUNT(*) as total_students
            FROM student_marks
            GROUP BY subject
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error in getExamAnalytics:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Delete a specific interaction log
// @route   DELETE /api/mentor-head/logs/:id
// @access  Private (Mentor Head)
exports.deleteInteractionLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { source } = req.query; // Expecting source table name or identifier

        if (!id || !source) {
            return res.status(400).json({ success: false, message: "Log ID and Source are required" });
        }

        let tableName = "";
        switch (source) {
            case "Student Call":
            case "student_interaction_logs":
                tableName = "student_interaction_logs";
                break;
            case "Interaction Hub":
            case "mentor_session_reports":
                tableName = "mentor_session_reports";
                break;
            case "Faculty Tracking":
            case "faculty_interaction_logs":
                tableName = "faculty_interaction_logs";
                break;
            case "Faculty Interaction":
            case "mentor_faculty_interactions":
                tableName = "mentor_faculty_interactions";
                break;
            case "Mentorship":
            case "mentorship_logs":
                tableName = "mentorship_logs";
                break;
            case "Session Log":
            case "mentor_session_logs":
                tableName = "mentor_session_logs";
                break;
            case "Intelligence":
            case "student_reports":
                tableName = "student_reports";
                break;
            default:
                return res.status(400).json({ success: false, message: "Invalid log source provided" });
        }

        const [result] = await db.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Log not found or already deleted" });
        }

        // Notify admin about the deletion
        try {
            const adminMsg = `Mentor Head (${req.user.name}) deleted a log from ${tableName} (ID: ${id})`;
            await db.query('INSERT INTO admin_notifications (message) VALUES (?)', [adminMsg]);
        } catch (err) {
            console.error("Failed to notify admin about log deletion");
        }

        res.status(200).json({
            success: true,
            message: "Interaction log permanently deleted"
        });
    } catch (error) {
        console.error('Error in deleteInteractionLog:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get dropdown data for student editing
// @route   GET /api/mentor-head/dropdowns
exports.getDropdownData = async (req, res) => {
    try {
        const [mentors] = await db.query('SELECT id, name FROM users WHERE role = "mentor" AND status = "active"');
        const [faculties] = await db.query('SELECT id, name FROM users WHERE role = "faculty" AND status = "active"');
        res.status(200).json({
            success: true,
            data: {
                mentors,
                faculties
            }
        });
    } catch (error) {
        console.error('Error in getDropdownData:', error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

