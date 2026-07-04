const calculateStudentHours = async (students, db) => {
    if (!students || !Array.isArray(students) || students.length === 0) return students;

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
            SELECT t.student_id, t.duration, COALESCE(t.subject, t.chapter) AS subject, fs.minutes_taken 
            FROM timetable t
            LEFT JOIN faculty_sessions fs ON t.id = fs.timetable_id
            WHERE t.status IN ('Completed', 'Others', 'Faculty Cancelled', 'Student Cancelled') AND t.student_id IN (?)
        `, [studentIds]);
        sessions = rows;
    } catch (e) {
        // Fallback if subject column doesn't exist yet
        try {
            const [rows] = await db.query(`
                SELECT t.student_id, t.duration, fs.minutes_taken 
                FROM timetable t
                LEFT JOIN faculty_sessions fs ON t.id = fs.timetable_id
                WHERE t.status IN ('Completed', 'Others', 'Faculty Cancelled', 'Student Cancelled') AND t.student_id IN (?)
            `, [studentIds]);
            sessions = rows.map(r => ({ ...r, subject: 'Unknown' }));
        } catch(fallbackErr) {
            console.error("studentHoursHelper fallback error:", fallbackErr);
        }
    }

    let standaloneSessions = [];
    try {
        const [rows] = await db.query(`
            SELECT 
                sa.student_id, 
                fs.minutes_taken, 
                fs.duration, 
                COALESCE(
                    (SELECT fsch.subject FROM faculty_schedules fsch WHERE fsch.student_id = sa.student_id AND fsch.faculty_id = fs.faculty_id LIMIT 1),
                    fs.topic
                ) AS subject
            FROM faculty_sessions fs
            JOIN session_attendance sa ON fs.id = sa.session_id
            WHERE fs.status IN ('Completed', 'Others', 'Faculty Cancelled', 'Student Cancelled') AND fs.timetable_id IS NULL AND sa.student_id IN (?)
        `, [studentIds]);
        standaloneSessions = rows;
    } catch (e) {
        console.error("studentHoursHelper standaloneSessions error:", e);
    }

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

    // Pre-calculate allowed subjects for mapping (MUST be before processing any subjects)
    const allowedSubjectsMap = {};
    students.forEach(s => {
        let allowed = new Set();
        
        // 1. From student details (subjects_json)
        try {
            let reg = [];
            if (s.subjects_json) {
                reg = typeof s.subjects_json === 'string' ? JSON.parse(s.subjects_json) : s.subjects_json;
            }
            reg.forEach(rs => {
                let subjName = rs.subject || 'Unknown';
                if (Array.isArray(subjName)) subjName.forEach(sub => allowed.add(sub.trim().toUpperCase()));
                else allowed.add(subjName.trim().toUpperCase());
            });
        } catch(e) {}
        
        allowedSubjectsMap[s.id] = allowed;
    });

    // 2. From faculty schedules
    facultyMappings.forEach(fm => {
        if (fm.subject && allowedSubjectsMap[fm.student_id]) {
            allowedSubjectsMap[fm.student_id].add(fm.subject.trim().toUpperCase());
        }
    });

    // Helper to map a raw session subject to an allowed subject
    const normalizeSubj = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const mapSubject = (student_id, rawSubject) => {
        if (!rawSubject) return 'Unknown';
        const allowed = Array.from(allowedSubjectsMap[student_id] || []);
        if (allowed.includes(rawSubject)) return rawSubject;
        
        const normRaw = normalizeSubj(rawSubject);
        
        // Exact normalized match
        let match = allowed.find(a => normalizeSubj(a) === normRaw);
        if (match) return match;
        
        // Common synonym matches
        if (normRaw === 'maths') match = allowed.find(a => normalizeSubj(a) === 'mathematics');
        if (normRaw === 'mathematics') match = allowed.find(a => normalizeSubj(a) === 'maths');
        if (match) return match;
        
        // Partial match
        match = allowed.find(a => {
            const normA = normalizeSubj(a);
            if (normA.includes(normRaw) || normRaw.includes(normA)) {
                // Prevent 'science' from matching 'social science', 'computer science', etc.
                if (normRaw === 'science' && normA.endsWith('science') && normA !== 'science') return false;
                if (normA === 'science' && normRaw.endsWith('science') && normRaw !== 'science') return false;
                return true;
            }
            return false;
        });
        if (match) return match;
        
        return rawSubject;
    };

    // Populate historical base
    baseSubjects.forEach(bs => {
        // Map the historical subject to an allowed subject if possible
        const subjName = mapSubject(bs.student_id, bs.subject_name).trim().toUpperCase();
        
        // Add it to allowedSubjectsMap so it isn't filtered out (handles manually added subjects)
        if (subjName && subjName !== '__EDITED__' && subjName !== '__GLOBAL_OFFSET__') {
            if (!allowedSubjectsMap[bs.student_id]) {
                allowedSubjectsMap[bs.student_id] = new Set();
            }
            allowedSubjectsMap[bs.student_id].add(subjName);
        }
        
        if (!consumedMap[bs.student_id].subjects[subjName]) {
            consumedMap[bs.student_id].subjects[subjName] = {
                allocated: parseFloat(bs.allocated_hours) || 0,
                consumedMins: (parseFloat(bs.historical_consumed_hours) || 0) * 60
            };
        } else {
            // If it maps to an existing subject, merge the allocated and historical hours
            consumedMap[bs.student_id].subjects[subjName].allocated += parseFloat(bs.allocated_hours) || 0;
            consumedMap[bs.student_id].subjects[subjName].consumedMins += (parseFloat(bs.historical_consumed_hours) || 0) * 60;
        }
    });

    // The old mapSubject was removed from here

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
            
            let subj = mapSubject(session.student_id, session.subject || 'Unknown').trim().toUpperCase();
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
        
        // Ensure registered subjects are included even if no sessions/history exists
        let registeredSubjects = [];
        try {
            if (s.subjects_json) {
                registeredSubjects = typeof s.subjects_json === 'string' ? JSON.parse(s.subjects_json) : s.subjects_json;
            }
        } catch(e) {}
        
        registeredSubjects.forEach(rs => {
            let subjName = rs.subject || 'Unknown';
            if (Array.isArray(subjName)) subjName = subjName.join(', ');
            subjName = subjName.trim().toUpperCase();
            
            if (!studentData.subjects[subjName]) {
                studentData.subjects[subjName] = { allocated: 0, consumedMins: 0 };
            }
        });
        
        // Sum historical baseline to totalMins
        let historicalTotalMins = 0;
        const subject_hours = [];
        for (const [subjName, data] of Object.entries(studentData.subjects)) {
            // ONLY include if it is in the allowed subjects list
            const allowed = allowedSubjectsMap[s.id] || new Set();
            if (!allowed.has(subjName)) {
                continue; // Skip this subject as it's not a valid subject from student details/faculty
            }

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
            // We only add the historical base because dynamically tracked session mins are already in studentData.totalMins
            // Wait, studentData.totalMins only has dynamically tracked sessions.
            // historicalTotalMins should sum ONLY the historical base!
        }

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
