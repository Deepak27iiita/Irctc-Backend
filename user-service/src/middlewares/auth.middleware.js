// src/middlewares/auth.middleware.js

const crypto = require("crypto");
const { UnauthorizedError } = require("../utils/error");
const { config } = require("../config");
const RedisClient = require("../config/redis");

const redis = RedisClient.getInstance();

/**
 * Verifies a session token stored in an HTTP-only cookie.
 * Attach token via cookie: sessionToken=<token>
 *
 * On success, attaches `req.user` = { id, email, ... }
 */
const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.sessionToken;

        if (!token) {
            throw new UnauthorizedError("Authentication required. No session token found.");
        }

        // Look up session in Redis
        const raw = await redis.get(`session:${token}`);

        if (!raw) {
            throw new UnauthorizedError("Session expired or invalid. Please log in again.");
        }

        const session = JSON.parse(raw);

        // Attach user info to request
        req.user = session;

        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Optional auth — does NOT throw if unauthenticated.
 * Attaches req.user if valid session exists, otherwise req.user = null.
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.sessionToken;

        if (!token) {
            req.user = null;
            return next();
        }

        const raw = await redis.get(`session:${token}`);

        req.user = raw ? JSON.parse(raw) : null;

        next();
    } catch (err) {
        req.user = null;
        next();
    }
};

module.exports = {
    authenticate,
    optionalAuthenticate,
};
