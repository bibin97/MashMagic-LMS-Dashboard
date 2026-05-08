const db = require('../config/db');

const getDailyAssignments = async (req, res) => {
    try {
        const mentor_id = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        // Check if assignments already exist for today
        const [existing] = await db.query(
            'SELECT assignments FROM daily_assignments WHERE mentor_id = ? AND date = ?',
            [mentor_id, today]
        );

        if (existing.length > 0) {
            return res.status(200).json({ success: true, data: existing[0].assignments });
        }

        // Generate new assignments
        const assignments = await generateAssignments(mentor_id);
        
        // Save to DB
        await db.query(
            'INSERT INTO daily_assignments (mentor_id, date, assignments) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE assignments = ?',
            [mentor_id, today, JSON.stringify(assignments), JSON.stringify(assignments)]
        );

        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        console.error('Get Daily Assignments Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const generateAssignments = async (mentor_id) => {
    // 1. Fetch all students under this mentor who are Mentorship or Both
    const [students] = await db.query(
        `SELECT id, name, priority_category, enrollment_type 
         FROM students 
         WHERE mentor_id = ? 
         AND (LOWER(enrollment_type) = 'mentorship' OR LOWER(enrollment_type) = 'both')
         AND onboarding_status = 'completed'
         ORDER BY id ASC`,
        [mentor_id]
    );

    if (students.length === 0) return [];

    // 2. Rotation logic
    // We use day count from a reference date
    const refDate = new Date('2024-01-01');
    const today = new Date();
    const diffTime = Math.abs(today - refDate);
    const dayNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const shiftValue = 5;
    const startIndex = (dayNumber * shiftValue) % students.length;

    // Create a circular array based on rotation
    const rotatedStudents = [];
    for (let i = 0; i < students.length; i++) {
        rotatedStudents.push(students[(startIndex + i) % students.length]);
    }

    // 3. Priority Override
    const highPriority = rotatedStudents.filter(s => s.priority_category === 'High');
    const others = rotatedStudents.filter(s => s.priority_category !== 'High');

    const deep = [];
    const medium = [];
    const quick = [];

    // Fill Deep (max 5)
    // Priority 1: High priority students
    for (let i = 0; i < highPriority.length && deep.length < 5; i++) {
        deep.push({ ...highPriority[i], sessionType: 'DEEP', status: 'PENDING' });
    }
    // Priority 2: Fill remaining with rotation
    for (let i = 0; i < others.length && deep.length < 5; i++) {
        const student = others.shift();
        deep.push({ ...student, sessionType: 'DEEP', status: 'PENDING' });
    }

    // Fill Medium (max 5)
    while (medium.length < 5 && others.length > 0) {
        const student = others.shift();
        medium.push({ ...student, sessionType: 'MEDIUM', status: 'PENDING' });
    }

    // Fill Quick (max 5)
    while (quick.length < 5 && others.length > 0) {
        const student = others.shift();
        quick.push({ ...student, sessionType: 'QUICK', status: 'PENDING' });
    }

    return [...deep, ...medium, ...quick];
};

const submitSessionReport = async (req, res) => {
    try {
        const mentor_id = req.user.id;
        const { student_id, session_type, report_data } = req.body;

        if (!student_id || !session_type || !report_data) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // 1. Save Report
        await db.query(
            'INSERT INTO mentor_session_reports (student_id, mentor_id, session_type, report_data) VALUES (?, ?, ?, ?)',
            [student_id, mentor_id, session_type, JSON.stringify(report_data)]
        );

        // 2. Update Daily Assignment Status
        const today = new Date().toISOString().split('T')[0];
        const [existing] = await db.query(
            'SELECT id, assignments FROM daily_assignments WHERE mentor_id = ? AND date = ?',
            [mentor_id, today]
        );

        if (existing.length > 0) {
            let assignments = existing[0].assignments;
            if (typeof assignments === 'string') assignments = JSON.parse(assignments);
            
            const updatedAssignments = assignments.map(a => 
                a.id === student_id ? { ...a, status: 'COMPLETED' } : a
            );

            await db.query(
                'UPDATE daily_assignments SET assignments = ? WHERE id = ?',
                [JSON.stringify(updatedAssignments), existing[0].id]
            );
        }

        // 3. Auto Intelligence Engine (Update Student Priority)
        let newPriority = 'Stable';
        
        if (session_type === 'DEEP') {
            if (report_data.student_response === 'Not responsive' || report_data.priority_tag === 'High') {
                newPriority = 'High';
            } else if (report_data.priority_tag === 'Medium') {
                newPriority = 'Medium';
            }
        } else if (session_type === 'MEDIUM') {
            if (report_data.progress === 'Poor' || report_data.upgrade_to_deep === 'Yes') {
                newPriority = 'High';
            } else if (report_data.progress === 'Average') {
                newPriority = 'Medium';
            }
        } else if (session_type === 'QUICK') {
            if (report_data.study_status === 'Not studied' || report_data.immediate_concern === 'Yes') {
                newPriority = 'High';
            }
        }

        await db.query(
            'UPDATE students SET priority_category = ?, last_session_type = ?, last_session_date = ? WHERE id = ?',
            [newPriority, session_type, today, student_id]
        );

        // Notify Admin of new session report
        try {
            const [[student]] = await db.query('SELECT name FROM students WHERE id = ?', [student_id]);
            await db.query('INSERT INTO admin_notifications (message, related_id, action_type) VALUES (?, ?, ?)', [
                `<b>Interaction Hub:</b> Mentor <b>${req.user.name}</b> completed a <b>${session_type}</b> session with <b>${student?.name || student_id}</b>.`,
                student_id,
                'mentor_session_report'
            ]);
        } catch (nErr) {
            console.error("Notification Error:", nErr.message);
        }

        res.status(200).json({ success: true, message: 'Report submitted and student state updated' });
    } catch (error) {
        console.error('Submit Session Report Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getDailyAssignments,
    submitSessionReport
};
