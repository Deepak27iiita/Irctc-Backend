require("dotenv").config();

const config = {
  SERVICE_NAME: require("../../package.json").name,

  PORT: Number(process.env.PORT) || 4001,

  NODE_ENV: process.env.NODE_ENV || "development",

  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgres://admin:password@localhost:5432/user_service_database",

  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:4000",

  KAFKA_BROKER: process.env.KAFKA_BROKER || "localhost:9092",

  OTP_TTL: process.env.OTP_TTL || 300,

  OTP_RATE_MAX_PER_HOUR: process.env.OTP_RATE_MAX_PER_HOUR || 5,

  OTP_MAX_VERIFY_ATTEMPTS: process.env.OTP_MAX_VERIFY_ATTEMPTS || 5,

  HMAC_SECRET: process.env.HMAC_SECRET || "irctc_hmac_secret_key_default",

  MAIL_SEND: process.env.MAIL_SEND || "no-reply@irctc-demo.com",
};

module.exports = {
  config,
};
