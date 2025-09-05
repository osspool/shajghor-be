// src/config/sections/email.config.js
import { parseInt, parseBoolean } from '../utils.js'; // Assume utils file created below

export default {
  email: {
    from: process.env.EMAIL_FROM,
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 587),
      secure: parseBoolean(process.env.SMTP_SECURE),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  },
};