import express from 'express';
import { withAuth } from '#routes/utils/compose.js';
import permissions from '#config/permissions.js';
import Booking from '#modules/booking/booking.model.js';
import Transaction from '#modules/transaction/transaction.model.js';
import Customer from '#modules/customer/customer.model.js';
import Parlour from '#modules/parlour/parlour.model.js';

const router = express.Router();

// Overview KPIs
router.get('/overview', ...withAuth(permissions.analytics.overview), async (req, res, next) => {
  try {
    const today = new Date();
    const dayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalBookings,
      todaysBookings,
      totalRevenue,
      todaysRevenue,
      totalCustomers,
      totalParlours,
      pendingBookings,
    ] = await Promise.all([
      Booking.countDocuments({}),
      Booking.countDocuments({ createdAt: { $gte: dayStart, $lt: dayEnd } }),
      Transaction.aggregate([
        { $match: { type: 'income' } },
        { $group: { _id: null, sum: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'income', createdAt: { $gte: dayStart, $lt: dayEnd } } },
        { $group: { _id: null, sum: { $sum: '$amount' } } },
      ]),
      Customer.countDocuments({}),
      Parlour.countDocuments({ isActive: true }),
      Booking.countDocuments({ status: 'pending' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totals: {
          bookings: totalBookings,
          customers: totalCustomers,
          parlours: totalParlours,
          revenue: (totalRevenue[0]?.sum || 0),
        },
        today: {
          bookings: todaysBookings,
          revenue: (todaysRevenue[0]?.sum || 0),
        },
        operational: {
          pendingBookings,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});



export default router;


