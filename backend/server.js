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
            const migrations = [
                'ALTER TABLE students ADD COLUMN badge VARCHAR(50) NULL;',
                'ALTER TABLE students ADD COLUMN enrollment_type VARCHAR(100) NULL;',
                'ALTER TABLE students ADD COLUMN course_completed BOOLEAN DEFAULT FALSE;',
                'ALTER TABLE students ADD COLUMN attendance_percentage DECIMAL(5,2) DEFAULT 0.00;',
                'ALTER TABLE students ADD COLUMN performance_status VARCHAR(50) DEFAULT "Green";',
                'ALTER TABLE students ADD COLUMN mentor_id INT NULL;',
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
                'ALTER TABLE students ADD COLUMN email VARCHAR(255) NULL;',
                'ALTER TABLE students ADD COLUMN password VARCHAR(255) NULL;',
                'ALTER TABLE students ADD COLUMN user_id INT NULL;',
                `CREATE TABLE IF NOT EXISTS student_daily_updates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    mentor_id INT NOT NULL,
                    data_content TEXT,
                    registration_date DATE,
                    registration_time TIME,
                    created_at TIMESTAMP DEFAULT CURRENT_VALUE
                );`
            ];
            for (const migration of migrations) {
                try {
                    await pool.query(migration);
                    console.log(`✅ Applied migration: ${migration.split(' ')[4]}`);
                } catch (err) {
                    if (err.code !== 'ER_DUP_FIELDNAME') {
                        console.log(`ℹ️ Migration skipped: ${err.message}`);
                    }
                }
            }
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
