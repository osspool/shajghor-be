import express from 'express';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { bookingSchemas, bookingAvailabilityQuery } from './schemas.js';
import { validate } from '#common/middlewares/validate.js';
import bookingController from './booking.controller.js';
import permissions from '#config/permissions.js';

const router = express.Router();

router.use('/', createCrudRouter(bookingController, {
  tag: 'Booking',
  basePath: '/bookings',
  schemas: bookingSchemas,
  auth: {
    list: permissions.bookings.list,
    get: permissions.bookings.get,
    create: permissions.bookings.create,
    update: permissions.bookings.update,
    remove: permissions.bookings.remove,
  },
  additionalRoutes: [
    {
      method: 'get',
      path: '/availability',
      handler: bookingController.getAvailability,
      schemas: { query: bookingAvailabilityQuery },
      summary: 'Get available start times for a date based on capacity and slots',
      authRoles: permissions.bookings.list,
    },
  ],
}));
export default router;


