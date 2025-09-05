// src/config/sections/app.config.js
import { parseInt, parseDelimitedString, parseBoolean } from '../utils.js'; // Assume utils file created below

const corsOriginsFromEnv = parseDelimitedString(process.env.CORS_ORIGIN);

export default {
  app: {
    port: parseInt(process.env.PORT, 8080),
    url:
      process.env.APP_URL || `http://localhost:${process.env.PORT || 8080}`,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    jwtSecret: process.env.JWT_SECRET,
    jwtRefresh: process.env.JWT_REFRESH_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    deviceWebhookSecret: process.env.DEVICE_WEBHOOK_SECRET,
    disableCronJobs: parseBoolean(process.env.DISABLE_CRON_JOBS),
  },

  rateLimit: {
    windowMs: parseInt(
      process.env.RATE_LIMIT_WINDOW_MS,
      15 * 60 * 1000
    ), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 100), // limit each IP to 100 requests per windowMs
  },

  cors: {
    origin:
      corsOriginsFromEnv.length > 0
        ? corsOriginsFromEnv
        : ["*", "http://localhost:3000"],
    credentials: true,
  },
};