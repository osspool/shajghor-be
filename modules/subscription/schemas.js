import { z } from 'zod';
import { schemaUtils } from '#common/utils/schemaUtils.js';

const { objectIdStringSchema, createBaseQuerySchema, makeFilterableSchema } = schemaUtils;

export const subscriptionCreateBody = z.object({
  organizationId: objectIdStringSchema,
  planName: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().optional(),
  billingCycle: z.enum(['monthly','quarterly','yearly','custom']).optional(),
  status: z.enum(['active','inactive','pending','expired']).optional(),
  paymentRequest: z.object({
    method: z.string().optional(),
    senderAccount: z.string().optional(),
    reference: z.string().optional(),
    amount: z.number().optional(),
    transactionDate: z.string().datetime().optional(),
    notes: z.string().optional(),
  }).optional(),
  verifiedAt: z.string().datetime().optional(),
  verifiedBy: objectIdStringSchema.optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
});

export const subscriptionUpdateBody = subscriptionCreateBody.partial();
export const subscriptionGetParams = z.object({ id: objectIdStringSchema });

export const subscriptionListQuery = createBaseQuerySchema({
  organizationId: makeFilterableSchema(z.string(), true),
  status: makeFilterableSchema(z.string()),
  billingCycle: makeFilterableSchema(z.string()),
});

export const subscriptionSchemas = {
  create: { body: subscriptionCreateBody },
  update: { body: subscriptionUpdateBody, params: subscriptionGetParams },
  get: { params: subscriptionGetParams },
  list: { query: subscriptionListQuery },
  remove: { params: subscriptionGetParams },
};

export default subscriptionSchemas;


