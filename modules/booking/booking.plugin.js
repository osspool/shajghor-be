import createCrudRouter from '#routes/utils/createCrudRouter.js';
import fp from 'fastify-plugin';
import bookingSchemas, { bookingAvailabilityQuery, bookingAvailabilityResponse } from './booking.schemas.js';
import bookingController from './booking.controller.js';
import permissions from '#config/permissions.js';

async function bookingPlugin(fastify, opts) {
  await fastify.register(async (instance) => {
    createCrudRouter(instance, bookingController, {
      tag: 'Booking', basePath: '/bookings', schemas: bookingSchemas, auth: permissions.bookings,
      additionalRoutes: [
        { method: 'get', path: '/availability', handler: bookingController.getAvailability, schemas: { query: bookingAvailabilityQuery }, summary: 'Get available start times for a date based on capacity and slots', authRoles: permissions.bookings.list,
          responseSchema: bookingAvailabilityResponse
        },
      ],
    });
  }, { prefix: '/bookings' });
}

export default fp(bookingPlugin, { name: 'booking-plugin' });


