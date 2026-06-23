const calculateStudentHours = async (students, db) => {
    if (!students || students.length === 0) return students;

    const studentIds = students.map(s => s.id);
    
    // Load explicitly set subject hours (Academic Head's display layer)
    let baseSubjects = [];
    try {
        const [rows] = await db.query('SELECT * FROM student_subjects WHERE student_id IN (?)', [studentIds]);
        baseSubjects = rows;
    } catch (e) {
        // Table doesn't exist yet, ignore
    }

    // Load live session data (for students WITHOUT explicit student_subjects entries)
    let sessions = [];
    try {
        const [rows] = await db.query(`
            SELECT t.student_id, t.duration, t.chapter AS subject, fs.minutes_taken 
            FROM timetable t
            LEFT JOIN faculty_sessions fs ON t.id = fs.timetable_id
            WHERE t.status = "Completed" AND t.student_id IN (?)
        `, [studentIds]);
        sessions = rows;
    } catch (e) {
        try {
            const [rows] = await db.query(`
                SELECT t.student_id, t.duration, fs.minutes_taken 
                FROM timetable t
                LEFT JOIN faculty_sessions fs ON t.id = fs.timetable_id
                WHERE t.status = "Completed" AND t.student_id IN (?)
            `, [studentIds]);
            sessions = rows.map(r => ({ ...r, subject: 'Unknown' }));
        } catch (e2) {}
    }

    const [standaloneSessions] = await db.query(`
        SELECT sa.student_id, fs.minutes_taken, fs.duration, fs.topic AS subject
        FROM faculty_sessions fs
        JOIN session_attendance sa ON fs.id = sa.session_id
        WHERE fs.status = "Completed" AND fs.timetable_id IS NULL AND sa.student_id IN (?)
    `, [studentIds]);

    // Session consumed map (used only for students WITHOUT explicit student_subjects)
    const sessionMap = {};
    studentIds.forEach(id => {
        sessionMap[id] = { totalMins: 0, subjects: {} };
    });

    const processSession = (session) => {
        let mins = 0;
        if (session.minutes_taken !== null && session.minutes_taken !== undefined && session.minutes_taken !== '') {
            mins = parseInt(session.minutes_taken, 10);
        } else {
            const dur = session.duration || '';
            const hMatch = dur.match(/(\d+)h/);
            const mMatch = dur.match(/(\d+)m/);
            if (hMatch) mins += parseInt(hMatch[1]) * 60;
            if (mMatch) mins += parseInt(mMatch[1]);
        }
        if (sessionMap[session.student_id]) {
            sessionMap[session.student_id].totalMins += mins;
            const subj = session.subject || 'Unknown';
            if (!sessionMap[session.student_id].subjects[subj]) {
                sessionMap[session.student_id].subjects[subj] = { consumedMins: 0, allocated: 0 };
            }
            sessionMap[session.student_id].subjects[subj].consumedMins += mins;
        }
    };

    sessions.forEach(processSession);
    standaloneSessions.forEach(processSession);

    // Faculty mappings
    let facultyMappings = [];
    try {
        const [rows] = await db.query(`
            SELECT fs.student_id, fs.subject, GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as faculty_names
            FROM faculty_schedules fs
            JOIN faculties u ON fs.faculty_id = u.id
            WHERE fs.student_id IN (?)
            GROUP BY fs.student_id, fs.subject
        `, [studentIds]);
        facultyMappings = rows;
    } catch(e) {}

    return students.map(s => {
        const total_fees = parseFloat(s.total_fees) || 0;
        const total_hours = parseInt(s.total_hours) || 0;
        const total_paid = parseFloat(s.total_paid) || 0;
        const current_installment_start_hours = parseFloat(s.current_installment_start_hours) || 0;

        let total_entitled_hours = 0;
        if (total_fees > 0) {
            total_entitled_hours = (total_paid / total_fees) * total_hours;
        } else if (total_fees === 0 && total_paid > 0) {
            total_entitled_hours = total_hours;
        }

        // Check if Academic Head has explicitly set subjects for this student
        const explicitSubjects = baseSubjects.filter(bs => bs.student_id === s.id);

        // Only use explicit subjects if at least one has meaningful data (allocated > 0 or consumed > 0)
        // This avoids showing accidental 0/0 DB entries from old buggy saves
        const hasMeaningfulExplicitData = explicitSubjects.some(
            bs => (parseFloat(bs.allocated_hours) || 0) > 0 || (parseFloat(bs.historical_consumed_hours) || 0) > 0
        );

        let subject_hours = [];
        let total_lifetime_consumed_hours = 0;

        if (hasMeaningfulExplicitData) {
            // ── ACADEMIC HEAD MANAGED STUDENT ──
            // Display exactly what Academic Head set in student_subjects table.
            // Real session logs are preserved in DB but NOT used for display.
            subject_hours = explicitSubjects.map(bs => {
                let facNames = '';
                const mapping = facultyMappings.find(fm =>
                    fm.student_id === s.id &&
                    ((fm.subject || '').toLowerCase() === (bs.subject_name || '').toLowerCase())
                );
                if (mapping) facNames = mapping.faculty_names;

                return {
                    subject: bs.subject_name,
                    consumed_hours: parseFloat(parseFloat(bs.historical_consumed_hours || 0).toFixed(2)),
                    allocated_hours: parseFloat(bs.allocated_hours || 0),
                    faculties: facNames
                };
            });

            // Total consumed = sum of what Academic Head explicitly set
            total_lifetime_consumed_hours = explicitSubjects.reduce(
                (sum, bs) => sum + (parseFloat(bs.historical_consumed_hours) || 0), 0
            );
        } else {
            // ── SESSION-TRACKED STUDENT (no Academic Head override) ──
            // Use live session data for display
            const sessionData = sessionMap[s.id] || { totalMins: 0, subjects: {} };
            for (const [subjName, data] of Object.entries(sessionData.subjects)) {
                const subjConsumedHours = data.consumedMins / 60;
                let facNames = '';
                const mapping = facultyMappings.find(fm =>
                    fm.student_id === s.id &&
                    ((fm.subject || '').toLowerCase() === (subjName || '').toLowerCase())
                );
                if (mapping) facNames = mapping.faculty_names;

                subject_hours.push({
                    subject: subjName,
                    consumed_hours: parseFloat(subjConsumedHours.toFixed(2)),
                    allocated_hours: data.allocated,
                    faculties: facNames
                });
            }
            total_lifetime_consumed_hours = sessionData.totalMins / 60;
        }

        let cycle_limit_hours = total_entitled_hours - current_installment_start_hours;
        if (cycle_limit_hours < 0) cycle_limit_hours = 0;

        let cycle_consumed_hours = total_lifetime_consumed_hours - current_installment_start_hours;
        if (cycle_consumed_hours < 0) cycle_consumed_hours = 0;

        let payment_alert_level = 'None';
        let payment_threshold_percentage = 0;

        if (total_fees === 0) {
            payment_alert_level = 'None';
            payment_threshold_percentage = 0;
        } else if (cycle_limit_hours > 0) {
            payment_threshold_percentage = (cycle_consumed_hours / cycle_limit_hours) * 100;
            if (payment_threshold_percentage >= 90) {
                payment_alert_level = 'Critical';
            } else if (payment_threshold_percentage >= 70) {
                payment_alert_level = 'Warning';
            }
        } else if (cycle_consumed_hours > 0) {
            payment_alert_level = 'Critical';
            payment_threshold_percentage = 100;
        }

        return {
            ...s,
            paid_hours: parseFloat(cycle_limit_hours.toFixed(2)),
            consumed_hours: parseFloat(cycle_consumed_hours.toFixed(2)),
            payment_alert_level,
            payment_threshold_percentage: parseFloat(payment_threshold_percentage.toFixed(2)),
            total_lifetime_consumed_hours: parseFloat(total_lifetime_consumed_hours.toFixed(2)),
            subject_hours,
            // Flag for frontend to know whether to apply mock data or use DB data
            has_explicit_subjects: hasMeaningfulExplicitData
        };
    });
};

module.exports = { calculateStudentHours };
