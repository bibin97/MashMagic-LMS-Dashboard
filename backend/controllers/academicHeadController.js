const db = require('../config/db');

const getDailyStudentRotation = async (req, res) => {
    try {
        const ah_id = req.user.id;
        
        // Check if rotation already generated for today
        const [existing] = await db.query(`
            SELECT r.*, s.name as student_name, s.contact as phone_number
            FROM ah_student_rotation r
            JOIN students s ON r.student_id = s.id
            WHERE r.academic_head_id = ? AND r.rotation_date = CURDATE()
        `, [ah_id]);

        if (existing.length >= 15) {
            return res.status(200).json({ success: true, data: existing });
        } else if (existing.length > 0) {
            // Clear incomplete rotation to regenerate
            await db.query('DELETE FROM ah_student_rotation WHERE academic_head_id = ? AND rotation_date = CURDATE()', [ah_id]);
        }

        // Fetch 15 students who haven't been in rotation recently
        const [students] = await db.query(`
            SELECT id, name, subjects_json, contact 
            FROM students 
            WHERE status = 'active'
            ORDER BY (SELECT MAX(rotation_date) FROM ah_student_rotation WHERE student_id = students.id) ASC, RAND()
            LIMIT 15
        `);

        if (students.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Prepare rotations
        const insertPromises = students.map(async (st) => {
            // Get previous round
            const [history] = await db.query(`SELECT MAX(round_number) as last_round FROM ah_student_rotation WHERE student_id = ?`, [st.id]);
            let last_round = 0;
            if (history.length > 0 && history[0].last_round) {
                last_round = history[0].last_round;
            }

            let subjects = [];
            try {
                if (st.subjects_json) {
                    subjects = JSON.parse(st.subjects_json);
                }
            } catch (e) {
                console.error("Error parsing subjects JSON for student", st.id);
            }

            const next_round = last_round + 1;
            const total_subjects = subjects.length;
            let subject_name = 'General';

            if (total_subjects > 0) {
                const subjectIndex = (next_round - 1) % total_subjects;
                subject_name = subjects[subjectIndex];
            }

            return db.query(`
                INSERT INTO ah_student_rotation (student_id, academic_head_id, round_number, total_subjects, subject_name, rotation_date)
                VALUES (?, ?, ?, ?, ?, CURDATE())
            `, [st.id, ah_id, next_round, total_subjects, subject_name]);
        });
        
        await Promise.all(insertPromises);

        // Fetch newly created rotation
        const [newRotation] = await db.query(`
            SELECT r.*, s.name as student_name, s.contact as phone_number
            FROM ah_student_rotation r
            JOIN students s ON r.student_id = s.id
            WHERE r.academic_head_id = ? AND r.rotation_date = CURDATE()
        `, [ah_id]);

        res.status(200).json({ success: true, data: newRotation });
    } catch (error) {
        console.error("Error generating daily student rotation:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const updateStudentRotation = async (req, res) => {
    try {
        const { id: student_id } = req.params; // Using student_id here
        const { status, notes, next_call_date } = req.body;
        const ah_id = req.user.id;

        const [existing] = await db.query('SELECT id FROM ah_student_rotation WHERE student_id = ? AND academic_head_id = ? AND rotation_date = CURDATE()', [student_id, ah_id]);

        if (existing.length > 0) {
            await db.query(`
                UPDATE ah_student_rotation 
                SET status = ?, notes = ?, next_call_date = ?
                WHERE id = ?
            `, [status, notes || null, next_call_date || null, existing[0].id]);
        } else {
            await db.query(`
                INSERT INTO ah_student_rotation (student_id, academic_head_id, rotation_date, status, notes, next_call_date, round_number, total_subjects, subject_name)
                VALUES (?, ?, CURDATE(), ?, ?, ?, 1, 1, 'General')
            `, [student_id, ah_id, status, notes || null, next_call_date || null]);
        }

        res.status(200).json({ success: true, message: "Rotation updated" });
    } catch (error) {
        console.error("Error updating student rotation:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getFacultyQualityChecks = async (req, res) => {
    try {
        const [evaluations] = await db.query(`
            SELECT q.*, f.name as faculty_name 
            FROM ah_faculty_quality q
            JOIN users f ON q.faculty_id = f.id
            ORDER BY q.date DESC
        `);

        // Fetch live scheduled sessions for today (from timetable)
        const [liveSessions] = await db.query(`
            SELECT t.id, t.student_id, t.faculty_id, t.start_time, t.end_time, COALESCE(t.chapter, t.session_type, 'General Session') as topic, t.status, s.meeting_link,
                   f.name as faculty_name, s.name as student_name,
                   r.id as rotation_id, r.status as call_status, r.notes, r.next_call_date
            FROM timetable t
            LEFT JOIN users f ON t.faculty_id = f.id
            JOIN students s ON t.student_id = s.id
            LEFT JOIN ah_student_rotation r ON r.student_id = s.id AND r.rotation_date = CURDATE() AND r.academic_head_id = ?
            WHERE t.date = CURDATE()
            ORDER BY RAND(DAYOFYEAR(CURDATE()) + YEAR(CURDATE()))
            LIMIT 15
        `, [req.user.id]);

        res.status(200).json({ success: true, data: { evaluations, liveSessions } });
    } catch (error) {
        console.error("Error fetching faculty quality:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const addFacultyQualityCheck = async (req, res) => {
    try {
        const { faculty_id, class_topic, score, remarks } = req.body;
        const ah_id = req.user.id;
        const proof_url = req.file ? req.file.path : null;
        
        try {
            await db.query('ALTER TABLE ah_faculty_quality ADD COLUMN proof_url VARCHAR(500) DEFAULT NULL');
        } catch (e) {}

        await db.query(`
            INSERT INTO ah_faculty_quality (faculty_id, academic_head_id, class_topic, score, remarks, proof_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [faculty_id, ah_id, class_topic, score, remarks, proof_url]);
        
        res.status(201).json({ success: true, message: "Quality check added successfully" });
    } catch (error) {
        console.error("Error adding faculty quality:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getParentMeetings = async (req, res) => {
    try {
        // We reuse the existing ah_parent_meetings table to keep it synchronized across heads
        const [rows] = await db.query(`
            SELECT p.*, s.name as student_name, u.name as academic_head_name
            FROM ah_parent_meetings p
            JOIN students s ON p.student_id = s.id
            JOIN users u ON p.academic_head_id = u.id
            ORDER BY p.meeting_date DESC, p.meeting_time DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching parent meetings:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getExamScores = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.*, s.name as student_name 
            FROM student_exams e
            JOIN students s ON e.student_id = s.id
            ORDER BY e.created_at DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching exam scores:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getStudentGrowth = async (req, res) => {
    try {
        // Fetch students with active status and their assigned mentors/faculties
        const [rows] = await db.query(`
            SELECT s.id, s.name, s.batch, m.name as mentor_name, f.name as faculty_name,
                   (SELECT AVG(score) FROM student_exams WHERE student_id = s.id) as avg_score
            FROM students s
            LEFT JOIN users m ON s.mentor_id = m.id
            LEFT JOIN users f ON s.faculty_id = f.id
            WHERE s.status = 'active'
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching student growth:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getFacultyReplacements = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, f.name as faculty_name 
            FROM ah_faculty_replacements r
            JOIN users f ON r.faculty_id = f.id
            ORDER BY r.date DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching replacements:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const addFacultyReplacement = async (req, res) => {
    try {
        const { faculty_id, reason } = req.body;
        const ah_id = req.user.id;
        
        await db.query(`
            INSERT INTO ah_faculty_replacements (faculty_id, academic_head_id, reason)
            VALUES (?, ?, ?)
        `, [faculty_id, ah_id, reason]);
        
        res.status(201).json({ success: true, message: "Replacement request added" });
    } catch (error) {
        console.error("Error adding replacement:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getEscalations = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.*, s.name as student_name 
            FROM ah_escalations e
            LEFT JOIN students s ON e.student_id = s.id
            ORDER BY e.created_at DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching escalations:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const addEscalation = async (req, res) => {
    try {
        const { student_id, issue_type, description, priority } = req.body;
        const ah_id = req.user.id;
        
        await db.query(`
            INSERT INTO ah_escalations (student_id, academic_head_id, issue_type, description, priority)
            VALUES (?, ?, ?, ?, ?)
        `, [student_id || null, ah_id, issue_type, description, priority || 'medium']);
        
        res.status(201).json({ success: true, message: "Escalation created" });
    } catch (error) {
        console.error("Error adding escalation:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getAllStudents = async (req, res) => {
    try {
        let query = `
            SELECT id, name, course, subject, grade, mentor_id, mentor_name, faculty_id, faculty_name, course_completed
            FROM students
            WHERE mentor_id IS NOT NULL
        `;
        const queryParams = [];

        if (req.query.mentor_id) {
            query += ` AND mentor_id = ?`;
            queryParams.push(req.query.mentor_id);
        }

        query += ` ORDER BY name ASC`;

        const [students] = await db.query(query, queryParams);
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        console.error("Error fetching all students:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getCourseCompletions = async (req, res) => {
    try {
        const [students] = await db.query(`
            SELECT 
                s.id, s.name, s.course, s.subject, s.course_completed,
                s.completion_remarks, s.completion_file, s.course_completed_date,
                s.mentor_name, s.faculty_name
            FROM students s
            ORDER BY s.id DESC
        `);
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        console.error("Error fetching course completions:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const markCourseCompleted = async (req, res) => {
    try {
        const studentId = req.params.id;
        const { remarks } = req.body;
        const file = req.file;

        let completionFileUrl = null;
        if (file) {
            completionFileUrl = `/uploads/completions/${file.filename}`;
        }

        await db.query(`
            UPDATE students 
            SET course_completed = 1,
                completion_remarks = ?,
                completion_file = ?,
                course_completed_date = CURDATE()
            WHERE id = ?
        `, [remarks || '', completionFileUrl, studentId]);

        res.status(200).json({ success: true, message: "Course marked as completed" });
    } catch (error) {
        console.error("Error marking course complete:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const editDailyUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, start_time, end_time, subject, topic, homework_given, remarks } = req.body;
        
        await db.query(`
            UPDATE timetable_reports 
            SET date=?, start_time=?, end_time=?, subject=?, topic=?, homework_given=?, remarks=?
            WHERE id=?
        `, [date, start_time, end_time, subject, topic, homework_given, remarks, id]);
        
        res.status(200).json({ success: true, message: 'Report updated successfully' });
    } catch (error) {
        console.error("Error updating report:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateStudentHours = async (req, res) => {
    try {
        const { id } = req.params;
        const { total_hours, total_lifetime_consumed_hours } = req.body;

        let updateQueries = [];
        let queryParams = [];

        if (total_hours !== undefined) {
            updateQueries.push('total_hours = ?');
            queryParams.push(total_hours);
        }

        if (total_lifetime_consumed_hours !== undefined) {
            updateQueries.push('total_lifetime_consumed_hours = ?');
            queryParams.push(total_lifetime_consumed_hours);
        }

        if (updateQueries.length > 0) {
            queryParams.push(id);
            await db.query(`UPDATE students SET ${updateQueries.join(', ')} WHERE id = ?`, queryParams);
        }

        res.status(200).json({ success: true, message: 'Student hours updated successfully' });
    } catch (error) {
        console.error("Error updating student hours:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDailyStudentRotation,
    updateStudentRotation,
    updateStudentHours,
    getFacultyQualityChecks,
    addFacultyQualityCheck,
    getParentMeetings,
    getExamScores,
    getStudentGrowth,
    getFacultyReplacements,
    addFacultyReplacement,
    getEscalations,
    addEscalation,
    getAllStudents,
    getCourseCompletions,
    markCourseCompleted,
    editDailyUpdate
};
