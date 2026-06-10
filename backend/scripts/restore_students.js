const db = require('../config/db');

async function restore() {
    try {
        console.log("Starting data restoration process...");

        // 1. Re-insert missing students from the users table
        const [missingUsers] = await db.query(`
            SELECT * FROM users 
            WHERE role = 'student' 
            AND id NOT IN (SELECT user_id FROM students WHERE user_id IS NOT NULL)
        `);
        
        let restored = 0;
        for (const u of missingUsers) {
            await db.query(`
                INSERT INTO students (user_id, name, email, contact, status)
                VALUES (?, ?, ?, ?, ?)
            `, [u.id, u.name, u.email, u.phone_number, u.status]);
            restored++;
        }
        console.log(`✅ Re-inserted ${restored} missing students from users table.`);
        
        // 2. Restore overwritten names in students table based on users table
        const [students] = await db.query(`SELECT id, user_id, name FROM students WHERE user_id IS NOT NULL`);
        let nameFixed = 0;
        for (const j of students) {
            const [u] = await db.query(`SELECT name FROM users WHERE id = ?`, [j.user_id]);
            if (u.length > 0 && u[0].name !== j.name) {
                await db.query(`UPDATE students SET name = ? WHERE id = ?`, [u[0].name, j.id]);
                console.log(`   - Fixed name for student ID ${j.id}: Was '${j.name}', now '${u[0].name}'`);
                nameFixed++;
            }
        }
        console.log(`✅ Restored ${nameFixed} corrupted names in students table.`);

        console.log("Restoration complete!");
        process.exit(0);
    } catch(e) {
        console.error("Restoration Error:", e);
        process.exit(1);
    }
}
restore();
