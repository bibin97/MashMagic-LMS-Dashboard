const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const db = require('../config/db');

// @desc    Register a new user (Student / Admin default)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const targetRole = role || 'student';

        if (!name || (!email && !req.body.phone_number) || !password) {
            return res.status(400).json({ success: false, message: "Please provide all required fields" });
        }

        const identifier = email || req.body.phone_number;
        const existingUser = await User.findByIdentifier(identifier);
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Identifier already registered" });
        }

        // ONE-TIME SUPER ADMIN LOGIC:
        const [superAdmins] = await db.query('SELECT id FROM users WHERE role = "super_admin"');

        if (targetRole === 'super_admin' && superAdmins.length > 0) {
            return res.status(403).json({
                success: false,
                message: "Super Admin already exists. Manual creation of Super Admin is restricted."
            });
        }

        const trimmedPassword = password.trim();
        const normalizedEmail = email ? email.toLowerCase().trim() : null;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(trimmedPassword, salt);

        // If no super_admin exists and targetRole is super_admin, make it active
        // Otherwise, if any other role, make it pending
        let status = 'pending';
        let isApproved = 0;
        let isActive = 0;
        let finalRole = targetRole;

        if (superAdmins.length === 0 && (targetRole === 'super_admin' || targetRole === 'admin')) {
            status = 'active';
            isApproved = 1;
            isActive = 1;
            finalRole = 'super_admin';
        }

        const userPayload = {
            name,
            email: normalizedEmail,
            phone_number: req.body.phone_number ? req.body.phone_number.trim() : null,
            place: req.body.place || null,
            password: hashedPassword,
            role: finalRole,
            status,
            isApproved,
            isActive
        };

        // Add additional student fields if role is student
        if (finalRole === 'student') {
            Object.assign(userPayload, {
                grade: req.body.grade || null,
                subject: req.body.subject || null,
                course: req.body.course || null,
                hour: req.body.hour || null,
                mentor_name: req.body.mentor_name || null,
                faculty_name: req.body.faculty_name || null,
                next_installment_date: req.body.next_installment_date || null,
                time_table: req.body.time_table ? JSON.stringify(req.body.time_table) : null
            });
        }

        const userId = await User.create(userPayload);

        res.status(201).json({
            success: true,
            message: status === 'active'
                ? "Super Admin created successfully."
                : `${finalRole.replace('_', ' ')} registration request submitted. Please wait for Admin approval.`,
            userId,
            role: finalRole,
            status
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Check if Super Admin exists
// @route   GET /api/auth/check-super-admin
const checkSuperAdminExists = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id FROM users WHERE role = "super_admin" LIMIT 1');
        res.status(200).json({
            success: true,
            exists: rows.length > 0
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mentor Signup
// @route   POST /api/auth/signup/mentor
const mentorSignup = async (req, res) => {
    try {
        const { name, phone_number, place, password } = req.body;

        if (!name || !phone_number || !password) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const existingUser = await User.findByIdentifier(phone_number);
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Phone number already registered" });
        }

        const trimmedPassword = password.trim();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(trimmedPassword, salt);

        const userId = await User.create({
            name,
            phone_number: phone_number.trim(),
            place,
            password: hashedPassword,
            role: 'mentor',
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: "Mentor account request submitted. Please wait for Admin approval.",
            userId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Faculty Signup
// @route   POST /api/auth/signup/faculty
const facultySignup = async (req, res) => {
    try {
        const { name, phone_number, place, password } = req.body;

        if (!name || !phone_number || !password) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const existingUser = await User.findByIdentifier(phone_number);
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Phone number already registered" });
        }

        const trimmedPassword = password.trim();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(trimmedPassword, salt);

        const userId = await User.create({
            name,
            phone_number: phone_number.trim(),
            place,
            password: hashedPassword,
            role: 'faculty',
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: "Faculty account request submitted. Please wait for Admin approval.",
            userId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, phone_number, identifier: reqIdentifier, password } = req.body;
        const identifier = (reqIdentifier || email || phone_number)?.trim();

        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: "Please provide credentials" });
        }

        // Try lookup with normalized identifier
        const normalizedIdentifier = identifier.includes('@') ? identifier.toLowerCase() : identifier;
        const user = await User.findByIdentifier(normalizedIdentifier);

        if (!user) {
            console.log(`[LOGIN FAILED] Identifier NOT FOUND: ${normalizedIdentifier}`);
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const trimmedPassword = password.trim();
        const isMatch = await bcrypt.compare(trimmedPassword, user.password);

        if (!isMatch) {
            console.log(`[LOGIN FAILED] Password mismatch for: ${normalizedIdentifier}`);
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        console.log(`[LOGIN SUCCESS] User: ${identifier} | Role: ${user.role}`);

        // Approval Check - must be first
        if (user.isApproved !== 1) {
            return res.status(403).json({ success: false, message: "Account pending Admin approval. Please contact support." });
        }

        // Status Check
        if (user.status === 'pending') {
            return res.status(403).json({ success: false, message: "Account pending approval. Please contact Admin." });
        }

        if (user.status === 'rejected') {
            return res.status(403).json({ success: false, message: "Account application rejected." });
        }

        if (user.status !== 'active' || user.isActive === 0) {
            return res.status(403).json({ success: false, message: "Account is inactive/blocked" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            success: true,
            token,
            role: user.role,
            user: {
                id: user.id,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.register = register;
exports.mentorSignup = mentorSignup;
exports.facultySignup = facultySignup;
exports.login = login;
exports.checkSuperAdminExists = checkSuperAdminExists;
