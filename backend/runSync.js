const db = require('./config/db');
const { forceSync } = require('./controllers/aoeController');

async function run() {
    try {
        console.log("Starting force sync...");
        // Mock req and res
        const req = {};
        const res = {
            status: (code) => ({
                json: (data) => console.log(code, data)
            })
        };
        await forceSync(req, res);
        console.log("Sync complete! Now verifying database...");
        
        const [usersStuds] = await db.query('SELECT COUNT(*) as c FROM users WHERE role="student"');
        const [studs] = await db.query('SELECT COUNT(*) as c FROM students');
        
        const [usersFacs] = await db.query('SELECT COUNT(*) as c FROM users WHERE role="faculty"');
        const [facs] = await db.query('SELECT COUNT(*) as c FROM faculties');
        
        console.log(`Users (Student role): ${usersStuds[0].c} -> Students table: ${studs[0].c}`);
        console.log(`Users (Faculty role): ${usersFacs[0].c} -> Faculties table: ${facs[0].c}`);
        
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}
run();
