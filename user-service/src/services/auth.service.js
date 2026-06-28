const { ConflictError, BadRequestError, NotFoundError, TooManyRequestsError, UnauthorizedError } = require("../utils/error");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { sendOtpEmail, verifyOtpEmail } = require("../utils/email");
const { generateAndStoreOtp, ATTEMPT_MAX } = require("../utils/otp");
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

    const attemptsKey = `otp:attempts:${session.email}`;
    const attemptsCount = parseInt(await redis.get(attemptsKey) || '0', 10);

    if (attemptsCount >= ATTEMPT_MAX) {
        throw new TooManyRequestsError("Too many attempts to verify OTP");
    }

    // Verify HMAC
    const expectedHash = crypto
        .createHmac("sha256", config.HMAC_SECRET)
        .update(`${session.email}:${otp}`)
        .digest("hex");

    if (expectedHash !== session.hash) {
        await redis.incr(attemptsKey);
        await redis.expire(attemptsKey, parseInt(config.OTP_TTL || '300', 10));
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
    await redis.del(attemptsKey);

    // Send welcome email
    await verifyOtpEmail({ email: session.email });

    return { user };
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async (email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.password) {
        throw new UnauthorizedError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new UnauthorizedError("Invalid email or password");
    }

    return user;
};

// ─── Create Session ───────────────────────────────────────────────────────────

const createSession = async (user) => {
    const token = crypto.randomBytes(32).toString("hex");
    const sessionData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
    };
    
    // Store in redis for 7 days (604800 seconds)
    await redis.setex(`session:${token}`, 604800, JSON.stringify(sessionData));
    
    return token;
};

module.exports = {
    sendOtp,
    verifyOtp,
    login,
    createSession,
};