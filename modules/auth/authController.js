// src/controllers/authController.js

import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "#config/index.js";
import { sendEmail } from "#utils/email.js";
import User from "#modules/auth/user.model.js";
import { generateTokens } from "#utils/generateToken.js";


// Register User
const register = async (request, reply) => {
  // return reply.code(404).send({ 
  //   message: "Registration is currently disabled. Please contact admin to get access." 
  // });

  const { name, email, password, role="customer" } = request.body;
  // console.log(request.body);

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return reply.code(400).send({ message: "User already exists" });
    }

    const user = new User({
      name,
      email,
      password,
    });
    await user.save();

    return reply.code(201).send({ message: "User registered" });
  } catch (error) {
    console.log(error);
    return reply.code(500).send({ message: "Error registering user" });
  }
};

// Login User
const login = async (request, reply) => {
  const { email, password } = request.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return reply.code(401).send({ message: "Invalid email or password" });
    }

    const { token, refreshToken } = generateTokens(user);

    // Build user object dynamically
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
    };

    // Only include vendorId if it exists
    if (user.vendorId) {
      userData.vendorId = user.vendorId;
    }

    const payload = { token, refreshToken, user: userData };
    return reply.code(200).send(payload);
  } catch (error) {
    return reply.code(500).send({ message: 'Login failed' });
  }
};

// Refresh Token
const refreshToken = async (request, reply) => {
  const { token: refreshToken } = request.body;

  if (!refreshToken) return reply.code(401).send({ message: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refreshToken, config.app.jwtRefresh);
    const user = await User.findById(decoded.id);

    if (!user) return reply.code(403).send({ message: 'Invalid refresh token' });

    const { token, refreshToken: newRefreshToken } = generateTokens(user);

    const payload = { token, refreshToken: newRefreshToken };
    return reply.code(200).send(payload);
  } catch (error) {
    return reply.code(401).send({ message: 'Invalid refresh token' });
  }
};

// Check if User Exists
const getProfile = async (request, reply) => {
  try {
    const { email } = request.body;
    const user = await User.findOne({ email }).select("-password");
    if (!user) return reply.code(404).send({ message: 'User not found' });
    return reply.code(200).send(user);
  } catch (error) {
    return reply.code(500).send({ message: 'Failed to fetch profile' });
  }
};

// Forgot Password
const forgotPassword = async (request, reply) => {
  const { email } = request.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return reply.code(404).send({ message: 'User not found' });

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Create HTML template for password reset email
    const htmlTemplate = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Thank you!</p>
    `;

    // Create plain text version
    const textVersion = `
      Password Reset Request
      
      You requested a password reset. Click the following link to reset your password:
      ${resetLink}
      
      This link will expire in 1 hour.
      
      If you didn't request this, please ignore this email.
      
      Thank you!
    `;

    // Send email using the sendEmail service
    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      text: textVersion,
      html: htmlTemplate
  });

    return reply.code(200).send({ message: "Password reset email sent" });
  } catch (error) {
    return reply.code(500).send({ message: 'Failed to send reset email' });
  }
};

// Reset Password
const resetPassword = async (request, reply) => {
  const { token, newPassword } = request.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return reply.code(400).send({ message: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return reply.code(200).send({ message: "Password has been reset" });
  } catch (error) {
    return reply.code(500).send({ message: 'Failed to reset password' });
  }
};


// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (request, reply) => {
  const user = await User.findById(request.params.id);
  
  if (user) {
    user.role = request.body.role || user.role;
    const updatedUser = await user.save();
    const payload = { _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email };
    return reply.send(payload);
  } else {
    return reply.code(404).send({ message: 'User not found' });
  }
};


export {
  register,
  login,
  refreshToken, // Export with original name
  getProfile,
  forgotPassword,
  resetPassword,
  updateUserRole
};
