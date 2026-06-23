require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'MashMagic2026!',
            database: process.env.DB_NAME || 'mashmagic'
        });
        const [tt] = await connection.query("DESCRIBE timetable;");
        console.log("Timetable Schema:");
        console.table(tt);

        const [fs] = await connection.query("DESCRIBE faculty_sessions;");
        console.log("\nFaculty Sessions Schema:");
        console.table(fs);
        
        await connection.end();
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
