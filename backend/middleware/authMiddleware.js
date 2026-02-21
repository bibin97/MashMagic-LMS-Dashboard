const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const requireAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token (verify user still exists and is active)
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(401).json({ success: false, message: "Not authorized, user not found" });
            }

            if (user.status !== 'active') {
                return res.status(403).json({ success: false, message: "Account is inactive/blocked" });
            }

            req.user = user;
            return next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: "Not authorized, no token" });
    }
};

module.exports = { requireAuth };
