const fs = require('fs');
const path = require('path');

const sscControllerPath = path.join(__dirname, 'controllers', 'sscController.js');
const sscRoutesPath = path.join(__dirname, 'routes', 'sscRoutes.js');
const timetablePath = path.join(__dirname, '../frontend/src/pages/SSC/Timetable.jsx');

const sscControllerCode = `
// SSC Timetable Controller Functions

const convertTo24Hour = (timeStr) => {
    if (!timeStr) return null;
    const [time, modifier] = timeStr.split(' ');
    if (!modifier) return timeStr;
    let [hours, minutes] = time.split(':');
    if (hours === '12') { hours = '00'; }
    if (modifier.toLowerCase() === 'pm') { hours = parseInt(hours, 10) + 12; }
    return \`\${hours}:\${minutes}:00\`;
};

exports.getFacultiesAll = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, name FROM users WHERE role = 'faculty' ORDER BY name ASC");
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMentorsAll = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, name FROM users WHERE role = 'mentor' ORDER BY name ASC");
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTimetable = async (req, res) => {
    try {
        const { date, student_id, status } = req.query;
        let query = \`
            SELECT t.*, s.name as student_name, s.course, m.name as mentor_name 
            FROM timetable t
            JOIN students s ON t.student_id = s.id
            LEFT JOIN users m ON t.mentor_id = m.id
            WHERE 1=1
        \`;
        const params = [];

        if (date) { query += ' AND t.date = ?'; params.push(date); }
        if (student_id) { query += ' AND t.student_id = ?'; params.push(student_id); }
        if (status) { query += ' AND t.status = ?'; params.push(status); }

        query += ' ORDER BY t.date DESC, t.start_time ASC';

        const [rows] = await db.query(query, params);

        const [stats] = await db.query(\`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) as upcoming,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
            FROM timetable
        \`);

        res.status(200).json({ success: true, data: rows, summary: stats[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createSession = async (req, res) => {
    try {
        const { student_id, date, start_time, end_time, chapter, session_type, status, notes, faculty_id, faculty_name } = req.body;
        
        const [student] = await db.query('SELECT mentor_id FROM students WHERE id = ?', [student_id]);
        const mentor_id = student[0]?.mentor_id || null;

        const [maxSessionResult] = await db.query('SELECT MAX(session_number) as max_sn FROM timetable WHERE student_id = ?', [student_id]);
        const nextSessionNumber = (maxSessionResult[0].max_sn || 0) + 1;

        const formattedStartTime = convertTo24Hour(start_time);
        const formattedEndTime = convertTo24Hour(end_time);

        const start = new Date(\`1970-01-01T\${formattedStartTime}\`);
        const end = new Date(\`1970-01-01T\${formattedEndTime}\`);
        const diffMs = end - start;
        const diffMins = Math.round(diffMs / 60000);
        const duration = \`\${Math.floor(diffMins / 60)}h \${diffMins % 60}m\`;

        const [result] = await db.query(\`
            INSERT INTO timetable (mentor_id, student_id, session_number, date, start_time, end_time, duration, chapter, session_type, status, notes, faculty_id, faculty_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        \`, [mentor_id, student_id, nextSessionNumber, date, formattedStartTime, formattedEndTime, duration, chapter, session_type, status, notes, faculty_id || null, faculty_name]);

        // Optional: Sync to faculty_sessions logic could be duplicated here, but for SSC simple schedule we just insert

        res.status(201).json({ success: true, message: "Session created", data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSession = async (req, res) => {
    try {
        const sessionId = req.params.id;
        const { date, start_time, end_time, chapter, session_type, status, notes, faculty_id, faculty_name } = req.body;

        const formattedStartTime = convertTo24Hour(start_time);
        const formattedEndTime = convertTo24Hour(end_time);

        const start = new Date(\`1970-01-01T\${formattedStartTime}\`);
        const end = new Date(\`1970-01-01T\${formattedEndTime}\`);
        const diffMs = end - start;
        const diffMins = Math.round(diffMs / 60000);
        const duration = \`\${Math.floor(diffMins / 60)}h \${diffMins % 60}m\`;

        await db.query(\`
            UPDATE timetable 
            SET date = ?, start_time = ?, end_time = ?, duration = ?, chapter = ?, session_type = ?, status = ?, notes = ?, faculty_id = ?, faculty_name = ?
            WHERE id = ?
        \`, [date, formattedStartTime, formattedEndTime, duration, chapter, session_type, status, notes, faculty_id || null, faculty_name, sessionId]);

        res.status(200).json({ success: true, message: "Session updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const sessionId = req.params.id;
        await db.query('DELETE FROM timetable WHERE id = ?', [sessionId]);
        res.status(200).json({ success: true, message: "Session deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStudentAcademicSchedule = async (req, res) => {
    try {
        const studentId = req.params.id;
        const [schedules] = await db.query(\`
            SELECT fs.*, u.name as faculty_name 
            FROM faculty_schedules fs
            LEFT JOIN users u ON fs.faculty_id = u.id
            WHERE fs.student_id = ?
            ORDER BY FIELD(fs.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), fs.start_time ASC
        \`, [studentId]);
        
        if (schedules && schedules.length > 0) {
            return res.status(200).json({ success: true, data: schedules });
        }

        const [[student]] = await db.query('SELECT subjects_json, faculty_id, faculty_name FROM students WHERE id = ?', [studentId]);
        if (student && student.subjects_json) {
            let parsed = [];
            try {
                parsed = typeof student.subjects_json === 'string' ? JSON.parse(student.subjects_json) : student.subjects_json;
            } catch (e) {}

            let generatedSchedules = [];
            if (Array.isArray(parsed)) {
                parsed.forEach(p => {
                    let subjectStr = Array.isArray(p.subject) ? p.subject.join(', ') : p.subject;
                    let pFacultyId = p.faculty_id || student.faculty_id || null;
                    let pFacultyName = p.faculty_name || student.faculty_name || null;
                    
                    if (p.dayConfigs && Array.isArray(p.dayConfigs)) {
                        p.dayConfigs.forEach(dc => {
                            generatedSchedules.push({
                                day_of_week: dc.day,
                                start_time: convertTo24Hour(dc.startTime) || '10:00:00',
                                end_time: convertTo24Hour(dc.endTime) || '11:00:00',
                                subject: subjectStr,
                                faculty_id: pFacultyId,
                                faculty_name: pFacultyName
                            });
                        });
                    }
                });
            }
            if (generatedSchedules.length > 0) {
                return res.status(200).json({ success: true, data: generatedSchedules });
            }
        }
        res.status(200).json({ success: true, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateStudentAcademicSchedule = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const studentId = req.params.id;
        const { schedules } = req.body;

        await connection.query('DELETE FROM faculty_schedules WHERE student_id = ?', [studentId]);

        if (schedules && Array.isArray(schedules) && schedules.length > 0) {
            for (const s of schedules) {
                const facId = s.faculty_id ? parseInt(s.faculty_id) : null;
                await connection.query(\`
                    INSERT INTO faculty_schedules (student_id, day_of_week, start_time, end_time, subject, faculty_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                \`, [studentId, s.day_of_week, s.start_time, s.end_time, s.subject, facId]);
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: "Academic schedule updated successfully" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

exports.createBatchTimetable = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { student_id, sessions } = req.body;

        if (!sessions || sessions.length === 0) {
            return res.status(400).json({ success: false, message: "No sessions provided" });
        }

        const [[studentObj]] = await connection.query('SELECT mentor_id FROM students WHERE id = ?', [student_id]);
        const actualMentorId = studentObj?.mentor_id || null;

        const [maxSessionResult] = await connection.query('SELECT MAX(session_number) as max_sn FROM timetable WHERE student_id = ?', [student_id]);
        let currentSessionNum = (maxSessionResult[0].max_sn || 0) + 1;

        for (const session of sessions) {
            const { date, start_time, end_time, chapter, session_type, notes, faculty_id, faculty_name } = session;

            const formattedStartTime = convertTo24Hour(start_time);
            const formattedEndTime = convertTo24Hour(end_time);

            const start = new Date(\`1970-01-01T\${formattedStartTime}\`);
            const end = new Date(\`1970-01-01T\${formattedEndTime}\`);
            const diffMs = end - start;
            const diffMins = Math.round(diffMs / 60000);
            const duration = \`\${Math.floor(diffMins / 60)}h \${diffMins % 60}m\`;

            await connection.query(\`
                INSERT INTO timetable (mentor_id, student_id, session_number, date, start_time, end_time, duration, chapter, session_type, status, notes, faculty_id, faculty_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?, ?, ?)
            \`, [actualMentorId, student_id, currentSessionNum++, date, formattedStartTime, formattedEndTime, duration, chapter, session_type || 'Regular Class', notes || '', faculty_id ? parseInt(faculty_id) : null, faculty_name || null]);
        }

        await connection.commit();
        res.status(201).json({ success: true, message: "Batch timetable created" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};
`;

