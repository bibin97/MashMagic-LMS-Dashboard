const db = require('./config/db');

async function fixCorruptedAssignments() {
    try {
        console.log("Starting script...");
        const connection = await db.getConnection();
        const [allAssignments] = await connection.query('SELECT id, assignments, date FROM daily_assignments');
        
        let updateCount = 0;
        for (let record of allAssignments) {
            let assignments = record.assignments;
            if (typeof assignments === 'string') {
                try { assignments = JSON.parse(assignments); } catch(e) { continue; }
            }
            
            if (!Array.isArray(assignments)) continue;

            let updated = false;
            const updatedAssignments = assignments.map(a => {
                // If student is Niranjana (id 187) and is PENDING, mark as COMPLETED
                if (a.id == 187 && a.status === 'PENDING') {
                    updated = true;
                    return { ...a, status: 'COMPLETED' };
                }
                return a;
            });

            if (updated) {
                await connection.query(
                    'UPDATE daily_assignments SET assignments = ? WHERE id = ?',
                    [JSON.stringify(updatedAssignments), record.id]
                );
                console.log(`Fixed record ID: ${record.id} on date: ${record.date}`);
                updateCount++;
            }
        }
        
        console.log(`Finished fixing. Updated ${updateCount} records.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixCorruptedAssignments();
