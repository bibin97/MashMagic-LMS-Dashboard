const db = require('../config/db');

const getDailyAssignments = async (req, res) => {
    try {
        const mentor_id = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const [currentStudents] = await db.query(
            `SELECT id, onboarding_status FROM students 
             WHERE mentor_id = ? 
             AND (LOWER(enrollment_type) LIKE '%mentorship%' OR LOWER(enrollment_type) = 'both')
             AND status != 'inactive' AND course_completed = 0 AND mentorship_completed = 0`,
            [mentor_id]
        );

        let [mentorRows] = await db.query('SELECT interaction_paused FROM users WHERE id = ?', [mentor_id]);
        if (mentorRows.length === 0) {
            [mentorRows] = await db.query('SELECT interaction_paused FROM mentors WHERE id = ?', [mentor_id]);
        }
        const mentor = mentorRows[0];
        const isPaused = mentor ? mentor.interaction_paused : false;

        // Check if assignments already exist for today
        const [existing] = await db.query(
            'SELECT assignments FROM daily_assignments WHERE mentor_id = ? AND date = ?',
            [mentor_id, today]
        );

        if (existing.length > 0) {
            let savedAssignments = existing[0].assignments;
            if (typeof savedAssignments === 'string') {
                try {
                    savedAssignments = JSON.parse(savedAssignments);
                } catch (e) {
                    console.error("JSON_PARSE_ERROR in getDailyAssignments:", e);
                    savedAssignments = [];
                }
            }
            
            // Check if any pending onboarding student is missing from savedAssignments
            const savedIds = new Set((savedAssignments || []).map(a => a.id));
            const hasMissingOnboarding = currentStudents.some(s => s.onboarding_status === 'pending' && !savedIds.has(s.id));

            // If total students changed significantly or missing onboarding students, regenerate to include new ones
            if (hasMissingOnboarding || (Array.isArray(savedAssignments) && savedAssignments.length < 15 && currentStudents.length > savedAssignments.length)) {
                // Regenerate
            } else {
                if (savedAssignments && savedAssignments.length > 0) {
                    const studentIds = savedAssignments.map(a => a.id);
                    const [latestStudents] = await db.query(
                        `SELECT id, name, priority_category, enrollment_type, badge, onboarding_status, mentorship_completed 
                         FROM students 
                         WHERE id IN (?)`,
                        [studentIds]
                    );
                    const studentMap = new Map(latestStudents.map(s => [s.id, s]));
                    savedAssignments = savedAssignments.filter(assignment => {
                        const latest = studentMap.get(assignment.id);
                        return latest && latest.mentorship_completed !== 1;
                    }).map(assignment => {
                        const latest = studentMap.get(assignment.id);
                        if (latest) {
                            return {
                                ...assignment,
                                name: latest.name,
                                priority_category: latest.priority_category,
                                enrollment_type: latest.enrollment_type,
                                badge: latest.badge,
                                onboarding_status: latest.onboarding_status
                            };
                        }
                        return assignment;
                    });
                }
                return res.status(200).json({ success: true, data: savedAssignments || [], is_paused: isPaused });
            }
        }

        // Generate new assignments
        const assignments = await generateAssignments(mentor_id, today);
        
        // Save to DB
        await db.query(
            'INSERT INTO daily_assignments (mentor_id, date, assignments) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE assignments = ?',
            [mentor_id, today, JSON.stringify(assignments), JSON.stringify(assignments)]
        );

        res.status(200).json({ success: true, data: assignments, is_paused: isPaused });
    } catch (error) {
        console.error('Get Daily Assignments Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const generateAssignments = async (mentor_id, today) => {
    // Check if mentor is paused
    let [mentorRows] = await db.query('SELECT interaction_paused, current_rotation_index FROM users WHERE id = ?', [mentor_id]);
    if (mentorRows.length === 0) {
        [mentorRows] = await db.query('SELECT interaction_paused, current_rotation_index FROM mentors WHERE id = ?', [mentor_id]);
    }
    const mentor = mentorRows[0];
    if (mentor && mentor.interaction_paused) {
        return []; // Return empty if paused
    }

    const [students] = await db.query(
        `SELECT id, name, priority_category, enrollment_type, badge, onboarding_status 
         FROM students 
         WHERE mentor_id = ? 
         AND (LOWER(enrollment_type) LIKE '%mentorship%' OR LOWER(enrollment_type) = 'both')
         AND status != 'inactive' AND course_completed = 0 AND mentorship_completed = 0
         ORDER BY id ASC`,
        [mentor_id]
    );

    if (students.length === 0) return [];

    let selectedForToday = [];
    let carryOverStudents = [];

    // Query the most recent past assignment record for this mentor
    const [lastRecord] = await db.query(
        'SELECT assignments, date FROM daily_assignments WHERE mentor_id = ? AND date < ? ORDER BY date DESC LIMIT 1',
        [mentor_id, today]
    );

    if (lastRecord.length > 0) {
        let prevAssignments = lastRecord[0].assignments;
        if (typeof prevAssignments === 'string') {
            try { prevAssignments = JSON.parse(prevAssignments); } catch(e) { prevAssignments = []; }
        }
        if (Array.isArray(prevAssignments) && prevAssignments.length > 0) {
            // Find students who were NOT completed yesterday/last session
            const uncompleted = prevAssignments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED');
            const activeStudentMap = new Map(students.map(s => [s.id, s]));
            
            for (const a of uncompleted) {
                if (activeStudentMap.has(a.id)) {
                    carryOverStudents.push(activeStudentMap.get(a.id));
                }
            }
        }
    }

    // Determine where the next rotation should start using current_rotation_index
    const shiftAmount = students.length >= 25 ? 10 : 15;
    let nextStartIndex = mentor ? mentor.current_rotation_index : 0;
    
    // Ensure index is within bounds
    if (nextStartIndex >= students.length) {
        nextStartIndex = 0;
    }

    // Fill selectedForToday starting with onboarding students first, then carryOverStudents
    const onboardingStudents = students.filter(s => s.onboarding_status === 'pending');
    selectedForToday = [...onboardingStudents];
    const carryOverSet = new Set(onboardingStudents.map(s => s.id));

    for (const s of carryOverStudents) {
        if (!carryOverSet.has(s.id)) {
            selectedForToday.push(s);
            carryOverSet.add(s.id);
        }
    }

    // Now pick new students from rotation until we reach exactly 15 students
    let currIdx = nextStartIndex;
    let attempts = 0;
    while (selectedForToday.length < 15 && attempts < students.length) {
        const candidate = students[currIdx];
        if (!carryOverSet.has(candidate.id)) {
            selectedForToday.push(candidate);
            carryOverSet.add(candidate.id);
        }
        currIdx = (currIdx + 1) % students.length;
        attempts++;
    }

    // Advance the rotation index for the next day
    const newRotationIndex = currIdx;
    await db.query('UPDATE users SET current_rotation_index = ? WHERE id = ?', [newRotationIndex, mentor_id]);
    await db.query('UPDATE mentors SET current_rotation_index = ? WHERE id = ?', [newRotationIndex, mentor_id]);

    // 4. Distribute into session types (Deep, Medium, Quick)
    const deep = [];
    const medium = [];
    const quick = [];

    const firstDayPool = [];
    const restPool = [];

    // First day students (pending onboarding) MUST get DEEP
    for (let s of selectedForToday) {
        if (s.onboarding_status === 'pending') {
            firstDayPool.push(s);
        } else {
            restPool.push(s);
        }
    }

    for (let s of firstDayPool) {
        deep.push({ ...s, sessionType: 'DEEP', status: 'PENDING' });
    }

    // Assign directly based on mentor's explicit priority selection
    for (let s of restPool) {
        if (s.priority_category === 'High') {
            deep.push({ ...s, sessionType: 'DEEP', status: 'PENDING' });
        } else if (s.priority_category === 'Medium') {
            medium.push({ ...s, sessionType: 'MEDIUM', status: 'PENDING' });
        } else {
            quick.push({ ...s, sessionType: 'QUICK', status: 'PENDING' });
        }
    }

    return [...deep, ...medium, ...quick];
};

const submitSessionReport = async (req, res) => {
    try {
        const mentor_id = req.user.id;
        let { student_id, session_type, next_session_type, report_data } = req.body;

        if (typeof report_data === 'string') {
            try {
                report_data = JSON.parse(report_data);
            } catch(e) {
                console.error("Error parsing report_data:", e);
            }
        }

        if (!student_id || !session_type || !report_data) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Add uploaded files to report_data
        if (req.files && req.files.length > 0) {
            report_data.files = req.files.map(file => {
                if (file.path && file.path.startsWith('http')) {
                    return file.path;
                }
                return '/uploads/' + file.filename;
            });
        }

        // 4. Fraud Check (Module 7)
        let isFlagged = 0;
        let flagReason = null;

        const [history] = await db.query(
            'SELECT report_data FROM mentor_session_reports WHERE student_id = ? ORDER BY created_at DESC LIMIT 1',
            [student_id]
        );

        if (history.length > 0) {
            let lastReport = history[0].report_data;
            if (typeof lastReport === 'string') {
                try {
                    lastReport = JSON.parse(lastReport);
                } catch (e) {
                    lastReport = {};
                }
            }
            const currentPlan = report_data.action_plan || '';
            const lastPlan = lastReport?.action_plan || '';

            if (currentPlan && currentPlan === lastPlan && currentPlan.length > 10) {
                isFlagged = 1;
                flagReason = 'Duplicate Action Plan detected';
            }
        }

        // 5. Save Report (with optional flagging if columns exist)
        // 5. Save Report (with optional flagging if columns exist)
        if (session_type !== 'CANCELLED') {
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
                a.id == student_id ? { 
                    ...a, 
                    status: session_type === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED',
                    ...(session_type === 'CANCELLED' && report_data.cancel_reason ? { cancel_reason: report_data.cancel_reason } : {})
                } : a
            );

            await db.query(
                'UPDATE daily_assignments SET assignments = ? WHERE id = ?',
                [JSON.stringify(updatedAssignments), existing[0].id]
            );
        }

        if (session_type === 'CANCELLED') {
            return res.status(200).json({ success: true, message: 'Session cancelled and logged' });
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
            WHERE s.status != 'rejected'
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
    getWeeklyCoverage,
    togglePause: async (req, res) => { 
        try { 
            const mentor_id = req.user.id; 
            let [mentorRows] = await db.query('SELECT interaction_paused FROM users WHERE id = ?', [mentor_id]); 
            if (mentorRows.length === 0) {
                [mentorRows] = await db.query('SELECT interaction_paused FROM mentors WHERE id = ?', [mentor_id]);
            }
            const mentor = mentorRows[0];
            const newStatus = mentor ? !mentor.interaction_paused : false; 
            await db.query('UPDATE users SET interaction_paused = ? WHERE id = ?', [newStatus, mentor_id]); 
            await db.query('UPDATE mentors SET interaction_paused = ? WHERE id = ?', [newStatus, mentor_id]); 
            res.status(200).json({ success: true, is_paused: newStatus, message: 'Pause status updated' }); 
        } catch(err) { 
            console.error(err); 
            res.status(500).json({ success: false, message: 'Server Error' }); 
        } 
    }
};