const express = require('express');
const router = express.Router();
const { register, login, mentorSignup, facultySignup, checkSuperAdminExists, updateProfilePic, changePassword, updateProfile, debugUser } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/signup/mentor', mentorSignup);
router.post('/signup/faculty', facultySignup);
router.get('/check-super-admin', checkSuperAdminExists);
router.put('/update-profile-pic', requireAuth, updateProfilePic);
router.put('/change-password', requireAuth, changePassword);
router.put('/update-profile', requireAuth, updateProfile);
router.get('/debug-user', debugUser); // TEMP DEBUG - REMOVE AFTER FIX
router.post('/reset-debug-password', require('../controllers/authController').resetDebugPassword); // TEMP DEBUG

module.exports = router;

module.exports = router;
