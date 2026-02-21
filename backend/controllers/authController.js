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

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Please provide name, email and password" });
        }

        const existingUser = await User.findByIdentifier(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Identifier already registered" });
        }

        // Check if this is the first user in the system
        const [users] = await db.query('SELECT COUNT(*) as count FROM users');
        const isFirstUser = users[0].count === 0;
        const initialStatus = isFirstUser ? 'active' : 'pending';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            status: initialStatus
        });

        const message = isFirstUser
            ? "Registration successful. First user account is effectively Active."
            : "Registration successful. Please wait for Admin approval.";

        res.status(201).json({
            success: true,
            message,
            userId,
            status: initialStatus
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = await User.create({
            name,
            phone_number,
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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = await User.create({
            name,
            phone_number,
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
        const identifier = reqIdentifier || email || phone_number;

        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: "Please provide credentials" });
        }

        const user = await User.findByIdentifier(identifier);
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        if (user.status === 'pending') {
            return res.status(403).json({ success: false, message: "Account pending approval. Please contact Admin." });
        }
        if (user.status === 'rejected') {
            return res.status(403).json({ success: false, message: "Account application rejected." });
        }
        if (user.status !== 'active') {
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
