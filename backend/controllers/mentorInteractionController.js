const db = require('../config/db');

const getISTDate = () => {
    return new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split(',')[0];
};

let hasMentorshipCol = null;
const checkMentorshipCol = async () => {
    if (hasMentorshipCol !== null) return hasMentorshipCol;
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM students LIKE 'mentorship_completed'");
        hasMentorshipCol = cols.length > 0;
    } catch(e) {
        hasMentorshipCol = false;
    }
    return hasMentorshipCol;
};

const returnMergedAssignments = async (savedAssignments, targetDate, mentor_id, isPaused, res) => {
    if (savedAssignments && savedAssignments.length > 0) {
        const hasMC = await checkMentorshipCol();
        const studentIds = savedAssignments.map(a => a.id);
        const [latestStudents] = await db.query(
        `SELECT id, name, priority_category, enrollment_type, badge, onboarding_status, last_session_type ${hasMC ? ', mentorship_completed' : ''} 
             FROM students 
             WHERE id IN (?)`,
            [studentIds]
        );
        const studentMap = new Map(latestStudents.map(s => [s.id, s]));
        savedAssignments = savedAssignments.filter(assignment => {
            const latest = studentMap.get(assignment.id);
            return latest && (hasMC ? latest.mentorship_completed !== 1 : true);
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
    
    // Merge with actual completed logs for this date to ensure carry-over students who were completed today show up
    const [completedLogs] = await db.query(
        `SELECT DISTINCT s.id, s.name, s.priority_category, s.enrollment_type, s.badge, s.onboarding_status,
            CASE WHEN msl.session_duration_minutes IS NOT NULL THEN 'MEDIUM' ELSE 'QUICK' END as sessionType
         FROM students s
         LEFT JOIN student_interaction_logs sil ON s.id = sil.student_id AND sil.date = ? AND sil.mentor_id = ?
         LEFT JOIN mentor_session_logs msl ON s.id = msl.student_id AND DATE(msl.created_at) = ? AND msl.mentor_id = ?
         WHERE (sil.id IS NOT NULL OR msl.id IS NOT NULL)`,
        [targetDate, mentor_id, targetDate, mentor_id]
    );

    const finalAssignments = savedAssignments || [];
    const existingIds = new Set(finalAssignments.map(a => a.id));

    for (const log of completedLogs) {
        if (!existingIds.has(log.id)) {
            finalAssignments.push({
                ...log,
                status: 'COMPLETED'
            });
            existingIds.add(log.id);
        } else {
            // Ensure it's marked as completed if it exists
            const index = finalAssignments.findIndex(a => a.id === log.id);
            if (index !== -1 && finalAssignments[index].status !== 'COMPLETED') {
                finalAssignments[index].status = 'COMPLETED';
            }
        }
    }

    return res.status(200).json({ success: true, data: finalAssignments, is_paused: isPaused });
};

const getDailyAssignments = async (req, res) => {
    try {
        const mentor_id = req.user.id;
        const today = getISTDate();
        const dateParam = req.query.date;
        const targetDate = dateParam || today;
        const isToday = targetDate === today;

        // Get mentor pause status
        let isPaused = false;
        try {
            let [mentorRows] = await db.query('SELECT interaction_paused FROM users WHERE id = ?', [mentor_id]);
            if (mentorRows.length === 0) {
                [mentorRows] = await db.query('SELECT interaction_paused FROM mentors WHERE id = ?', [mentor_id]);
            }
            isPaused = mentorRows[0]?.interaction_paused || false;
        } catch (dbErr) {
            // Fallback to local file if column doesn't exist
            const fs = require('fs');
            const path = require('path');
            const pauseFile = path.join(__dirname, '..', 'data', 'mentor_pause_states.json');
            if (fs.existsSync(pauseFile)) {
                try {
                    const states = JSON.parse(fs.readFileSync(pauseFile, 'utf8'));
                    isPaused = states[mentor_id] || false;
                } catch(e) {}
            }
        }

        // ── Generate fresh assignments for today if needed ───────────
        if (isToday) {
            try {
                const { processRolloverForMentor } = require('../cron/midnightInteractionRollover');
                await processRolloverForMentor(mentor_id, today, (() => {
                    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                    d.setDate(d.getDate() - 1);
                    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                })());
            } catch (rolloverErr) {
                console.error('Rollover error (non-fatal):', rolloverErr);
            }
        }

        // ── Try new table first ──────────────────────────────────────
        let newRecords = [];
        try {
            [newRecords] = await db.query(
                `SELECT r.student_id as id, r.session_type as sessionType, r.status, r.is_carry_over,
                        s.name, s.priority_category, s.enrollment_type, s.badge, s.onboarding_status,
                        s.last_session_type, s.mentorship_completed,
                        100 as hours_percent,
                        0 as consumed_hours, 0 as paid_hours,
                        'Safe' as payment_alert_level
                 FROM mentor_daily_interaction_records r
                 JOIN students s ON r.student_id = s.id
                 WHERE r.mentor_id = ? AND r.record_date = ? AND (s.mentorship_completed = 0 OR s.mentorship_completed IS NULL)`,
                [mentor_id, targetDate]
            );
        } catch (colErr) {
            // Fallback if mentorship_completed or mentor_daily_interaction_records doesn't exist
            try {
                [newRecords] = await db.query(
                    `SELECT r.student_id as id, r.session_type as sessionType, r.status, r.is_carry_over,
                            s.name, s.priority_category, s.enrollment_type, s.badge, s.onboarding_status,
                            s.last_session_type,
                            100 as hours_percent,
                            0 as consumed_hours, 0 as paid_hours,
                            'Safe' as payment_alert_level
                     FROM mentor_daily_interaction_records r
                     JOIN students s ON r.student_id = s.id
                     WHERE r.mentor_id = ? AND r.record_date = ?`,
                    [mentor_id, targetDate]
                );
            } catch (tableErr) {
                newRecords = [];
            }
        }

        if (newRecords.length > 0) {
            // Merge with session reports to ensure accurate status
            const [completedReports] = await db.query(
                'SELECT DISTINCT student_id, session_type FROM mentor_session_reports WHERE mentor_id = ? AND DATE(created_at) = ?',
                [mentor_id, targetDate]
            );
            const completedMap = new Map(completedReports.map(r => [r.student_id, r.session_type]));

            let merged = newRecords.map(r => ({
                ...r,
                status: completedMap.has(r.id) ? 'COMPLETED' : r.status,
                sessionType: completedMap.has(r.id) ? (completedMap.get(r.id) || r.sessionType) : r.sessionType
            }));

            // Strict enforcement: Maximum 15 interactions per day
            if (merged.length > 15) {
                const excessIds = merged.slice(15).map(r => r.id);
                merged = merged.slice(0, 15);
                
                // Delete excess from DB to self-heal
                if (excessIds.length > 0) {
                    await db.query(
                        'DELETE FROM mentor_daily_interaction_records WHERE mentor_id = ? AND record_date = ? AND student_id IN (?)',
                        [mentor_id, targetDate, excessIds]
                    ).catch(e => console.error('[CLEANUP] Failed to delete excess records:', e.message));
                }
            }

            return res.status(200).json({ success: true, data: merged, is_paused: isPaused });
        }

        // ── Fallback: old daily_assignments table ────────────────────
        const [existing] = await db.query(
            'SELECT assignments FROM daily_assignments WHERE mentor_id = ? AND date = ?',
            [mentor_id, targetDate]
        );

        if (existing.length > 0) {
            let savedAssignments = existing[0].assignments;
            if (typeof savedAssignments === 'string') {
                try { savedAssignments = JSON.parse(savedAssignments); } catch(e) { savedAssignments = []; }
            }

            // Sync completed status from session reports
            const [completedReports] = await db.query(
                'SELECT DISTINCT student_id, session_type FROM mentor_session_reports WHERE mentor_id = ? AND DATE(created_at) = ?',
                [mentor_id, targetDate]
            );
            const completedMap = new Map(completedReports.map(r => [r.student_id, r.session_type]));

            const merged = (savedAssignments || [])
                .filter(a => a.id) // remove corrupted entries
                .map(a => ({
                    ...a,
                    status: completedMap.has(a.id) ? 'COMPLETED' : a.status,
                    sessionType: completedMap.has(a.id) ? (completedMap.get(a.id) || a.sessionType) : a.sessionType
                }));

            // Migrate these to new table for future use
            if (merged.length > 0) {
                const values = merged.map(a => [mentor_id, a.id, targetDate, a.status || 'PENDING', a.sessionType || 'QUICK', a.is_carry_over ? 1 : 0]);
                await db.query(
                    `INSERT IGNORE INTO mentor_daily_interaction_records (mentor_id, student_id, record_date, status, session_type, is_carry_over) VALUES ?`,
                    [values]
                ).catch(e => console.error('[MIGRATE] Error migrating to new table:', e.message));
            }

            return res.status(200).json({ success: true, data: merged, is_paused: isPaused });
        }

        // ── Past date with no record: reconstruct from all students ──
        if (!isToday) {
            const [allMentorshipStudents] = await db.query(
                `SELECT id, name, priority_category, enrollment_type, badge, onboarding_status, last_session_type,
                        0 as consumed_hours, 0 as paid_hours,
                        'Safe' as payment_alert_level
                 FROM students
                 WHERE mentor_id = ?
                 AND (LOWER(enrollment_type) LIKE '%mentorship%' OR LOWER(enrollment_type) = 'both')
                 AND status != 'inactive'`,
                [mentor_id]
            );

            const [completedOnDate] = await db.query(
                `SELECT DISTINCT student_id, session_type FROM mentor_session_reports WHERE mentor_id = ? AND DATE(created_at) = ?`,
                [mentor_id, targetDate]
            );
            const completedMap = new Map(completedOnDate.map(r => [r.student_id, r.session_type]));

            const pastAssignments = allMentorshipStudents.map(s => ({
                ...s,
                sessionType: completedMap.has(s.id) ? (completedMap.get(s.id) || s.last_session_type || 'QUICK') : (s.last_session_type || 'QUICK'),
                status: completedMap.has(s.id) ? 'COMPLETED' : 'PENDING'
            }));

            return res.status(200).json({ success: true, data: pastAssignments, is_paused: isPaused });
        }

        // If no records found in new or old tables, return empty array
        return res.status(200).json({ success: true, data: [], is_paused: isPaused });
    } catch (error) {
        console.error('Get Daily Assignments Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const submitSessionReport = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const mentor_id = req.user.id;
        let { student_id, session_type, next_session_type, report_data, session_number, session_id } = req.body;

        if (typeof report_data === 'string') {
            try {
                report_data = JSON.parse(report_data);
            } catch(e) {
                console.error("Error parsing report_data:", e);
            }
        }

        if (!student_id || !session_type || !report_data) {
            return res.status(400).json({ success: false, message: 'Missing required fields: student_id, session_type, and report_data are required' });
        }

        // Log upload warning if files failed to upload
        if (req.uploadError) {
            console.warn('[SUBMIT REPORT] File upload failed, proceeding without files:', req.uploadError);
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

        const [history] = await connection.query(
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

        // 5. Save Report - with exact duplicate check based on session details
        const today = getISTDate();
        const interactionDate = req.body.interaction_date || today;

        if (session_type !== 'CANCELLED') {
            // New duplicate logic: Check for exact same session_id or session_number if provided, else check date + session_type
            let duplicateQuery = 'SELECT id FROM mentor_session_reports WHERE mentor_id = ? AND student_id = ? AND DATE(created_at) = ? AND session_type = ?';
            let duplicateParams = [mentor_id, student_id, interactionDate, session_type];
            
            // If the UI passes session_id, ensure we don't duplicate for the exact same session_id
            if (session_id) {
                duplicateQuery = 'SELECT id FROM mentor_session_reports WHERE mentor_id = ? AND student_id = ? AND report_data LIKE ?';
                duplicateParams = [mentor_id, student_id, `%\"session_id\":\"${session_id}\"%`];
            }

            const [existingLog] = await connection.query(duplicateQuery, duplicateParams);

            if (existingLog.length > 0) {
                await connection.rollback();
                return res.status(409).json({ success: false, message: "A report for this specific interaction already exists." });
            }

            const created_at_val = `${interactionDate} 12:00:00`;
            let insertedId = null;
            try {
                const [result] = await connection.query(
                    'INSERT INTO mentor_session_reports (student_id, mentor_id, session_type, report_data, is_flagged, flag_reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [student_id, mentor_id, session_type, JSON.stringify(report_data), isFlagged, flagReason, created_at_val]
                );
                insertedId = result.insertId;
            } catch (dbErr) {
                // Remove fallback to guarantee schema consistency, throwing triggers rollback
                throw new Error(`CRITICAL FAILURE: Interaction log insert failed: ${dbErr.message}`);
            }

            // Post-Insert Database Verification
            const [verifyRows] = await connection.query('SELECT id FROM mentor_session_reports WHERE id = ?', [insertedId]);
            if (verifyRows.length === 0) {
                throw new Error("CRITICAL FAILURE: Interaction report verification failed after insert.");
            }
            
            // Check student_interaction_logs if table exists
            try {
                // Drop the foreign key constraint that blocks mentors who are not in the users table
                try {
                    await connection.query('ALTER TABLE student_interaction_logs DROP FOREIGN KEY student_interaction_logs_ibfk_1');
                } catch (fkErr) {
                    // Ignore error if it's already dropped or doesn't exist
                }

                // If the table exists and is part of workflow, insert into it too.
                const [silResult] = await connection.query(`
                    INSERT INTO student_interaction_logs (student_id, mentor_id, mentor_notes, connected_today, date)
                    VALUES (?, ?, ?, 1, ?)
                `, [student_id, mentor_id, report_data.action_plan || report_data.notes || '', interactionDate]);
                
                const [silVerify] = await connection.query('SELECT id FROM student_interaction_logs WHERE id = ?', [silResult.insertId]);
                if (silVerify.length === 0) {
                    throw new Error("CRITICAL FAILURE: student_interaction_logs verification failed.");
                }
            } catch (silErr) {
                if (silErr.code !== 'ER_NO_SUCH_TABLE') {
                    throw new Error(`CRITICAL FAILURE: student_interaction_logs insert failed: ${silErr.message}`);
                }
                // If table doesn't exist, we safely ignore this check as per prompt ("if this table participates")
            }
        }
        // 6. Update assignment list status in new table (mentor_daily_interaction_records)
        // Update ALL past records for this student up to interactionDate
        const newStatus = session_type === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED';
        await connection.query(
            `UPDATE mentor_daily_interaction_records 
             SET status = ? 
             WHERE mentor_id = ? AND student_id = ? AND record_date <= ? AND status = 'PENDING'`,
            [newStatus, mentor_id, student_id, interactionDate]
        );

        // Also update daily_assignments (legacy table) for backward compatibility
        const [allAssignments] = await connection.query(
            'SELECT id, date, assignments FROM daily_assignments WHERE mentor_id = ? AND date <= ?',
            [mentor_id, interactionDate]
        );

        for (let record of allAssignments) {
            let assignments = record.assignments;
            if (typeof assignments === 'string') {
                try { assignments = JSON.parse(assignments); } catch (e) { continue; }
            }
            
            let updated = false;
            const updatedAssignments = assignments.map(a => {
                if (a.id == student_id && a.status !== 'COMPLETED' && a.status !== 'CANCELLED') {
                    updated = true;
                    return { 
                        ...a, 
                        status: session_type === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED',
                        ...(session_type === 'CANCELLED' && report_data.cancel_reason ? { cancel_reason: report_data.cancel_reason } : {})
                    };
                }
                return a;
            });

            if (updated) {
                await connection.query(
                    'UPDATE daily_assignments SET assignments = ? WHERE id = ?',
                    [JSON.stringify(updatedAssignments), record.id]
                );
            }
        }

        if (session_type === 'CANCELLED') {
            await connection.commit();
            return res.status(200).json({ success: true, message: 'Session cancelled and logged' });
        }

        // 7. Priority Logic (Manual Priority from Mentor)
        // Set priority based on mentor's selection for the next interaction type
        const [[currentStudent]] = await connection.query('SELECT priority_category FROM students WHERE id = ?', [student_id]);
        let currentP = currentStudent?.priority_category || 'Stable';
        let finalPriority = currentP;

        // ONLY update priority if next_session_type is explicitly provided by the mentor
        if (next_session_type) {
            if (next_session_type === 'DEEP') finalPriority = 'High';
            else if (next_session_type === 'MEDIUM') finalPriority = 'Medium';
            else if (next_session_type === 'QUICK') finalPriority = 'Stable';
        }
        // If next_session_type is not provided, keep current priority_category

        await connection.query(
            'UPDATE students SET priority_category = ?, last_session_type = ?, last_session_date = ?, onboarding_status = "completed" WHERE id = ?',
            [finalPriority, next_session_type || session_type, interactionDate, student_id]
        );

        // Notify Admin of new session report
        try {
            const [[student]] = await connection.query('SELECT name FROM students WHERE id = ?', [student_id]);
            let msg = `<b>Interaction Hub:</b> Mentor <b>${req.user.name}</b> completed a <b>${session_type}</b> session with <b>${student?.name || student_id}</b>.`;
            if (isFlagged) msg += ` <span style="color: red;">⚠️ Possible Fraud Detected!</span>`;

            await connection.query('INSERT INTO admin_notifications (message, related_id, action_type) VALUES (?, ?, ?)', [
                msg,
                student_id,
                'mentor_session_report'
            ]);
        } catch (nErr) {
            console.error("Notification Error:", nErr.message);
        }

        await connection.commit();
        res.status(200).json({ success: true, message: 'Report submitted and student state updated', flagged: isFlagged });
    } catch (error) {
        await connection.rollback();
        console.error('Submit Session Report Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server Error' });
    } finally {
        connection.release();
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

const updateSessionReport = async (req, res) => {
    try {
        const mentor_id = req.user.id;
        const { id: student_id } = req.params;
        let { session_type, next_session_type, report_data } = req.body;

        if (typeof report_data === 'string') {
            try { report_data = JSON.parse(report_data); } catch(e) {}
        }

        if (req.files && req.files.length > 0) {
            report_data.files = req.files.map(file => {
                if (file.path && file.path.startsWith('http')) return file.path;
                return '/uploads/' + file.filename;
            });
        }

        const today = getISTDate();
        
        const [existing] = await db.query(
            'SELECT id, report_data FROM mentor_session_reports WHERE mentor_id = ? AND student_id = ? AND DATE(created_at) = ? ORDER BY id DESC LIMIT 1',
            [mentor_id, student_id, today]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'No interaction logged today for this student' });
        }

        if (!report_data.files && existing[0].report_data) {
            let oldData = existing[0].report_data;
            if (typeof oldData === 'string') {
                try { oldData = JSON.parse(oldData); } catch(e) { oldData = {}; }
            }
            if (oldData.files) {
                report_data.files = oldData.files;
            }
        }

        await db.query(
            'UPDATE mentor_session_reports SET session_type = ?, report_data = ? WHERE id = ?',
            [session_type, JSON.stringify(report_data), existing[0].id]
        );

        if (next_session_type) {
            const [[currentStudent]] = await db.query('SELECT priority_category FROM students WHERE id = ?', [student_id]);
            let finalPriority = currentStudent?.priority_category || 'Stable';
            if (next_session_type === 'DEEP') finalPriority = 'High';
            else if (next_session_type === 'MEDIUM') finalPriority = 'Medium';
            else if (next_session_type === 'QUICK') finalPriority = 'Stable';

            await db.query(
                'UPDATE students SET priority_category = ?, last_session_type = ? WHERE id = ?',
                [finalPriority, next_session_type || session_type, student_id]
            );
        }

        res.status(200).json({ success: true, message: 'Interaction updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSessionReport = async (req, res) => {
    try {
        const mentor_id = req.user.id;
        const { id: student_id } = req.params;
        const today = getISTDate();

        await db.query(
            'DELETE FROM mentor_session_reports WHERE mentor_id = ? AND student_id = ? AND DATE(created_at) = ?',
            [mentor_id, student_id, today]
        );

        const [assignmentRow] = await db.query(
            'SELECT id, assignments FROM daily_assignments WHERE mentor_id = ? AND date = ?',
            [mentor_id, today]
        );

        if (assignmentRow.length > 0) {
            let assignments = assignmentRow[0].assignments;
            if (typeof assignments === 'string') {
                try { assignments = JSON.parse(assignments); } catch(e) { assignments = []; }
            }
            
            const updatedAssignments = assignments.map(a => 
                a.id == student_id ? { ...a, status: 'PENDING' } : a
            );

            await db.query(
                'UPDATE daily_assignments SET assignments = ? WHERE id = ?',
                [JSON.stringify(updatedAssignments), assignmentRow[0].id]
            );
        }

        res.status(200).json({ success: true, message: 'Interaction deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTodaySessionReport = async (req, res) => {
    try {
        const mentor_id = req.user.id;
        const { id: student_id } = req.params;
        const dateParam = req.query.date;
        const targetDate = dateParam || getISTDate();

        const [existing] = await db.query(
            'SELECT id, report_data, session_type, created_at FROM mentor_session_reports WHERE mentor_id = ? AND student_id = ? AND DATE(created_at) = ? ORDER BY id DESC LIMIT 1',
            [mentor_id, student_id, targetDate]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'No interaction logged for this date' });
        }

        let report_data = existing[0].report_data;
        if (typeof report_data === 'string') {
            try { report_data = JSON.parse(report_data); } catch(e) { report_data = {}; }
        }

        res.status(200).json({ success: true, data: report_data, session_type: existing[0].session_type, report_id: existing[0].id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const getYesterdayPending = async (req, res) => {
    try {
        const mentor_id = req.user.id;
        

        const dateParam = req.query.date;
        const today = getISTDate();
        const referenceDate = dateParam || today;
        
        // Calculate yesterday relative to referenceDate
        const refDateObj = new Date(referenceDate + 'T00:00:00');
        refDateObj.setDate(refDateObj.getDate() - 1);
        const yesterdayDate = `${refDateObj.getFullYear()}-${String(refDateObj.getMonth()+1).padStart(2,'0')}-${String(refDateObj.getDate()).padStart(2,'0')}`;

        // Get students completed on yesterday's date (source of truth)
        const [completedYesterday] = await db.query(
            'SELECT DISTINCT student_id FROM mentor_session_reports WHERE mentor_id = ? AND DATE(created_at) = ?',
            [mentor_id, yesterdayDate]
        );
        const completedYesterdayIds = new Set(completedYesterday.map(r => r.student_id));

        // Get students completed via "Yesterday Pending" on today (completed today but with interaction_date = yesterday)
        const [completedTodayRows] = await db.query(
            'SELECT student_id FROM mentor_session_reports WHERE mentor_id = ? AND DATE(created_at) = ?',
            [mentor_id, referenceDate]
        );
        const completedTodayIds = new Set(completedTodayRows.map(r => r.student_id));

        let pendingStudents = [];

        // ── Try new table first ──────────────────────────────────────
        const [newTableRecords] = await db.query(
            `SELECT r.student_id as id, r.session_type as sessionType, r.status, r.is_carry_over,
                    s.name, s.priority_category, s.enrollment_type, s.badge, s.onboarding_status
             FROM mentor_daily_interaction_records r
             JOIN students s ON r.student_id = s.id
             WHERE r.mentor_id = ? AND r.record_date = ? AND r.status = 'PENDING' AND (s.mentorship_completed = 0 OR s.mentorship_completed IS NULL)`,
            [mentor_id, yesterdayDate]
        );

        if (newTableRecords.length > 0) {
            pendingStudents = newTableRecords.filter(a => 
                !completedYesterdayIds.has(a.id) && !completedTodayIds.has(a.id)
            );
            return res.status(200).json({ success: true, data: pendingStudents });
        }

        // ── Fallback: old daily_assignments table ────────────────────
        const [yesterdayRecord] = await db.query(
            'SELECT assignments FROM daily_assignments WHERE mentor_id = ? AND date = ?',
            [mentor_id, yesterdayDate]
        );

        if (yesterdayRecord.length > 0) {
            let assignments = yesterdayRecord[0].assignments;
            if (typeof assignments === 'string') {
                try { assignments = JSON.parse(assignments); } catch(e) { assignments = []; }
            }
            pendingStudents = (assignments || []).filter(a => 
                !completedYesterdayIds.has(a.id) && !completedTodayIds.has(a.id)
            );
            return res.status(200).json({ success: true, data: pendingStudents });
        }

        // ── Last resort: all mentorship students minus completed ─────
        const [allMentorshipStudents] = await db.query(
            `SELECT id, name, priority_category, enrollment_type, badge, onboarding_status, last_session_type
             FROM students
             WHERE mentor_id = ?
             AND (LOWER(enrollment_type) LIKE '%mentorship%' OR LOWER(enrollment_type) = 'both')
             AND status != 'inactive' AND (course_completed = 0 OR course_completed IS NULL) AND (mentorship_completed = 0 OR mentorship_completed IS NULL)`,
            [mentor_id]
        );
        pendingStudents = allMentorshipStudents
            .filter(s => !completedYesterdayIds.has(s.id) && !completedTodayIds.has(s.id))
            .map(s => ({
                ...s,
                sessionType: s.last_session_type || 'QUICK',
                status: 'PENDING'
            }));

        res.status(200).json({ success: true, data: pendingStudents });
    } catch (error) {
        console.error("getYesterdayPending Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = {
    getDailyAssignments,
    submitSessionReport,
    getHighRiskStudents,
    getWeeklyCoverage,
    updateSessionReport,
    deleteSessionReport,
    getTodaySessionReport,
    getYesterdayPending,
    togglePause: async (req, res) => { 
        try { 
            const mentor_id = req.user.id; 
            let newStatus = false;
            
            try {
                let [mentorRows] = await db.query('SELECT interaction_paused FROM users WHERE id = ?', [mentor_id]); 
                if (mentorRows.length === 0) {
                    [mentorRows] = await db.query('SELECT interaction_paused FROM mentors WHERE id = ?', [mentor_id]);
                }
                const mentor = mentorRows[0];
                newStatus = mentor ? !mentor.interaction_paused : true; 
                
                await db.query('UPDATE users SET interaction_paused = ? WHERE id = ?', [newStatus, mentor_id]); 
                await db.query('UPDATE mentors SET interaction_paused = ? WHERE id = ?', [newStatus, mentor_id]); 
            } catch (dbErr) {
                // Fallback to local file if column doesn't exist
                const fs = require('fs');
                const path = require('path');
                const dataDir = path.join(__dirname, '..', 'data');
                if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
                
                const pauseFile = path.join(dataDir, 'mentor_pause_states.json');
                let states = {};
                if (fs.existsSync(pauseFile)) {
                    try { states = JSON.parse(fs.readFileSync(pauseFile, 'utf8')); } catch(e) {}
                }
                
                newStatus = !(states[mentor_id] || false);
                states[mentor_id] = newStatus;
                fs.writeFileSync(pauseFile, JSON.stringify(states));
            }

            res.status(200).json({ success: true, is_paused: newStatus, message: 'Pause status updated' }); 
        } catch(err) { 
            console.error(err); 
            res.status(500).json({ success: false, message: 'Server Error' }); 
        } 
    },
    forceRollover: async (req, res) => {
        try {
            const { processRolloverForMentor } = require('../cron/midnightInteractionRollover');
            const mentor_id = req.user.id;
            const today = (() => {
                const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })();
            const yesterday = (() => {
                const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                d.setDate(d.getDate() - 1);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })();
            
            // Delete require cache so we load the LATEST file with our fixes
            delete require.cache[require.resolve('../cron/midnightInteractionRollover')];
            const freshRollover = require('../cron/midnightInteractionRollover');
            
            await freshRollover.processRolloverForMentor(mentor_id, today, yesterday);
            res.status(200).json({ success: true, message: 'Forced rollover complete' });
        } catch(err) {
            console.error(err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
};