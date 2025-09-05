// src/utils/email.js
import nodemailer from "nodemailer";
import config from "#config/index.js";

// Build transporter from config
const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: Boolean(config.email.smtp.secure),
  auth: {
    user: config.email.smtp.auth.user,
    pass: config.email.smtp.auth.pass,
  },
});

/**
 * Send an email using the configured SMTP transport
 * @param {Object} options
 * @param {string|string[]} options.to
 * @param {string} options.subject
 * @param {string} [options.text]
 * @param {string} [options.html]
 * @param {string} [options.from]
 */
export async function sendEmail({ to, subject, text, html, from }) {
  const mailOptions = {
    from: from || config.email.from || config.email.smtp.auth.user,
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
}

