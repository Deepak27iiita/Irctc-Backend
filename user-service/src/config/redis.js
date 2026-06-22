// src/config/redis.js

const Redis = require('ioredis');
const { config } = require('.');
const logger = require('./logger');

class RedisClient {
    static instance;
    static isConnected = false;

    constructor() {
        // prevent direct instantiation
    }

    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new Redis(config.REDIS_URL, {
                maxRetriesPerRequest: 3,

                retryStrategy(times) {
                    if (times > 20) {
                        logger.error('Redis max retry attempts reached. Giving up.');
                        return null; // stop retrying
                    }
                    const delay = Math.min(times * 50, 2000);

                    logger.warn(
                        `Retrying Redis connection attempt ${times}. Delay: ${delay}ms`
                    );

                    return delay;
                }
            });

            RedisClient.setupEventListeners();
        }

        return RedisClient.instance;
    }

    static setupEventListeners() {
        RedisClient.instance.on('connect', () => {
            RedisClient.isConnected = true;
            logger.info('Connected to Redis');
        });

        RedisClient.instance.on('error', (error) => {
            RedisClient.isConnected = false;
            logger.error('Redis connection error', error);
        });

        RedisClient.instance.on('close', () => {
            RedisClient.isConnected = false;
            logger.warn('Redis connection closed');
        });

        RedisClient.instance.on('reconnecting', () => {
            logger.warn('Reconnecting to Redis...');
        });

        RedisClient.instance.on('ready', () => {
            RedisClient.isConnected = true;
            logger.info('Redis is ready');
        });
    }

    static async disconnect() {
        if (RedisClient.instance) {
            await RedisClient.instance.quit();
            RedisClient.instance = null;
            RedisClient.isConnected = false;

            logger.info('Redis disconnected');
        }
    }

    static getConnectionStatus() {
        return RedisClient.isConnected;
    }
}

module.exports = RedisClient;