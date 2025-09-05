import { z } from 'zod';
import { schemaUtils } from '#common/utils/schemaUtils.js';

const { objectIdStringSchema, createBaseQuerySchema, commonValidationPatterns } = schemaUtils;

export const organizationCreateBody = z.object({
  name: z.string().min(1),
  ownerId: objectIdStringSchema,
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  billingPrice: z.number().min(0).optional(),
  billingCurrency: z.string().optional(),
  lastPaidAt: z.string().datetime().optional(),
  lastPaidMethod: z.string().optional(),
  billingNotes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const organizationUpdateBody = organizationCreateBody.partial();

export const organizationGetParams = z.object({ id: objectIdStringSchema });

export const organizationListQuery = createBaseQuerySchema({
  name: schemaUtils.makeFilterableSchema(z.string()),
  ownerId: schemaUtils.makeFilterableSchema(z.string(), true),
  isActive: schemaUtils.makeFilterableSchema(z.boolean()),
});

export const organizationSchemas = {
  create: { body: organizationCreateBody },
  update: { body: organizationUpdateBody, params: organizationGetParams },
  get: { params: organizationGetParams },
  list: { query: organizationListQuery },
  remove: { params: organizationGetParams },
};

export default organizationSchemas;


