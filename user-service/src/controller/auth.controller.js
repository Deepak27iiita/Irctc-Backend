const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../utils/error");
const authService = require("../services/auth.service");
const { config } = require("../config");

// ─── Send OTP ────────────────────────────────────────────────────────────────

exports.sendOtp = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        throw new BadRequestError("Please fill all the fields");
    }
    if (password !== confirmPassword) {
        throw new BadRequestError("Password and Confirm Password do not match");
    }

    const { otpSessionId } = await authService.sendOtp(firstName, lastName, email, password);

    res.cookie("otpSessionId", otpSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: config.OTP_TTL * 1000,
    }).status(200).json({
        message: "OTP sent successfully",
        otpSessionId,
    });
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────

exports.verifyOtp = asyncHandler(async (req, res) => {
    const { otp } = req.body;

    // Accept otpSessionId from cookie or request body
    const otpSessionId = req.cookies?.otpSessionId || req.body.otpSessionId;

    if (!otpSessionId) {
        throw new BadRequestError("OTP session ID is required", "OTP_SESSION_MISSING");
    }
    if (!otp) {
        throw new BadRequestError("OTP is required", "OTP_MISSING");
    }

    const { user } = await authService.verifyOtp(otpSessionId, otp);

    // Clear the OTP session cookie
    res.clearCookie("otpSessionId");

    res.status(201).json({
        success: true,
        message: "Email verified and account created successfully",
        user,
    });
});