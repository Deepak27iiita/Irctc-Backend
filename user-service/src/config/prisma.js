// src/config/prisma.js

const { PrismaClient } = require("@prisma/client");
const { config } = require(".");

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: config.DATABASE_URL,
      },
    },
  });

if (config.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
