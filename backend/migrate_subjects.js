const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed_data.json'), 'utf8'));

async function migrate() {
    const conn = pool;

    console.log("Connected to DB. Creating table if not exists...");
    
    // Create the student_subjects table
    await conn.query(`
        CREATE TABLE IF NOT EXISTS student_subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            subject_name VARCHAR(255) NOT NULL,
            allocated_hours DECIMAL(10,2) DEFAULT 0,
            historical_consumed_hours DECIMAL(10,2) DEFAULT 0,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
    `);
    console.log("Table created.");

    // Loop through seed data
    for (const student of data) {
        // Find student by name
        const [rows] = await conn.query('SELECT id FROM students WHERE name LIKE ?', [`%${student.name}%`]);
        if (rows.length === 0) {
            console.log(`Student not found: ${student.name}`);
            continue;
        }

        const studentId = rows[0].id;
        
        // Update total hours for the student
        await conn.query('UPDATE students SET total_hours = ? WHERE id = ?', [student.total_hours, studentId]);

        // Insert subjects
        for (const sub of student.subjects) {
            // Check if already exists to avoid duplicates if run multiple times
            const [existing] = await conn.query('SELECT id FROM student_subjects WHERE student_id = ? AND subject_name = ?', [studentId, sub.name]);
            if (existing.length === 0) {
                await conn.query(
                    'INSERT INTO student_subjects (student_id, subject_name, allocated_hours, historical_consumed_hours) VALUES (?, ?, ?, ?)',
                    [studentId, sub.name, sub.allocated, sub.consumed]
                );
                console.log(`Inserted ${sub.name} for ${student.name}`);
            } else {
                // Update
                await conn.query(
                    'UPDATE student_subjects SET allocated_hours = ?, historical_consumed_hours = ? WHERE id = ?',
                    [sub.allocated, sub.consumed, existing[0].id]
                );
                console.log(`Updated ${sub.name} for ${student.name}`);
            }
        }
    }

    console.log("Migration complete.");
    process.exit(0);
}

migrate().catch(console.error);
