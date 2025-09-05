// src/middlewares/authMiddleware.js
import User from "#modules/auth/user.model.js";
import jwt from "jsonwebtoken";
import config from "#config/index.js";
import createError from "http-errors";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return next(createError(401, "Access denied: missing or invalid Authorization header"));
    }

    const decoded = jwt.verify(token, config.app.jwtSecret);
    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("organization");

    if (!user) {
      return next(createError(401, "User not found for provided token"));
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(createError(403, "Invalid or expired token"));
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, "Unauthorized"));
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : req.user.roles
      ? [req.user.roles]
      : [];

    if (userRoles.includes("superadmin")) return next();

    const isAuthorized = allowedRoles.length === 0
      ? true
      : allowedRoles.some((role) => userRoles.includes(role));

    if (!isAuthorized) {
      return next(createError(403, "Forbidden: You do not have access to this resource"));
    }
    return next();
  };
};

export default authMiddleware;
export { authorize };
