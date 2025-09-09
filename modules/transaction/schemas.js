import Transaction from './transaction.model.js';
import { buildCrudSchemasFromModel } from '#common/utils/mongooseToJsonSchema.js';

const { crudSchemas } = buildCrudSchemasFromModel(Transaction, {
  output: 'json',
  query: {
    filterableFields: {
      organizationId: { type: 'string' },
      parlourId: { type: 'string' },
      type: { type: 'string' },
      method: { type: 'string' },
      category: { type: 'string' },
    },
  },
});

export const receivePaymentBody = {
  type: 'object',
  properties: {
    organizationId: { type: 'string' },
    parlourId: { type: 'string' },
    bookingId: { type: 'string' },
    customerId: { type: 'string' },
    amount: { type: 'number' },
    method: { type: 'string', enum: ['cash','bkash','nagad','bank','online'] },
    paymentDetails: {
      type: 'object',
      properties: {
        provider: { type: 'string' },
        walletNumber: { type: 'string' },
        transactionId: { type: 'string' },
        bankName: { type: 'string' },
        accountNumber: { type: 'string' },
        senderName: { type: 'string' },
      },
      additionalProperties: false,
    },
    reference: { type: 'string' },
    notes: { type: 'string' },
    idempotencyKey: { type: 'string' },
    date: { type: 'string', format: 'date-time' },
    category: { type: 'string' },
  },
  additionalProperties: false,
};

export const refundPaymentBody = {
  type: 'object',
  properties: {
    organizationId: { type: 'string' },
    parlourId: { type: 'string' },
    bookingId: { type: 'string' },
    customerId: { type: 'string' },
    amount: { type: 'number' },
    method: { type: 'string', enum: ['cash','bkash','nagad','bank','online'] },
    paymentDetails: {
      type: 'object',
      properties: {
        provider: { type: 'string' },
        walletNumber: { type: 'string' },
        transactionId: { type: 'string' },
        bankName: { type: 'string' },
        accountNumber: { type: 'string' },
        senderName: { type: 'string' },
      },
      additionalProperties: false,
    },
    reference: { type: 'string' },
    notes: { type: 'string' },
    idempotencyKey: { type: 'string' },
    date: { type: 'string', format: 'date-time' },
  },
  additionalProperties: false,
};

export const bookingPaymentSummaryQuery = { type: 'object', properties: { bookingId: { type: 'string' } }, required: ['bookingId'] };

export default crudSchemas;


