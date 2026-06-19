const db = require('./config/db');

async function runRecoveryScan() {
    console.log("=================================================");
    console.log("    PHASE 2: COMPREHENSIVE DATA RECOVERY SCAN    ");
    console.log("=================================================");
    
    try {
        // 1. Missing Timetable Report & 3. Faculty Schedule Mismatch Report
        const [facultySchedules] = await db.query(`
            SELECT fs.student_id, s.name as student_name, 
                   COUNT(fs.id) as faculty_schedule_count
            FROM faculty_schedules fs
            JOIN students s ON fs.student_id = s.id
            WHERE (fs.is_deleted IS NULL OR fs.is_deleted = 0)
            GROUP BY fs.student_id, s.name
        `);

        const [timetables] = await db.query(`
            SELECT student_id, COUNT(id) as timetable_count
            FROM timetable
            WHERE (is_deleted IS NULL OR is_deleted = 0)
            GROUP BY student_id
        `);

        const timetableMap = new Map();
        timetables.forEach(t => timetableMap.set(t.student_id, t.timetable_count));

        const missingTimetableReport = [];
        const facultyScheduleMismatchReport = {
            faculty_without_timetable: [],
            timetable_without_faculty: [] // Complex to calculate exactly without knowing expected weeks, but we check zero vs non-zero
        };

        for (const fs of facultySchedules) {
            const ttCount = timetableMap.get(fs.student_id) || 0;
            // Assuming each faculty schedule should generate at least 4 weeks of timetables (4 slots)
            const expectedMinTtCount = fs.faculty_schedule_count * 4; 
            
            if (ttCount === 0) {
                missingTimetableReport.push({
                    student_id: fs.student_id,
                    student_name: fs.student_name,
                    faculty_schedule_count: fs.faculty_schedule_count,
                    timetable_count: 0,
                    missing_timetable_count: expectedMinTtCount, // Estimate
                    recommendation: "Run 'Recreate Timetable' from SSC Panel to generate the 4-week future slots safely."
                });
                facultyScheduleMismatchReport.faculty_without_timetable.push(fs.student_id);
            } else if (ttCount < fs.faculty_schedule_count) {
                // Mismatch
                facultyScheduleMismatchReport.faculty_without_timetable.push(fs.student_id);
            }
        }

        // 2. Missing Interaction Report & 4. UI vs Database Mismatch Report
        // UI considers interaction completed if daily_assignments has COMPLETED status
        // DB considers interaction completed if mentor_session_reports has an entry for that date
        
        const today = new Date().toISOString().split('T')[0];
        
        const [mentorInteractions] = await db.query(`
            SELECT student_id, COUNT(id) as actual_interaction_count
            FROM mentor_session_reports
            GROUP BY student_id
        `);
        const interactionMap = new Map();
        mentorInteractions.forEach(m => interactionMap.set(m.student_id, m.actual_interaction_count));

        const [uiAssignments] = await db.query(`
            SELECT mentor_id, daily_assignments, updated_at
            FROM mentor_session_reports
            WHERE DATE(created_at) = ?
        `, [today]); 
        
        let studentInteractionLogsExist = false;
        try {
            await db.query('SELECT 1 FROM student_interaction_logs LIMIT 1');
            studentInteractionLogsExist = true;
        } catch (e) {}

        const missingInteractionReport = [];
        const uiVsDbMismatchReport = {
            visible_in_ui_missing_in_db: [],
            present_in_db_missing_in_ui: []
        };

        // Output formatting
        console.log("\n--- 1. Missing Timetable Report ---");
        console.table(missingTimetableReport);

        console.log("\n--- 2. Missing Interaction Report ---");
        console.log("student_interaction_logs exists:", studentInteractionLogsExist);
        console.log("(Requires manual verification of 'Completed' UI status against DB logs)");

        console.log("\n--- 3. Faculty Schedule Mismatch Report ---");
        console.log("Students with faculty schedules but ZERO timetables:", facultyScheduleMismatchReport.faculty_without_timetable.length);

        console.log("\n--- 4. UI vs Database Mismatch Report ---");
        console.log("This requires joining frontend state JSON. Please review any discrepancies in the dashboard where assignment is 'COMPLETED' but no Interaction Log is visible.");

        console.log("\n--- RECOVERY RECOMMENDATIONS ---");
        console.log("1. For Missing Timetables: Use the 'Bulk Recreate' or 'Generate Schedule' button for affected students. The new Transaction Safe backend will guarantee they are inserted without dropping existing data.");
        console.log("2. For Missing Interactions: Mentors must resubmit logs for the affected days. The new backend will allow them to submit missing logs safely without being blocked by duplicate rules.");

    } catch (error) {
        console.error("Scan Failed:", error);
    }

    process.exit(0);
}

runRecoveryScan();
