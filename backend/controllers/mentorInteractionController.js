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
        `SELECT id, name, priority_category, enrollment_type, badge 
         FROM students 
         WHERE mentor_id = ? 
         AND (LOWER(enrollment_type) = 'mentorship' OR LOWER(enrollment_type) = 'both')
         AND status != 'inactive'
         ORDER BY id ASC`,
        [mentor_id]
    );

    if (students.length === 0) return [];

    // 2. Rotation logic
    // We use day count from a reference date
    const refDate = new Date('2024-01-01');
    const today = new Date();
    const diffTime = Math.abs(today - refDate);
    const dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Use floor for stability
    
    // User requested 15 students per day out of total 25+. 
    // Shift by 15 every day to ensure everyone is covered in rotation.
    const shiftValue = 15;
    const startIndex = (dayNumber * shiftValue) % students.length;

    // Create a circular array based on rotation
    const rotatedStudents = [];
    for (let i = 0; i < students.length; i++) {
        rotatedStudents.push(students[(startIndex + i) % students.length]);
    }

    // 3. Priority Split
    const highPriority = rotatedStudents.filter(s => s.priority_category === 'High');
    const mediumPriority = rotatedStudents.filter(s => s.priority_category === 'Medium');
    const others = rotatedStudents.filter(s => !['High', 'Medium'].includes(s.priority_category));

    const deep = [];
    const medium = [];
    const quick = [];

    // Fill Deep (max 5)
    // Priority 1: High priority students
    for (let i = 0; i < highPriority.length && deep.length < 5; i++) {
        deep.push({ ...highPriority[i], sessionType: 'DEEP', status: 'PENDING' });
    }
    // Priority 2: Fill remaining with rotation pool
    while (deep.length < 5 && others.length > 0) {
        const student = others.shift();
        deep.push({ ...student, sessionType: 'DEEP', status: 'PENDING' });
    }

    // Fill Medium (max 5)
    // Priority 1: Medium priority students
    while (medium.length < 5 && mediumPriority.length > 0) {
        medium.push({ ...mediumPriority.shift(), sessionType: 'MEDIUM', status: 'PENDING' });
    }
    // Priority 2: Fill remaining with others
    while (medium.length < 5 && others.length > 0) {
        medium.push({ ...others.shift(), sessionType: 'MEDIUM', status: 'PENDING' });
    }

    // Fill Quick (max 5)
    while (quick.length < 5 && others.length > 0) {
        const student = others.shift();
        quick.push({ ...student, sessionType: 'QUICK', status: 'PENDING' });
    }

    // 4. Backfill Quota: If we still don't have 15 students but have more in pools
    // Fill Quick with remaining medium priority if any
    while (quick.length < 5 && mediumPriority.length > 0) {
        quick.push({ ...mediumPriority.shift(), sessionType: 'QUICK', status: 'PENDING' });
    }

    // Final merge
    return [...deep, ...medium, ...quick];
};

const submitSessionReport = async (req, res) => {
    try {
        const mentor_id = req.user.id;
        const { student_id, session_type, next_session_type, report_data } = req.body;

        if (!student_id || !session_type || !report_data) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // 4. Fraud Check (Module 7)
        let isFlagged = 0;
        let flagReason = null;

        const [history] = await db.query(
            'SELECT report_data FROM mentor_session_reports WHERE student_id = ? ORDER BY created_at DESC LIMIT 1',
            [student_id]
        );

        if (history.length > 0) {
            const lastReport = JSON.parse(history[0].report_data);
            const currentPlan = report_data.action_plan || '';
            const lastPlan = lastReport.action_plan || '';

            if (currentPlan && currentPlan === lastPlan && currentPlan.length > 10) {
                isFlagged = 1;
                flagReason = 'Duplicate Action Plan detected';
            }
        }

        // 5. Save Report (with optional flagging if columns exist)
        try {
            await db.query(
                'INSERT INTO mentor_session_reports (student_id, mentor_id, session_type, report_data, is_flagged, flag_reason) VALUES (?, ?, ?, ?, ?, ?)',
                [student_id, mentor_id, session_type, JSON.stringify(report_data), isFlagged, flagReason]
            );
        } catch (dbErr) {
            // Fallback if columns don't exist yet
            await db.query(
                'INSERT INTO mentor_session_reports (student_id, mentor_id, session_type, report_data) VALUES (?, ?, ?, ?)',
                [student_id, mentor_id, session_type, JSON.stringify(report_data)]
            );
        }

        // 6. Update Daily Assignment Status
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

        // 7. Priority Logic (Manual Priority from Mentor)
        // Set priority based on mentor's selection for the next interaction type
        const [[currentStudent]] = await db.query('SELECT priority_category FROM students WHERE id = ?', [student_id]);
        let currentP = currentStudent?.priority_category || 'Stable';
        let finalPriority = currentP;

        if (next_session_type === 'DEEP') finalPriority = 'High';
        else if (next_session_type === 'MEDIUM') finalPriority = 'Medium';
        else if (next_session_type === 'QUICK') finalPriority = 'Stable';

        // Note: Automatic intelligence is bypassed as per mentor's manual override requirement.

        await db.query(
            'UPDATE students SET priority_category = ?, last_session_type = ?, last_session_date = ? WHERE id = ?',
            [finalPriority, session_type, today, student_id]
        );

        // Notify Admin of new session report
        try {
            const [[student]] = await db.query('SELECT name FROM students WHERE id = ?', [student_id]);
            let msg = `<b>Interaction Hub:</b> Mentor <b>${req.user.name}</b> completed a <b>${session_type}</b> session with <b>${student?.name || student_id}</b>.`;
            if (isFlagged) msg += ` <span style="color: red;">⚠️ Possible Fraud Detected!</span>`;

            await db.query('INSERT INTO admin_notifications (message, related_id, action_type) VALUES (?, ?, ?)', [
                msg,
                student_id,
                'mentor_session_report'
            ]);
        } catch (nErr) {
            console.error("Notification Error:", nErr.message);
        }

        res.status(200).json({ success: true, message: 'Report submitted and student state updated', flagged: isFlagged });
    } catch (error) {
        console.error('Submit Session Report Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getHighRiskStudents = async (req, res) => {
    try {
        const [students] = await db.query(
            `SELECT id, name, priority_category, last_session_date, mentor_name 
             FROM students 
             WHERE priority_category = 'High' 
             OR id IN (SELECT student_id FROM mentor_session_reports WHERE is_flagged = 1)
             ORDER BY last_session_date DESC`
        );
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        console.error('Get High Risk Students Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getWeeklyCoverage = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id, s.name, s.priority_category, s.mentor_name,
                COUNT(CASE WHEN r.session_type = 'DEEP' THEN 1 END) as deep_count,
                COUNT(CASE WHEN r.session_type = 'MEDIUM' THEN 1 END) as medium_count,
                COUNT(CASE WHEN r.session_type = 'QUICK' THEN 1 END) as quick_count,
                MAX(r.created_at) as last_interaction
            FROM students s
            LEFT JOIN mentor_session_reports r ON s.id = r.student_id AND r.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            WHERE s.status = 'active'
            GROUP BY s.id
            ORDER BY deep_count ASC, medium_count ASC
        `;

        const [coverage] = await db.query(query);
        res.status(200).json({ success: true, data: coverage });
    } catch (error) {
        console.error('Weekly Coverage Error:', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    getDailyAssignments,
    submitSessionReport,
    getHighRiskStudents,
    getWeeklyCoverage
};
