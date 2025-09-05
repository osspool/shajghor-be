// src/routes/index.js
import express from "express";
import authRoutes from "./auth.js";
import usersCrudRoutes from "#modules/auth/routes.js";
import jobRoutes from "#modules/job/routes.js";
import organizationRoutes from "#modules/organization/routes.js";
import parlourRoutes from "#modules/parlour/routes.js";
import serviceRoutes from "#modules/service/routes.js";
import customerRoutes from "#modules/customer/routes.js";
import bookingRoutes from "#modules/booking/routes.js";
import transactionRoutes from "#modules/transaction/routes.js";
import subscriptionRoutes from "#modules/subscription/routes.js";
import employeeRoutes from "#modules/employee/routes.js";
import archiveRoutes from "#modules/archive/routes.js";


const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", usersCrudRoutes);
router.use("/jobs", jobRoutes);
router.use("/organizations", organizationRoutes);
router.use("/parlours", parlourRoutes);
router.use("/services", serviceRoutes);
router.use("/customers", customerRoutes);
router.use("/bookings", bookingRoutes);
router.use("/transactions", transactionRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/employees", employeeRoutes);
router.use("/archives", archiveRoutes);



export default router;
