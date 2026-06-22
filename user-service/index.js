const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { config } = require('./src/config');
const logger = require('./src/config/logger')

const { corsMiddleware } = require('./src/middlewares/cors.middleware')
const errorHandler = require('./src/middlewares/error.middleware');
const { reqLogger } = require('./src/middlewares/req.middleware');

const authRoutes = require('./src/routes/auth.route');

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(reqLogger);
app.use(cookieParser());
app.use(express.json());
app.use("/api/v1/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Hello from index.js of user-service");
});

app.get("/health",(req,res)=>{
  res.status(200).json({
    message:"ok"
  })
})

app.use(errorHandler); 
const startServer = async () => {
    try {
        const server = app.listen(config.PORT, () => {
            logger.info(
                `${config.SERVICE_NAME} is running on http://localhost:${config.PORT}`
            );
            logger.info(
                `Redis is running on ${config.REDIS_URL}`
            );
            logger.info(
                `PostgreSQL is running on ${config.DATABASE_URL}`
            );
        });
    } catch (error) {
        logger.error("Failed to Start Server", error);
        process.exit(1);
    }
};

startServer();