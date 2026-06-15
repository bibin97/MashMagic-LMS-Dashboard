/**
 * Urgent Data Repair Script
 * 
 * Target: Naveena Anto C, Noor Jahan, Amrutha B, Sameeha ES
 * Requirement: Create missing records in `faculties` table if they exist as active faculties in `users` table.
 * Constraints:
 * 1. Do NOT modify users table.
 * 2. Do NOT change credentials.
 * 3. Do NOT create duplicate users.
 * 4. Create only missing faculty records.
 * 5. Map info from users table.
 * 6. Check email existence before insert.
 * 7. Skip if exists.
 * 8. Wrap in transaction.
 * 9. Rollback entire operation if any insert fails.
 * 10. Return detailed report.
 * 
 * Run: node backend/scripts/urgentRepair.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function main() {
    const targetEmails = [
        'naveenabatty@gmail.com',
        'noorjahank999@gmail.com',
        'amruthabinbubi98@gmail.com',
        'sameehaeahya333@gmail.com'
    ];

    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== URGENT DATA REPAIR STARTED ===\n');

    let report = {
        inserted: [],
        skipped: [],
        failed: []
    };

    // Begin strict transaction
    await db.beginTransaction();
    console.log('Transaction STARTED.');

    try {
        for (const email of targetEmails) {
            // Check if user exists as active faculty in users table
            const [users] = await db.query(
                "SELECT id as user_id, name, email, phone_number FROM users WHERE email = ? AND role = 'faculty' AND status = 'active'", 
                [email]
            );

            if (users.length === 0) {
                report.skipped.push({ email, reason: 'Not found in users table as active faculty' });
                continue;
            }

            const user = users[0];

            // Check if they already exist in faculties table by email OR user_id
            const [existingFaculties] = await db.query(
                "SELECT id FROM faculties WHERE email = ? OR user_id = ?",
                [email, user.user_id]
            );

            if (existingFaculties.length > 0) {
                report.skipped.push({ email, reason: `Already exists in faculties table (id: ${existingFaculties[0].id})` });
                continue;
            }

            // Insert into faculties table
            console.log(`Attempting to insert faculty record for ${user.name} (${user.email})...`);
            
            await db.query(
                "INSERT INTO faculties (user_id, name, email, phone_number, status, subject) VALUES (?, ?, ?, ?, 'active', NULL)",
                [user.user_id, user.name, user.email, user.phone_number]
            );

            report.inserted.push({ email, name: user.name, user_id: user.user_id });
        }

        // If we reach here without errors, commit the transaction
        await db.commit();
        console.log('Transaction COMMITTED successfully.\n');

    } catch (error) {
        // If ANY error occurs during the loop, rollback everything
        await db.rollback();
        console.error('\n[CRITICAL ERROR] Transaction ROLLED BACK due to error:', error.message);
        
        report.failed.push({ error: error.message });
        report.inserted = []; // Clear inserted array since everything was rolled back
    }

    // Output Report
    console.log('=== REPAIR REPORT ===');
    console.log(`Total Targets: ${targetEmails.length}`);
    console.log(`Inserted: ${report.inserted.length}`);
    report.inserted.forEach(i => console.log(`  + ${i.name} (${i.email}) - Linked to User ID ${i.user_id}`));
    
    console.log(`Skipped: ${report.skipped.length}`);
    report.skipped.forEach(s => console.log(`  ~ ${s.email} - ${s.reason}`));
    
    if (report.failed.length > 0) {
        console.log(`Failed: ${report.failed.length}`);
        report.failed.forEach(f => console.log(`  ! Error: ${f.error}`));
    }

    await db.end();
}

main().catch(err => {
    console.error('Fatal script error:', err.message);
    process.exit(1);
});
