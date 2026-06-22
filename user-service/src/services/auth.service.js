const { ConflictError, BadRequestError, NotFoundError } = require("../utils/error");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { sendOtpEmail, verifyOtpEmail } = require("../utils/email");
const { generateAndStoreOtp } = require("../utils/otp");
const { config } = require("../config");
const RedisClient = require("../config/redis");
const crypto = require("crypto");

const redis = RedisClient.getInstance();

// ─── Send OTP ────────────────────────────────────────────────────────────────

const sendOtp = async (firstName, lastName, email, password) => {
    const findExistingUser = await prisma.user.findUnique({
        where: { email }
    });
    if (findExistingUser) {
        throw new ConflictError("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const meta = { firstName, lastName, email, password: hashedPassword };

    const { otp, otpSessionId } = await generateAndStoreOtp(meta);
    await sendOtpEmail(email, otp);
    return { otpSessionId };
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────

const verifyOtp = async (otpSessionId, otp) => {
    const sessionKey = `otp:${otpSessionId}`;
    const raw = await redis.get(sessionKey);

    if (!raw) {
        throw new BadRequestError("OTP session expired or invalid", "OTP_SESSION_INVALID");
    }

    const session = JSON.parse(raw);

    // Verify HMAC
    const expectedHash = crypto
        .createHmac("sha256", config.HMAC_SECRET)
        .update(`${session.email}:${otp}`)
        .digest("hex");

    if (expectedHash !== session.hash) {
        throw new BadRequestError("Invalid OTP", "OTP_INVALID");
    }

    // Check user doesn't already exist (race condition guard)
    const existingUser = await prisma.user.findUnique({
        where: { email: session.email }
    });
    if (existingUser) {
        throw new ConflictError("User already registered");
    }

    // Create the user
    const user = await prisma.user.create({
        data: {
            firstName: session.firstName,
            lastName: session.lastName,
            email: session.email,
            password: session.password,
            emailVerified: true,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            emailVerified: true,
            createdAt: true,
        }
    });

    // Clean up Redis keys
    await redis.del(sessionKey);
    await redis.del(`otp:rate:${session.email}`);

    // Send welcome email
    await verifyOtpEmail({ email: session.email });

    return { user };
};

module.exports = {
    sendOtp,
    verifyOtp,
};