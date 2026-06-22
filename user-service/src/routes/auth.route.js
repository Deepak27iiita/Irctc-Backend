const express = require('express');

const router = express.Router();

const { sendOtp, verifyOtp } = require('../controller/auth.controller');

// POST /api/v1/auth/send-otp   → request OTP (step 1 of registration)
router.post('/send-otp', sendOtp);

// POST /api/v1/auth/verify-otp → verify OTP & create account (step 2)
router.post('/verify-otp', verifyOtp);

module.exports = router;