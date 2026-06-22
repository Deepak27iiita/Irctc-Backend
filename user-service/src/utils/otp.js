const RATE_MAX = parseInt(process.env.OTP_RATE_MAX) || 5;
const otpGenerator = require("otp-generator");
const { config } = require("../config");
const crypto = require("crypto");
const RedisClient = require("../config/redis");
const { TooManyRequestsError } = require("./error");

const redis = RedisClient.getInstance();
const HMAC_SECRET = config.HMAC_SECRET;
const OTP_TTL = parseInt(config.OTP_TTL) || 300;
function hmacFor(email, otp) {
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(`${email}:${otp}`)
    .digest("hex");
}

async function generateAndStoreOtp(meta) {
  const ratekey = `otp:rate:${meta.email}`;
  const sentCount = parseInt(await redis.get(ratekey)) || 0;
  if (sentCount >= RATE_MAX) {
    throw new TooManyRequestsError(
      "Too many OTP requests. Please try again later.",
      "OTP_RATE_LIMIT_EXCEEDED",
    );
  }
  const otp = otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const otpSessionId = crypto.randomUUID();
  const hash = hmacFor(meta.email, otp);

  await redis.set(
    `otp:${otpSessionId}`,
    JSON.stringify({ ...meta, hash }),
    "EX",
    OTP_TTL,
  );
  await redis.incr(ratekey);
  await redis.expire(ratekey, 3600);
  return { otp, otpSessionId };
}

module.exports = {
  generateAndStoreOtp,
};
