const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');

const path = require('path');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

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

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
};

startServer();
