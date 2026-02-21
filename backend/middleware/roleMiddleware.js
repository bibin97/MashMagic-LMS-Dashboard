const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.some(role => role.toLowerCase() === req.user.role?.toLowerCase())) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user?.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { requireRole };