const sscRoutesCode = `
// SSC Timetable Routes
const { 
    getFacultiesAll, getMentorsAll, getTimetable, createSession, updateSession, deleteSession, 
    getStudentAcademicSchedule, updateStudentAcademicSchedule, createBatchTimetable 
} = require('../controllers/sscController');

router.get('/faculties-all', getFacultiesAll);
router.get('/mentors-all', getMentorsAll);
router.get('/timetable', getTimetable);
router.post('/timetable', createSession);
router.put('/timetable/:id', updateSession);
router.delete('/timetable/:id', deleteSession);
router.get('/students/:id/schedule', getStudentAcademicSchedule);
router.post('/students/:id/schedule', updateStudentAcademicSchedule);
router.post('/timetable/batch', createBatchTimetable);
`;

// Append to sscController.js
const currentControllerCode = fs.readFileSync(sscControllerPath, 'utf8');
if (!currentControllerCode.includes('getFacultiesAll')) {
    fs.writeFileSync(sscControllerPath, currentControllerCode + '\n' + sscControllerCode);
}

// Modify sscRoutes.js
let currentRoutesCode = fs.readFileSync(sscRoutesPath, 'utf8');
if (!currentRoutesCode.includes('/faculties-all')) {
    const lines = currentRoutesCode.split('\n');
    const exportsLineIndex = lines.findIndex(l => l.includes('module.exports = router;'));
    if (exportsLineIndex !== -1) {
        lines.splice(exportsLineIndex, 0, sscRoutesCode);
        fs.writeFileSync(sscRoutesPath, lines.join('\n'));
    }
}

// Modify Timetable.jsx
let frontendCode = fs.readFileSync(timetablePath, 'utf8');
frontendCode = frontendCode.replace(/\/mentor\/faculties-all/g, '/ssc/faculties-all');
frontendCode = frontendCode.replace(/\/mentor\/mentors-all/g, '/ssc/mentors-all');
frontendCode = frontendCode.replace(/\/mentor\/timetable/g, '/ssc/timetable');
frontendCode = frontendCode.replace(/\/academic-head\/students-all/g, '/ssc/students');
frontendCode = frontendCode.replace(/\/mentor\/students/g, '/ssc/students'); // This will catch the schedule ones too because they use backticks: /mentor/students/\${id}/schedule

fs.writeFileSync(timetablePath, frontendCode);
console.log("Migration script complete");
