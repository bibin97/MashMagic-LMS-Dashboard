const db = require('./config/db');

async function check() {
    try {
        const [u] = await db.query('SELECT role, status, count(*) as count FROM users GROUP BY role, status');
        console.log("USERS SUMMARY:", JSON.stringify(u, null, 2));

        const [m] = await db.query('SELECT status, count(*) as count FROM mentors GROUP BY status');
        console.log("MENTORS SUMMARY:", JSON.stringify(m, null, 2));

        const [f] = await db.query('SELECT status, count(*) as count FROM faculties GROUP BY status');
        console.log("FACULTIES SUMMARY:", JSON.stringify(f, null, 2));

        const [md] = await db.query('SELECT id, name, status FROM mentors LIMIT 5');
        console.log("MENTORS DATA:", JSON.stringify(md, null, 2));

        const [fd] = await db.query('SELECT id, name, status FROM faculties LIMIT 5');
        console.log("FACULTIES DATA:", JSON.stringify(fd, null, 2));

    } catch (e) {
        console.error("DB_CHECK_ERR:", e.message);
    } finally {
        process.exit(0);
    }
}

check();
