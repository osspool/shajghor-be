// src/routes/auth.js
import express from "express";
import { validate } from "#common/middlewares/validate.js";
import { registerPath, registerTag } from "#common/docs/apiDocs.js";
import { registerZod } from "#common/docs/swaggerHelpers.js";
import { loginBody, registerBody, refreshBody, forgotBody, resetBody } from "#modules/auth/schemas.js";
import { forgotPassword, login, refreshToken, register, resetPassword } from "#modules/auth/authController.js";

// No auth middleware needed for these endpoints

const router = express.Router();

// Schemas for validation
const loginSchema = { body: loginBody };
const registerSchema = { body: registerBody };
const refreshSchema = { body: refreshBody };
const forgotSchema = { body: forgotBody };
const resetSchema = { body: resetBody };

router.get("/", (req, res) => {
  res.json({ message: "Auth route" });
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refreshToken);
// password reset
router.post("/forgot-password", validate(forgotSchema), forgotPassword);
router.post("/reset-password", validate(resetSchema), resetPassword);

// Swagger registrations
registerPath("/auth/login", "post", {
  tags: ["Auth"],
  summary: "Login",
  requestBody: { required: true, content: { "application/json": { schema: registerZod("AuthLogin", loginSchema.body) } } },
  responses: { 200: { description: "Login success" } },
});
registerPath("/auth/register", "post", {
  tags: ["Auth"],
  summary: "Register",
  requestBody: { required: true, content: { "application/json": { schema: registerZod("AuthRegister", registerSchema.body) } } },
  responses: { 200: { description: "Register success" } },
});
registerPath("/auth/refresh", "post", {
  tags: ["Auth"],
  summary: "Refresh JWT",
  requestBody: { required: true, content: { "application/json": { schema: registerZod("AuthRefresh", refreshSchema.body) } } },
  responses: { 200: { description: "New tokens" } },
});
registerPath("/auth/forgot-password", "post", {
  tags: ["Auth"],
  summary: "Forgot password",
  requestBody: { required: true, content: { "application/json": { schema: registerZod("AuthForgot", forgotSchema.body) } } },
  responses: { 200: { description: "Email sent" } },
});
registerPath("/auth/reset-password", "post", {
  tags: ["Auth"],
  summary: "Reset password",
  requestBody: { required: true, content: { "application/json": { schema: registerZod("AuthReset", resetSchema.body) } } },
  responses: { 200: { description: "Password reset" } },
});
registerTag("Auth");

export default router;
