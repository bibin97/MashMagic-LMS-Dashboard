const db = require('./config/db');

async function test() {
    try {
        const [rows] = await db.query("DESCRIBE users;");
        console.log(rows);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

test();
