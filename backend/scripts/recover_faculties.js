const db = require('../config/db');

async function recoverFaculties() {
    console.log("Starting Data Recovery Script for Faculties...");
    try {
        // 1. Find all active faculty users
        const [users] = await db.query(`
            SELECT id as user_id, name, email, phone_number, role, status 
            FROM users 
            WHERE role = 'faculty' AND status = 'active'
        `);
        console.log(`Found ${users.length} active faculty users.`);

        let recoveredCount = 0;
        let skippedCount = 0;
        let ambiguousCount = 0;

        for (const user of users) {
            // 2. Check strict matches in faculties table
            const [facMatches] = await db.query(`
                SELECT id, user_id, email, phone_number, name 
                FROM faculties 
                WHERE user_id = ? OR email = ?
            `, [user.user_id, user.email]);

            if (facMatches.length === 0) {
                // No match found -> Must be created!
                console.log(`[MISSING] Auto-healing faculty record for: ${user.name} (${user.email}, ID: ${user.user_id})`);
                
                try {
                    // Start transaction for safe insertion
                    await db.query('START TRANSACTION');

                    // Double-check no one slipped in with the same email
                    const [dupCheck] = await db.query('SELECT id FROM faculties WHERE email = ?', [user.email]);
                    if (dupCheck.length > 0) {
                        throw new Error('Duplicate email detected during insertion');
                    }

                    // Reconstruct from users table
                    await db.query(`
                        INSERT INTO faculties (user_id, name, email, phone_number, status, subject) 
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [user.user_id, user.name, user.email, user.phone_number, 'active', null]);

                    await db.query('COMMIT');
                    console.log(`[SUCCESS] Faculty recovered: ${user.name}`);
                    recoveredCount++;
                } catch (insertErr) {
                    await db.query('ROLLBACK');
                    console.error(`[ERROR] Failed to auto-heal faculty ${user.name}:`, insertErr.message);
                }
            } else if (facMatches.length === 1) {
                // Exactly 1 match found, meaning they already exist.
                // Just in case, update user_id if it's missing but email matched.
                const fac = facMatches[0];
                if (!fac.user_id) {
                    console.log(`[LINKING] Found unlinked faculty record for ${fac.email}. Linking to user_id ${user.user_id}...`);
                    await db.query('UPDATE faculties SET user_id = ? WHERE id = ?', [user.user_id, fac.id]);
                }
                skippedCount++;
            } else {
                // Ambiguity safeguard! Multiple matches.
                console.warn(`[AMBIGUOUS] Multiple faculty records match user ${user.name} (${user.email}). Manual review required.`);
                console.warn(`Matches:`, facMatches);
                ambiguousCount++;
            }
        }

        console.log("-----------------------------------------");
        console.log("Recovery Summary:");
        console.log(`Total Active Faculty Users Checked: ${users.length}`);
        console.log(`Recovered / Auto-healed: ${recoveredCount}`);
        console.log(`Already existed / Skipped: ${skippedCount}`);
        console.log(`Ambiguous / Needs review: ${ambiguousCount}`);
        console.log("-----------------------------------------");

    } catch (e) {
        console.error("FATAL SCRIPT ERROR:", e);
    } finally {
        process.exit(0);
    }
}

recoverFaculties();
