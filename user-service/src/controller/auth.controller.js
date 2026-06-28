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

    const sessionToken = await authService.createSession(user);

    // Clear the OTP session cookie
    res.clearCookie("otpSessionId");

    res.cookie("sessionToken", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
        success: true,
        message: "Email verified and account created successfully",
        user,
    });
});

// ─── Login ────────────────────────────────────────────────────────────────────

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new BadRequestError("Email and password are required");
    }

    const user = await authService.login(email, password);
    const sessionToken = await authService.createSession(user);

    res.cookie("sessionToken", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }).status(200).json({
        success: true,
        message: "Logged in successfully",
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        },
    });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

exports.logout = asyncHandler(async (req, res) => {
    const token = req.cookies?.sessionToken;

    if (token) {
        const RedisClient = require("../config/redis");
        const redis = RedisClient.getInstance();
        await redis.del(`session:${token}`);
    }

    res.clearCookie("sessionToken").status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});