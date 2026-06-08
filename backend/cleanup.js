const db = require('./config/db');

async function cleanup() {
    try {
        console.log("Starting cleanup...");
        // Delete duplicates where grade is NULL and there is another record with the same user_id that has grade NOT NULL
        // Or simply: keep the record with MAX(id) for each user_id. 
        // Wait, the one created by AOE has grade, course etc. The one created by auto-sync has ONLY user_id, name, email, contact, status.
        // So the BAD one is the one with `grade IS NULL`.
        
        const [duplicates] = await db.query(`
            SELECT user_id, COUNT(*) as c FROM students GROUP BY user_id HAVING c > 1
        `);
        console.log("Found duplicate user_ids: ", duplicates.length);

        if (duplicates.length > 0) {
            const [result] = await db.query(`
                DELETE FROM students 
                WHERE user_id IN (
                    SELECT user_id FROM (
                        SELECT user_id FROM students GROUP BY user_id HAVING COUNT(*) > 1
                    ) as t
                ) 
                AND grade IS NULL
            `);
            console.log("Deleted duplicate empty rows:", result.affectedRows);
        }

        console.log("Cleanup complete!");
    } catch (e) {
        console.error("Cleanup error:", e);
    } finally {
        process.exit(0);
    }
}

cleanup();
