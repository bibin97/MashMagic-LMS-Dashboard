const db = require('./config/db.js');

async function recover() {
    try {
        console.log("Starting recovery for Zayan and Sidhan...");
        
        // Find Ramshu Fathima
        const [mentors] = await db.query("SELECT id FROM mentors WHERE name LIKE '%Ramshu%' LIMIT 1");
        if (mentors.length === 0) {
            console.log("Mentor Ramshu Fathima not found in mentors table.");
            return process.exit(1);
        }
        const mentorId = mentors[0].id;
        console.log("Found Mentor Ramshu Fathima ID:", mentorId);

        // Find users with Zayan or Sidhan in name
        const [users] = await db.query("SELECT id, name, email, phone_number FROM users WHERE (name LIKE '%zayan%' OR name LIKE '%sidhan%') AND role = 'student'");
        if (users.length === 0) {
            console.log("No Zayan or Sidhan found in users table.");
            return process.exit(1);
        }

        console.log(`Found ${users.length} matching students in users table.`);

        for (const user of users) {
            // Ensure they exist in students table and update mentor_id
            const [students] = await db.query("SELECT id FROM students WHERE user_id = ? OR contact = ? OR name = ?", [user.id, user.phone_number, user.name]);
            
            if (students.length > 0) {
                console.log(`Updating existing student record for ${user.name}...`);
                await db.query("UPDATE students SET mentor_id = ?, user_id = ?, status = 'active' WHERE id = ?", [mentorId, user.id, students[0].id]);
            } else {
                console.log(`Recreating student record for ${user.name}...`);
                await db.query("INSERT INTO students (user_id, name, email, contact, mentor_id, status) VALUES (?, ?, ?, ?, ?, 'active')", 
                    [user.id, user.name, user.email || null, user.phone_number || null, mentorId]);
            }
        }

        console.log("Recovery complete! Zayan and Sidhan should now be assigned to Ramshu Fathima.");
        process.exit(0);
    } catch (e) {
        console.error("Error during recovery:", e);
        process.exit(1);
    }
}

recover();
