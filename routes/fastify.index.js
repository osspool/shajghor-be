import organizationRoutes from '#modules/organization/organization.plugin.js';
import parlourRoutes from '#modules/parlour/routes.js';
import serviceRoutes from '#modules/service/routes.js';
import customerRoutes from '#modules/customer/customer.plugin.js';
import bookingRoutes from '#modules/booking/booking.plugin.js';
import transactionRoutes from '#modules/transaction/routes.js';
import subscriptionRoutes from '#modules/subscription/routes.js';
import archiveRoutes from '#modules/archive/archive.plugin.js';
import analyticsRoutes from '#modules/analytics/analytics.plugin.js';
import usersRoutes from '#modules/auth/auth.plugin.js';
import exportRoutes from '#modules/export/export.plugin.js';
import jobRoutes from '#modules/job/job.plugin.js';
import employeeRoutes from '#modules/employee/employee.plugin.js';

export default async function fastifyRoutes(fastify, opts) {
  await fastify.register(usersRoutes);
  await fastify.register(exportRoutes);
  await fastify.register(jobRoutes);
  // Organization
  await fastify.register(organizationRoutes);

  // Parlour including additional routes
  await fastify.register(parlourRoutes);

  // Service
  await fastify.register(serviceRoutes);

  // Customer
  await fastify.register(customerRoutes);

  // Employee
  await fastify.register(employeeRoutes);

  // Booking, include availability
  await fastify.register(bookingRoutes);

  // Transaction with extras
  await fastify.register(transactionRoutes);

  // Subscription
  await fastify.register(subscriptionRoutes);

  // Archive
  await fastify.register(archiveRoutes);

  // Analytics
  await fastify.register(analyticsRoutes, { prefix: '/analytics' });
}


