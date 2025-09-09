import Transaction from './transaction.model.js';
import fp from 'fastify-plugin';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import transactionSchemas, { receivePaymentBody, refundPaymentBody, bookingPaymentSummaryQuery } from './schemas.js';
import permissions from '#config/permissions.js';
import { receivePayment, capitalInjection, ownerWithdrawal, refundPayment, bookingPaymentSummary } from './transaction.handlers.js';

async function transactionPlugin(fastify, opts) {
  const { controller } = createServiceAndController(Transaction);
  await fastify.register(async (instance) => {
    createCrudRouter(instance, controller, {
      tag: 'Transaction', basePath: '/transactions', schemas: transactionSchemas, auth: permissions.transactions,
      additionalRoutes: [
        { method: 'post', path: '/capital-injection', handler: capitalInjection, schemas: { body: transactionSchemas.create?.body }, summary: 'Record capital injection (income)', authRoles: permissions.transactions.create, response: 'message' },
        { method: 'post', path: '/owner-withdrawal', handler: ownerWithdrawal, schemas: { body: transactionSchemas.create?.body }, summary: 'Record owner withdrawal (expense)', authRoles: permissions.transactions.create, response: 'message' },
        { method: 'post', path: '/receive-payment', handler: receivePayment, schemas: { body: receivePaymentBody }, summary: 'Receive a customer payment (booking or other income)', authRoles: permissions.transactions.create },
        { method: 'post', path: '/refund', handler: refundPayment, schemas: { body: refundPaymentBody }, summary: 'Refund customer payment for a booking', authRoles: permissions.transactions.update },
        { method: 'get', path: '/booking-payment-summary', handler: bookingPaymentSummary, schemas: { query: bookingPaymentSummaryQuery }, summary: 'Get booking payment summary (paid/refunded/balance)', authRoles: permissions.transactions.list, response: 'item' },
      ],
    });
  }, { prefix: '/transactions' });
}

export default fp(transactionPlugin, { name: 'transaction-plugin' });


