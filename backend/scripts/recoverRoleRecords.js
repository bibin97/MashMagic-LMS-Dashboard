/**
 * Faculty & Mentor Recovery Script
 * 
 * Finds users with role = 'faculty' or 'mentor' and status = 'active'
 * but no matching record in the faculties / mentors table.
 * Then auto-repairs by creating the missing records.
 * 
 * Run from backend folder: node scripts/recoverRoleRecords.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function main() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== FACULTY & MENTOR RECOVERY REPORT ===\n');

    // ── 1. Find orphaned faculty users ──────────────────────────────────────────
    const [orphanedFaculties] = await db.query(`
        SELECT u.id as user_id, u.name, u.email, u.phone_number, u.status
        FROM users u
        LEFT JOIN faculties f ON f.email = u.email
        WHERE u.role = 'faculty'
          AND u.status = 'active'
          AND f.id IS NULL
    `);

    console.log(`[FACULTY] Found ${orphanedFaculties.length} active faculty user(s) with no matching faculties record:`);
    orphanedFaculties.forEach(u => console.log(`  - ${u.name} | ${u.email} | user_id: ${u.user_id}`));

    // ── 2. Find orphaned mentor users ────────────────────────────────────────────
    const [orphanedMentors] = await db.query(`
        SELECT u.id as user_id, u.name, u.email, u.phone_number, u.status
        FROM users u
        LEFT JOIN mentors m ON m.email = u.email
        WHERE u.role = 'mentor'
          AND u.status = 'active'
          AND m.id IS NULL
    `);

    console.log(`\n[MENTOR] Found ${orphanedMentors.length} active mentor user(s) with no matching mentors record:`);
    orphanedMentors.forEach(u => console.log(`  - ${u.name} | ${u.email} | user_id: ${u.user_id}`));

    // ── 3. Auto-repair faculty records ───────────────────────────────────────────
    if (orphanedFaculties.length > 0) {
        console.log('\n[REPAIR] Creating missing faculty records...');
        for (const u of orphanedFaculties) {
            try {
                const [[emailDup]] = await db.query('SELECT id FROM faculties WHERE email = ? LIMIT 1', [u.email]);
                if (emailDup) {
                    await db.query('UPDATE faculties SET status = "active" WHERE id = ?', [emailDup.id]);
                    console.log(`  ✔ Re-activated existing faculty record (id=${emailDup.id}) for ${u.name}`);
                } else {
                    await db.query(
                        'INSERT INTO faculties (name, email, phone_number, status, subject) VALUES (?, ?, ?, "active", NULL)',
                        [u.name, u.email, u.phone_number]
                    );
                    console.log(`  ✔ Created new faculty record for ${u.name}`);
                }
            } catch (err) {
                console.error(`  ✗ Failed to repair ${u.name}: ${err.message}`);
            }
        }
    }

    // ── 4. Auto-repair mentor records ─────────────────────────────────────────────
    if (orphanedMentors.length > 0) {
        console.log('\n[REPAIR] Creating missing mentor records...');
        for (const u of orphanedMentors) {
            try {
                const [[emailDup]] = await db.query('SELECT id FROM mentors WHERE email = ? LIMIT 1', [u.email]);
                if (emailDup) {
                    await db.query('UPDATE mentors SET status = "active" WHERE id = ?', [emailDup.id]);
                    console.log(`  ✔ Re-activated existing mentor record (id=${emailDup.id}) for ${u.name}`);
                } else {
                    await db.query(
                        'INSERT INTO mentors (name, email, phone_number, status) VALUES (?, ?, ?, "active")',
                        [u.name, u.email, u.phone_number]
                    );
                    console.log(`  ✔ Created new mentor record for ${u.name}`);
                }
            } catch (err) {
                console.error(`  ✗ Failed to repair ${u.name}: ${err.message}`);
            }
        }
    }

    if (orphanedFaculties.length === 0 && orphanedMentors.length === 0) {
        console.log('\n✅ No orphaned records found. Database is consistent.');
    }

    console.log('\n=== RECOVERY COMPLETE ===');
    await db.end();
}

main().catch(err => {
    console.error('Recovery script failed:', err.message);
    process.exit(1);
});
