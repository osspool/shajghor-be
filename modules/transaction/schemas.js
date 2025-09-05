import { z } from 'zod';
import { schemaUtils } from '#common/utils/schemaUtils.js';
import { TRANSACTION_TYPE_VALUES, TRANSACTION_CATEGORY_VALUES } from '#common/constants/enums.js';

const { objectIdStringSchema, createBaseQuerySchema, makeFilterableSchema } = schemaUtils;

export const transactionCreateBody = z.object({
  organizationId: objectIdStringSchema.optional(),
  parlourId: objectIdStringSchema,
  bookingId: objectIdStringSchema.optional(),
  customerId: objectIdStringSchema.optional(),
  handledBy: objectIdStringSchema.optional(),
  type: z.enum(TRANSACTION_TYPE_VALUES),
  category: z.enum(TRANSACTION_CATEGORY_VALUES).optional(),
  amount: z.number().min(0),
  method: z.enum(['cash', 'bkash', 'nagad', 'bank', 'online']),
  paymentDetails: z.object({
    provider: z.string().optional(),
    walletNumber: z.string().optional(),
    transactionId: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    senderName: z.string().optional(),
  }).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
  date: z.string().datetime().optional(),
});

export const transactionUpdateBody = transactionCreateBody.partial();
export const transactionGetParams = z.object({ id: objectIdStringSchema });

export const transactionListQuery = createBaseQuerySchema({
  organizationId: makeFilterableSchema(z.string(), true),
  parlourId: makeFilterableSchema(z.string(), true),
  type: makeFilterableSchema(z.string()),
  method: makeFilterableSchema(z.string()),
  category: makeFilterableSchema(z.string()),
});

export const transactionSchemas = {
  create: { body: transactionCreateBody },
  update: { body: transactionUpdateBody, params: transactionGetParams },
  get: { params: transactionGetParams },
  list: { query: transactionListQuery },
  remove: { params: transactionGetParams },
};

export const receivePaymentBody = z.object({
  organizationId: objectIdStringSchema.optional(),
  parlourId: objectIdStringSchema,
  bookingId: objectIdStringSchema.optional(),
  customerId: objectIdStringSchema.optional(),
  amount: z.number().min(0),
  method: z.enum(['cash','bkash','nagad','bank','online']),
  paymentDetails: z.object({
    provider: z.string().optional(),
    walletNumber: z.string().optional(),
    transactionId: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    senderName: z.string().optional(),
  }).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
  date: z.string().datetime().optional(),
  category: z.string().optional(),
});

export const refundPaymentBody = z.object({
  organizationId: objectIdStringSchema.optional(),
  parlourId: objectIdStringSchema,
  bookingId: objectIdStringSchema,
  customerId: objectIdStringSchema.optional(),
  amount: z.number().min(0),
  method: z.enum(['cash','bkash','nagad','bank','online']),
  paymentDetails: z.object({
    provider: z.string().optional(),
    walletNumber: z.string().optional(),
    transactionId: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    senderName: z.string().optional(),
  }).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
  date: z.string().datetime().optional(),
});

export const bookingPaymentSummaryQuery = z.object({ bookingId: objectIdStringSchema });

export default transactionSchemas;


