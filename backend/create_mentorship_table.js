const db = require('./config/db');

async function createMentorshipTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS mentorship_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                mentor_id INT NOT NULL,
                session_date DATE NOT NULL,
                main_issue VARCHAR(255),
                secondary_issue VARCHAR(255),
                weak_subject VARCHAR(255),
                consistency_rating INT,
                focus_rating INT,
                effort_level INT,
                homework_status VARCHAR(50),
                action_type VARCHAR(255),
                action_details TEXT,
                follow_up_required BOOLEAN DEFAULT FALSE,
                follow_up_date DATE,
                priority VARCHAR(50),
                student_status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await db.query(query);
        console.log('Mentorship logs table created successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error creating mentorship logs table:', err);
        process.exit(1);
    }
}

createMentorshipTable();
