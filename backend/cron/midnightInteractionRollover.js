/**
 * Midnight Interaction Rollover Cron
 * Runs at 12:01 AM IST daily.
 * 
 * What it does:
 * 1. For each active mentor, gets all students who are PENDING from yesterday's interaction records
 * 2. Carries those students into today's mentor_daily_interaction_records as carry-overs
 * 3. Also generates fresh rotation students for today (up to 15 total)
 * 
 * This ensures:
 * - No student is ever missed
 * - Yesterday's pending shows correctly
 * - No dependency on dashboard being opened
 */

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

const getYesterdayIST = () => {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const runMidnightRollover = async () => {
    try {
        const today = getISTDate();
        const yesterday = getYesterdayIST();

        console.log(`[ROLLOVER] Running for today=${today}, yesterday=${yesterday}`);

        const hasMC = await checkMentorshipCol();
        // Get all active mentors
        const [mentors] = await db.query(
             `SELECT DISTINCT mentor_id FROM students 
              WHERE mentor_id IS NOT NULL 
              AND (LOWER(enrollment_type) LIKE '%mentorship%' OR LOWER(enrollment_type) = 'both')
              AND status != 'inactive' AND (course_completed = 0 OR course_completed IS NULL) ${hasMC ? 'AND (mentorship_completed = 0 OR mentorship_completed IS NULL)' : ''}`
        );

        for (const { mentor_id } of mentors) {
            try {
                await processRolloverForMentor(mentor_id, today, yesterday);
            } catch (mentorErr) {
                console.error(`[ROLLOVER] Error processing mentor ${mentor_id}:`, mentorErr.message);
            }
        }

        console.log(`[ROLLOVER] Completed midnight rollover for ${mentors.length} mentors.`);
    } catch (error) {
        console.error('[ROLLOVER] Critical error in runMidnightRollover:', error);
    }
};

const processRolloverForMentor = async (mentor_id, today, yesterday) => {
    // Check if today's records already exist (prevent double-run)
    const [todayExists] = await db.query(
        'SELECT COUNT(*) as cnt FROM mentor_daily_interaction_records WHERE mentor_id = ? AND record_date = ?',
        [mentor_id, today]
    );
    if (todayExists[0].cnt > 0) {
        console.log(`[ROLLOVER] Mentor ${mentor_id} already has records for ${today}. Skipping.`);
        return;
    }

    const hasMC = await checkMentorshipCol();
    // Get students assigned to this mentor
    const [students] = await db.query(
        `SELECT id, name, last_session_type, priority_category, enrollment_type, badge, onboarding_status
         FROM students
         WHERE mentor_id = ?
         AND (LOWER(enrollment_type) LIKE '%mentorship%' OR LOWER(enrollment_type) = 'both')
         AND status != 'inactive' AND course_completed = 0 ${hasMC ? 'AND (mentorship_completed = 0 OR mentorship_completed IS NULL)' : ''}
         ORDER BY id ASC`,
        [mentor_id]
    );

    if (students.length === 0) return;

    // Get yesterday's PENDING students (from mentor_daily_interaction_records)
    const [yesterdayPending] = await db.query(
        `SELECT r.student_id, r.session_type
         FROM mentor_daily_interaction_records r
         WHERE r.mentor_id = ? AND r.record_date = ? AND r.status = 'PENDING'`,
        [mentor_id, yesterday]
    );

    // Also check students who were in yesterday's daily_assignments (JSON) but no record yet
    // This handles migration period where old data is in daily_assignments
    let carryOverIds = new Set(yesterdayPending.map(r => r.student_id));
    const carryOverMap = new Map(yesterdayPending.map(r => [r.student_id, r.session_type]));

    // If no yesterday records in new table, fall back to old daily_assignments
    if (yesterdayPending.length === 0) {
        const [oldRecord] = await db.query(
            'SELECT assignments FROM daily_assignments WHERE mentor_id = ? AND date = ?',
            [mentor_id, yesterday]
        );
        if (oldRecord.length > 0) {
            let assignments = oldRecord[0].assignments;
            if (typeof assignments === 'string') {
                try { assignments = JSON.parse(assignments); } catch(e) { assignments = []; }
            }
            const pending = (assignments || []).filter(a => a.status === 'PENDING' || a.status !== 'COMPLETED');
            for (const p of pending) {
                carryOverIds.add(p.id);
                carryOverMap.set(p.id, p.sessionType || 'QUICK');
            }
        } else {
            // No record at all for yesterday: check completed sessions to find who was done
            const [completedYesterday] = await db.query(
                'SELECT DISTINCT student_id FROM mentor_session_reports WHERE mentor_id = ? AND DATE(created_at) = ?',
                [mentor_id, yesterday]
            );
            const completedIds = new Set(completedYesterday.map(r => r.student_id));
            // All students NOT completed = carry over
            for (const s of students) {
                if (!completedIds.has(s.id)) {
                    carryOverIds.add(s.id);
                    carryOverMap.set(s.id, s.last_session_type || 'QUICK');
                }
            }
        }
    }

    // Get mentor's current rotation index and pause state safely
    let mentor = {};
    let isPaused = false;
    try {
        let [mentorRows] = await db.query('SELECT current_rotation_index, interaction_paused FROM users WHERE id = ?', [mentor_id]);
        if (mentorRows.length === 0) {
            [mentorRows] = await db.query('SELECT current_rotation_index, interaction_paused FROM mentors WHERE id = ?', [mentor_id]);
        }
        mentor = mentorRows[0] || {};
        isPaused = mentor.interaction_paused || false;
    } catch (colErr) {
        // Fallback if interaction_paused is missing
        try {
            let [mRows] = await db.query('SELECT current_rotation_index FROM users WHERE id = ?', [mentor_id]);
            if (mRows.length === 0) [mRows] = await db.query('SELECT current_rotation_index FROM mentors WHERE id = ?', [mentor_id]);
            mentor = mRows[0] || {};
        } catch (e) {}
        
        // Read pause state from local file as fallback
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

    const toInsert = []; // { student_id, session_type, is_carry_over }

    // First: add carry-over students (yesterday's pending)
    for (const studentId of carryOverIds) {
        const student = students.find(s => s.id === studentId);
        if (student) {
            toInsert.push({
                student_id: studentId,
                session_type: carryOverMap.get(studentId) || student.last_session_type || 'QUICK',
                is_carry_over: 1
            });
        }
    }

    // Then: add fresh rotation students (if not paused)
    if (!isPaused) {
        const alreadyAddedIds = new Set(toInsert.map(r => r.student_id));

        // Onboarding students first
        const onboardingStudents = students.filter(s => s.onboarding_status === 'pending' && !alreadyAddedIds.has(s.id));
        for (const s of onboardingStudents) {
            toInsert.push({ student_id: s.id, session_type: 'DEEP', is_carry_over: 0 });
            alreadyAddedIds.add(s.id);
        }

        // Fill up to 15 from rotation
        let nextIdx = mentor.current_rotation_index || 0;
        if (nextIdx >= students.length) nextIdx = 0;

        let attempts = 0;
        const targetCount = 15;
        let freshCount = toInsert.filter(r => !r.is_carry_over).length;

        while (freshCount < targetCount && attempts < students.length) {
            const candidate = students[nextIdx];
            if (!alreadyAddedIds.has(candidate.id)) {
                const sessionType = candidate.last_session_type || 'QUICK';
                toInsert.push({ student_id: candidate.id, session_type: sessionType, is_carry_over: 0 });
                alreadyAddedIds.add(candidate.id);
                freshCount++;
            }
            nextIdx = (nextIdx + 1) % students.length;
            attempts++;
        }

        // Update rotation index
        const newIdx = students.length > 15 ? nextIdx : 0;
        await db.query('UPDATE users SET current_rotation_index = ? WHERE id = ?', [newIdx, mentor_id]);
        await db.query('UPDATE mentors SET current_rotation_index = ? WHERE id = ?', [newIdx, mentor_id]).catch(() => {});
    }

    // Insert records into new table
    if (toInsert.length > 0) {
        const values = toInsert.map(r => [mentor_id, r.student_id, today, 'PENDING', r.session_type, r.is_carry_over]);
        await db.query(
            `INSERT IGNORE INTO mentor_daily_interaction_records 
             (mentor_id, student_id, record_date, status, session_type, is_carry_over) 
             VALUES ?`,
            [values]
        );
        console.log(`[ROLLOVER] Mentor ${mentor_id}: Inserted ${toInsert.length} records for ${today} (${toInsert.filter(r=>r.is_carry_over).length} carry-overs)`);
    }

    // Also save to daily_assignments for backward compatibility
    const legacyAssignments = toInsert.map(r => ({
        id: r.student_id,
        name: students.find(s => s.id === r.student_id)?.name || '',
        sessionType: r.session_type,
        status: 'PENDING',
        is_carry_over: r.is_carry_over === 1
    }));
    await db.query(
        'INSERT INTO daily_assignments (mentor_id, date, assignments) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE assignments = ?',
        [mentor_id, today, JSON.stringify(legacyAssignments), JSON.stringify(legacyAssignments)]
    );
};

module.exports = { runMidnightRollover, processRolloverForMentor };
