const db = require('./config/db');

async function resetToDeep() {
    try {
        console.log("Setting all students to High priority (DEEP session)...");
        const [result1] = await db.query("UPDATE students SET priority_category = 'High'");
        console.log(`Updated ${result1.affectedRows} students.`);

        console.log("Clearing today's testing assignments so they regenerate perfectly...");
        const [result2] = await db.query("DELETE FROM daily_assignments");
        console.log(`Cleared ${result2.affectedRows} daily assignments.`);
        
        console.log("Success! Everyone will start fresh in DEEP today.");
    } catch (e) {
        console.log("Error:", e.message);
    }
    process.exit(0);
}

resetToDeep();
