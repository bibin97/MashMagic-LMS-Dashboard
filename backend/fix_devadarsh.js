const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
    console.log("Connecting to Database...");
    const db = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        const todayDate = new Date();
        const today = todayDate.toISOString().split('T')[0];
        
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split('T')[0];

        console.log(`Checking assignments for dates: ${today} and ${yesterday}`);

        const [existing] = await db.query(
            'SELECT id, assignments, date FROM daily_assignments WHERE date IN (?, ?)',
            [today, yesterday]
        );

        let fixedCount = 0;

        for (const row of existing) {
            let assignments = row.assignments;
            if (typeof assignments === 'string') {
                try {
                    assignments = JSON.parse(assignments);
                } catch (e) {
                    continue;
                }
            }

            let changed = false;
            const updatedAssignments = assignments.map(a => {
                // If student name has DEVADARSH and status is COMPLETED
                if (a.name && a.name.toUpperCase().includes('DEVADARSH') && a.status === 'COMPLETED') {
                    console.log(`Found DEVADARSH in assignments for ${row.date}. Resetting to PENDING.`);
                    changed = true;
                    return { ...a, status: 'PENDING' };
                }
                return a;
            });

            if (changed) {
                await db.query(
                    'UPDATE daily_assignments SET assignments = ? WHERE id = ?',
                    [JSON.stringify(updatedAssignments), row.id]
                );
                fixedCount++;
            }
        }

        if (fixedCount > 0) {
            console.log("Successfully fixed Devadarsh! He should now be back in Awaiting interactions.");
        } else {
            console.log("Devadarsh not found in COMPLETED status for today or yesterday.");
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.end();
        console.log("Done.");
    }
}

fix();
