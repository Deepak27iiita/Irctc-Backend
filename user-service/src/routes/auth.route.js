const express = require('express');

const router = express.Router();

const { sendOtp, verifyOtp, login, logout } = require('../controller/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// POST /api/v1/auth/send-otp   → request OTP (step 1 of registration)
router.post('/send-otp', sendOtp);

// POST /api/v1/auth/verify-otp → verify OTP & create account (step 2)
router.post('/verify-otp', verifyOtp);

// POST /api/v1/auth/login → login with email and password
router.post('/login', login);

// POST /api/v1/auth/logout → logout
router.post('/logout', authenticate, logout);

module.exports = router;