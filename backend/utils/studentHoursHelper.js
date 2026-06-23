const calculateStudentHours = async (students, db) => {
    if (!students || students.length === 0) return students;

    const studentIds = students.map(s => s.id);
    
    // Check if student_subjects table exists to avoid crash if migration not run
    let baseSubjects = [];
    try {
        const [rows] = await db.query('SELECT * FROM student_subjects WHERE student_id IN (?)', [studentIds]);
        baseSubjects = rows;
    } catch (e) {
        // Table doesn't exist yet, ignore
    }

    // Try to get subject from timetable
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
        // Fallback if subject column doesn't exist yet
        const [rows] = await db.query(`
            SELECT t.student_id, t.duration, fs.minutes_taken 
            FROM timetable t
            LEFT JOIN faculty_sessions fs ON t.id = fs.timetable_id
            WHERE t.status = "Completed" AND t.student_id IN (?)
        `, [studentIds]);
        sessions = rows.map(r => ({ ...r, subject: 'Unknown' }));
    }

    const [standaloneSessions] = await db.query(`
        SELECT sa.student_id, fs.minutes_taken, fs.duration, fs.topic AS subject
        FROM faculty_sessions fs
        JOIN session_attendance sa ON fs.id = sa.session_id
        WHERE fs.status = "Completed" AND fs.timetable_id IS NULL AND sa.student_id IN (?)
    `, [studentIds]);

    const consumedMap = {};
    studentIds.forEach(id => {
        consumedMap[id] = { totalMins: 0, subjects: {} };
    });

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

    // Populate historical base
    baseSubjects.forEach(bs => {
        if (!consumedMap[bs.student_id].subjects[bs.subject_name]) {
            consumedMap[bs.student_id].subjects[bs.subject_name] = {
                allocated: parseFloat(bs.allocated_hours) || 0,
                consumedMins: (parseFloat(bs.historical_consumed_hours) || 0) * 60
            };
        }
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
        
        if (consumedMap[session.student_id]) {
            consumedMap[session.student_id].totalMins += mins;
            
            const subj = session.subject || 'Unknown';
            if (!consumedMap[session.student_id].subjects[subj]) {
                consumedMap[session.student_id].subjects[subj] = { allocated: 0, consumedMins: 0 };
            }
            consumedMap[session.student_id].subjects[subj].consumedMins += mins;
        }
    };

    sessions.forEach(processSession);
    standaloneSessions.forEach(processSession);

    // Augment students array
    return students.map(s => {
        const total_fees = parseFloat(s.total_fees) || 0;
        const total_hours = parseInt(s.total_hours) || 0;
        const total_paid = parseFloat(s.total_paid) || 0;
        
        const current_installment_start_hours = parseFloat(s.current_installment_start_hours) || 0;
        
        let total_entitled_hours = 0;
        if (total_fees > 0) {
            // Whatever percentage of total fees they paid, they are entitled to that percentage of total hours overall
            total_entitled_hours = (total_paid / total_fees) * total_hours;
        } else if (total_fees === 0 && total_paid > 0) {
            total_entitled_hours = total_hours;
        }

        const studentData = consumedMap[s.id] || { totalMins: 0, subjects: {} };
        
        // 1. Determine Subjects
        // We prioritize whatever is currently saved in the database for tracking (`studentData.subjects`).
        // If they have NO tracked subjects yet, we fallback to their registered `subjects_json`
        let actualSubjects = [];
        const trackedSubjects = Object.keys(studentData.subjects);

        if (trackedSubjects.length > 0) {
            actualSubjects = trackedSubjects; // The user has explicitly saved subjects, use them!
        } else {
            // Fallback to registration details if nothing is tracked yet
            let registeredSubjects = [];
            try {
                if (s.subjects_json) {
                    registeredSubjects = typeof s.subjects_json === 'string' ? JSON.parse(s.subjects_json) : s.subjects_json;
                }
            } catch(e) {}

            if (registeredSubjects.length > 0) {
                actualSubjects = registeredSubjects.map(sub => {
                    if (typeof sub === 'string') return sub;
                    if (sub.subject && typeof sub.subject === 'string') return sub.subject;
                    if (sub.subject && Array.isArray(sub.subject)) return sub.subject.join(', ');
                    return null;
                }).filter(Boolean);
            } else if (s.subject) {
                actualSubjects = s.subject.split(',').map(sub => sub.trim()).filter(Boolean);
            }
        }
        
        // Remove duplicates and normalize
        actualSubjects = [...new Set(actualSubjects)];

        // 2. Build subject_hours array
        const subject_hours = [];
        actualSubjects.forEach(subjName => {
            // Find if there is any consumed/allocated data for this exact subject
            let matchedKey = Object.keys(studentData.subjects).find(k => k.toLowerCase() === subjName.toLowerCase());
            let data = matchedKey ? studentData.subjects[matchedKey] : { consumedMins: 0, allocated: 0 };
            
            const subjConsumedHours = data.consumedMins / 60;
            
            let facNames = '';
            const mapping = facultyMappings.find(fm => fm.student_id === s.id && (fm.subject === subjName || (fm.subject || '').toLowerCase() === (subjName || '').toLowerCase()));
            if (mapping) {
                facNames = mapping.faculty_names;
            }
            
            subject_hours.push({
                subject: subjName,
                consumed_hours: parseFloat(subjConsumedHours.toFixed(2)),
                allocated_hours: data.allocated,
                faculties: facNames
            });
        });

        // Wait, the `data.consumedMins` above is `historical + dynamically tracked`.
        // So the TRUE total lifetime consumed minutes is `studentData.totalMins` (dynamically tracked) + SUM(historical consumed mins).
        let total_historical_mins = 0;
        baseSubjects.filter(bs => bs.student_id === s.id).forEach(bs => {
            total_historical_mins += (parseFloat(bs.historical_consumed_hours) || 0) * 60;
        });

        const total_lifetime_consumed_mins = studentData.totalMins + total_historical_mins;
        const total_lifetime_consumed_hours = total_lifetime_consumed_mins / 60;
        
        // Cycle Limit is the total entitled hours minus whatever they had already consumed before this last payment.
        // This gives us the size of the "bucket" of hours they have for this cycle (including any carried over hours).
        let cycle_limit_hours = total_entitled_hours - current_installment_start_hours;
        if (cycle_limit_hours < 0) cycle_limit_hours = 0;

        // Consumed hours within THIS cycle
        let cycle_consumed_hours = total_lifetime_consumed_hours - current_installment_start_hours;
        if (cycle_consumed_hours < 0) cycle_consumed_hours = 0;
        
        let payment_alert_level = 'None';
        let payment_threshold_percentage = 0;

        if (total_fees === 0) {
            // User requested: "fees onnum illa... fees base ahnu vendathu" -> If no fees, no blinking.
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
            // Consumed hours but 0 limit in current cycle AND total_fees > 0
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
            subject_hours: subject_hours
        };
    });
};

module.exports = { calculateStudentHours };
