const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');

const path = require('path');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/register', require('./routes/registrationRoutes'));
app.use('/api/mentor-head', require('./routes/mentorHeadRoutes'));
app.use('/api/mentor', require('./routes/mentorRoutes'));
app.use('/api/academic-head', require('./routes/academicHeadRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/student', studentRoutes);
app.use('/api/mentor-logs', require('./routes/mentorLogRoutes'));
app.use('/api/faculty-tracking', require('./routes/facultyTrackingRoutes'));

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: "Welcome to MashMagic Edu Tech API v2 - Permissions Fixed" });
});

// Test Connection and Start Server
const PORT = process.env.PORT || 5000;

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${req.method} ${req.url}:`, err);
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
});

const startServer = async () => {
    try {
        // Test database connection
        const [rows] = await pool.query('SELECT 1');
        console.log('✅ Database connected successfully');

        // Automatic DB Schema Expansion for live environments
        try {
            console.log('🔄 Checking database scheme for newly added features...');
            
            // Core Tables Creation
            const coreTables = [
                `CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE,
                    phone_number VARCHAR(50) UNIQUE,
                    place VARCHAR(255),
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    isApproved TINYINT(1) DEFAULT 0,
                    isActive TINYINT(1) DEFAULT 1,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`,
                `CREATE TABLE IF NOT EXISTS students (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    phone_number VARCHAR(50),
                    place VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'active',
                    isApproved TINYINT(1) DEFAULT 0,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`
            ];

            for (const tableQuery of coreTables) {
                await pool.query(tableQuery);
            }

            const migrations = [
                'ALTER TABLE users ADD COLUMN role VARCHAR(50) NULL;',
                'ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT "pending";',
                'ALTER TABLE users ADD COLUMN isApproved TINYINT(1) DEFAULT 0;',
                'ALTER TABLE users ADD COLUMN isActive TINYINT(1) DEFAULT 1;',
                'ALTER TABLE users ADD COLUMN grade VARCHAR(100) NULL;',
                'ALTER TABLE users ADD COLUMN subject VARCHAR(100) NULL;',
                'ALTER TABLE users ADD COLUMN course VARCHAR(100) NULL;',
                'ALTER TABLE users ADD COLUMN hour VARCHAR(50) NULL;',
                'ALTER TABLE users ADD COLUMN mentor_name VARCHAR(100) NULL;',
                'ALTER TABLE users ADD COLUMN faculty_name VARCHAR(100) NULL;',
                'ALTER TABLE users ADD COLUMN next_installment_date VARCHAR(50) NULL;',
                'ALTER TABLE users ADD COLUMN time_table JSON NULL;',
                'ALTER TABLE users ADD COLUMN enrollment_type VARCHAR(100) NULL;',
                'ALTER TABLE users ADD COLUMN badge VARCHAR(50) NULL;',
                'ALTER TABLE users ADD COLUMN permissions JSON DEFAULT NULL;',
                'ALTER TABLE users ADD COLUMN meeting_link VARCHAR(255) NULL;',
                'ALTER TABLE users ADD COLUMN phone_number VARCHAR(50) NULL;',
                'ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL;',
                'ALTER TABLE users ADD COLUMN registeredBy INT NULL;',
                'ALTER TABLE users ADD COLUMN faculty_id_card VARCHAR(100) NULL;',
                'ALTER TABLE users ADD COLUMN section VARCHAR(100) NULL;',
                'ALTER TABLE users ADD COLUMN syllabus VARCHAR(100) NULL;',
                'ALTER TABLE users ADD COLUMN languages_proficiency JSON NULL;',
                'ALTER TABLE users ADD COLUMN qualification VARCHAR(255) NULL;',
                'ALTER TABLE users ADD COLUMN experience VARCHAR(100) NULL;',
                'ALTER TABLE users ADD COLUMN availability VARCHAR(255) NULL;',
                'ALTER TABLE users ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 0.00;',
                'ALTER TABLE users ADD COLUMN teaching_mode VARCHAR(50) NULL;',
                'ALTER TABLE users ADD COLUMN joining_date DATE NULL;',
                'ALTER TABLE users ADD COLUMN remarks TEXT NULL;',
                'ALTER TABLE users ADD COLUMN profile_pic TEXT NULL;',
                
                'ALTER TABLE students ADD COLUMN badge VARCHAR(50) NULL;',
                'ALTER TABLE students ADD COLUMN enrollment_type VARCHAR(100) NULL;',
                'ALTER TABLE students ADD COLUMN course_completed BOOLEAN DEFAULT FALSE;',
                'ALTER TABLE students ADD COLUMN attendance_percentage DECIMAL(5,2) DEFAULT 0.00;',
                'ALTER TABLE students ADD COLUMN performance_status VARCHAR(50) DEFAULT "Green";',
                'ALTER TABLE students ADD COLUMN mentor_id INT NULL;',
                'ALTER TABLE students ADD COLUMN email VARCHAR(255) NULL;',
                'ALTER TABLE students ADD COLUMN password VARCHAR(255) NULL;',
                'ALTER TABLE students ADD COLUMN user_id INT NULL;',
                'ALTER TABLE students ADD COLUMN meeting_link VARCHAR(255) NULL;',
                'ALTER TABLE students ADD COLUMN isApproved TINYINT(1) DEFAULT 0;',
                'ALTER TABLE students ADD COLUMN registration_number VARCHAR(100) NULL;',
                'ALTER TABLE students ADD COLUMN faculty_hourly_rate DECIMAL(10,2) DEFAULT 0.00;',
                'ALTER TABLE students ADD COLUMN subjects_json JSON NULL;',
                'ALTER TABLE students ADD COLUMN grade VARCHAR(100) NULL;',
                'ALTER TABLE students ADD COLUMN syllabus VARCHAR(100) NULL;',
                'ALTER TABLE students ADD COLUMN subject VARCHAR(100) NULL;',
                'ALTER TABLE students ADD COLUMN course VARCHAR(100) NULL;',
                'ALTER TABLE students ADD COLUMN hour VARCHAR(50) NULL;',
                'ALTER TABLE students ADD COLUMN mentor_name VARCHAR(100) NULL;',
                'ALTER TABLE students ADD COLUMN faculty_id INT NULL;',
                'ALTER TABLE students ADD COLUMN faculty_name VARCHAR(100) NULL;',
                'ALTER TABLE students ADD COLUMN onboarding_status VARCHAR(50) DEFAULT "pending";',
                'ALTER TABLE students ADD COLUMN next_installment_date VARCHAR(50) NULL;',
                'ALTER TABLE students ADD COLUMN time_table JSON NULL;',
                'ALTER TABLE students ADD COLUMN registeredBy INT NULL;',
                'ALTER TABLE students ADD COLUMN profile_pic TEXT NULL;',
                'ALTER TABLE students ADD COLUMN contact VARCHAR(50) NULL;',
                'ALTER TABLE students ADD COLUMN admission_date DATE NULL;',
                'ALTER TABLE students ADD COLUMN school_name VARCHAR(255) NULL;',
                'ALTER TABLE students ADD COLUMN preferred_language VARCHAR(100) NULL;',
                'ALTER TABLE students ADD COLUMN country VARCHAR(100) NULL;',
                'ALTER TABLE students ADD COLUMN total_fees DECIMAL(10,2) DEFAULT 0.00;',
                'ALTER TABLE students ADD COLUMN total_paid DECIMAL(10,2) DEFAULT 0.00;',
                
                `CREATE TABLE IF NOT EXISTS mentor_session_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    mentor_id INT NOT NULL,
                    date DATE NOT NULL,
                    connection_method ENUM('WhatsApp Chat', 'Voice Note', 'Voice Call', 'Video Call') NOT NULL,
                    session_start_time DATETIME NOT NULL,
                    session_end_time DATETIME NOT NULL,
                    session_duration_minutes INT NULL,
                    focus_level INT,
                    energy_level ENUM('Low', 'Normal', 'High'),
                    stress_level ENUM('Low', 'Medium', 'High'),
                    homework_status ENUM('Completed', 'Partial', 'Not Done'),
                    revision_done BOOLEAN,
                    doubts_present BOOLEAN,
                    main_issue ENUM('No Issue', 'Low Focus', 'Distraction', 'Procrastination', 'Homework Pending', 'Concept Difficulty', 'Low Motivation'),
                    secondary_issue VARCHAR(255),
                    weak_subject VARCHAR(100),
                    problem_clarity ENUM('Clear', 'Partial', 'Not Clear'),
                    action_type ENUM('Complete Homework', 'Revise Topic', 'Start on Time', 'Reduce Distraction', 'Practice Questions', 'Doubt Clarification'),
                    action_detail TEXT,
                    action_specific BOOLEAN,
                    student_engagement ENUM('High', 'Medium', 'Low'),
                    understanding_after_session ENUM('Improved', 'Same', 'Not Improved'),
                    previous_task_status ENUM('Completed', 'Not Completed', 'Not Checked'),
                    followup_required BOOLEAN,
                    followup_date DATE,
                    student_status ENUM('Critical', 'Needs Attention', 'On Track'),
                    session_quality_rating INT,
                    interaction_files JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`,
                'ALTER TABLE mentor_session_logs ADD COLUMN session_duration_minutes INT NULL;',

                `CREATE TABLE IF NOT EXISTS student_daily_updates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    mentor_id INT NOT NULL,
                    data_content TEXT,
                    registration_date DATE,
                    registration_time TIME,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`,

                `CREATE TABLE IF NOT EXISTS faculty_class_updates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    faculty_id INT NOT NULL,
                    subject VARCHAR(100),
                    date DATE,
                    class_duration VARCHAR(50),
                    topic_taught TEXT,
                    homework_given BOOLEAN,
                    homework_details TEXT,
                    attention_level ENUM('High', 'Medium', 'Low'),
                    participation_level ENUM('Active', 'Moderate', 'Passive'),
                    understanding_level ENUM('Good', 'Average', 'Poor'),
                    issue_flag BOOLEAN DEFAULT FALSE,
                    issue_type ENUM('Concept difficulty', 'Not attentive', 'Homework not done', 'Slow learning', 'Behaviour issue'),
                    faculty_files JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`,

                `CREATE TABLE IF NOT EXISTS mentor_reviews (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    faculty_log_id INT NOT NULL,
                    mentor_id INT NOT NULL,
                    todays_observation ENUM('Normal', 'Needs Attention', 'Issue Detected'),
                    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY (faculty_log_id)
                );`,

                `CREATE TABLE IF NOT EXISTS mentor_faculty_interactions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    faculty_log_id INT NOT NULL,
                    student_id INT NOT NULL,
                    mentor_id INT NOT NULL,
                    subject VARCHAR(100),
                    faculty_name VARCHAR(100),
                    date DATE,
                    connection_method ENUM('Call', 'WhatsApp'),
                    main_issue TEXT,
                    issue_details TEXT,
                    teacher_feedback TEXT,
                    root_cause ENUM('Concept gap', 'Carelessness', 'Lack of practice', 'Distraction'),
                    action_plan TEXT,
                    responsibility ENUM('Student', 'Mentor', 'Faculty', 'Parent'),
                    followup_required BOOLEAN,
                    followup_date DATE,
                    issue_understood ENUM('Yes', 'Partial', 'No'),
                    interaction_quality_rating INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`,

                `CREATE TABLE IF NOT EXISTS admin_notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    message TEXT NOT NULL,
                    related_id INT NULL,
                    action_type VARCHAR(100) NULL,
                    is_read TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`,
                'ALTER TABLE admin_notifications ADD COLUMN related_id INT NULL;',
                'ALTER TABLE faculty_sessions ADD COLUMN duration VARCHAR(50) NULL;',
                'ALTER TABLE admin_notifications ADD COLUMN action_type VARCHAR(100) NULL;',

                `CREATE TABLE IF NOT EXISTS faculty_schedules (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    faculty_id INT NOT NULL,
                    student_id INT NOT NULL,
                    subject VARCHAR(100),
                    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                    start_time TIME,
                    end_time TIME,
                    hourly_rate DECIMAL(10,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`,

                // Performance Indexes
                'CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);',
                'CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);',
                'CREATE INDEX IF NOT EXISTS idx_students_mentor_id ON students(mentor_id);',
                'CREATE INDEX IF NOT EXISTS idx_students_faculty_id ON students(faculty_id);',
                'CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);'
            ];
            for (const migration of migrations) {
                try {
                    await pool.query(migration);
                    // console.log(`✅ Applied migration: ${migration.split(' ')[4] || 'Table Creation'}`);
                } catch (err) {
                    // Ignore duplicate column errors
                    if (err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_DUP_KEY' && err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
                        // console.log(`ℹ️ Migration info: ${err.message}`);
                    }
                }
            }
            console.log('✅ Database schema is up to date');
        } catch (migErr) {
            console.log('Migration check suppressed:', migErr.message);
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
};

startServer();
