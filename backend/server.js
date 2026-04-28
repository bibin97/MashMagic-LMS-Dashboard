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
                
                `CREATE TABLE IF NOT EXISTS student_daily_updates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    mentor_id INT NOT NULL,
                    data_content TEXT,
                    registration_date DATE,
                    registration_time TIME,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`,
                `CREATE TABLE IF NOT EXISTS admin_notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    message TEXT NOT NULL,
                    is_read TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`
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
