const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fixTimes() {
    let db;
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log("Connected to DB. Fixing times...");

        // Devadarsh: 7:30 PM (19:30:00)
        await db.query(`UPDATE timetable t JOIN students s ON t.student_id = s.id SET t.start_time = '19:30:00', t.end_time = '20:30:00' WHERE s.name LIKE '%devadarsh%' AND t.start_time LIKE '10:00:%'`);
        await db.query(`UPDATE academic_schedule a JOIN students s ON a.student_id = s.id SET a.start_time = '19:30:00', a.end_time = '20:30:00' WHERE s.name LIKE '%devadarsh%' AND a.start_time LIKE '10:00:%'`);

        // Ryan: 7:30 PM (19:30:00)
        await db.query(`UPDATE timetable t JOIN students s ON t.student_id = s.id SET t.start_time = '19:30:00', t.end_time = '20:30:00' WHERE s.name LIKE '%ryan%' AND t.start_time LIKE '07:30:%'`);
        await db.query(`UPDATE academic_schedule a JOIN students s ON a.student_id = s.id SET a.start_time = '19:30:00', a.end_time = '20:30:00' WHERE s.name LIKE '%ryan%' AND a.start_time LIKE '07:30:%'`);

        // Zenha: 1:00 PM (13:00:00)
        await db.query(`UPDATE timetable t JOIN students s ON t.student_id = s.id SET t.start_time = '13:00:00', t.end_time = '14:00:00' WHERE s.name LIKE '%zenha%' AND t.start_time LIKE '01:00:%'`);
        await db.query(`UPDATE academic_schedule a JOIN students s ON a.student_id = s.id SET a.start_time = '13:00:00', a.end_time = '14:00:00' WHERE s.name LIKE '%zenha%' AND a.start_time LIKE '01:00:%'`);

        console.log("Times fixed successfully!");

    } catch(e) {
        console.error("Error fixing times:", e);
    } finally {
        if (db) await db.end();
        process.exit();
    }
}

fixTimes();
