import { z } from 'zod';
import { schemaUtils } from '#common/utils/schemaUtils.js';

const { objectIdStringSchema, createBaseQuerySchema, makeFilterableSchema } = schemaUtils;

export const serviceCreateBody = z.object({
  parlourId: objectIdStringSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  duration: z.number().min(1),
  category: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isDiscount: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const serviceUpdateBody = serviceCreateBody.partial();
export const serviceGetParams = z.object({ id: objectIdStringSchema });

export const serviceListQuery = createBaseQuerySchema({
  parlourId: makeFilterableSchema(z.string(), true),
  name: makeFilterableSchema(z.string()),
  category: makeFilterableSchema(z.string()),
  isFeatured: makeFilterableSchema(z.boolean()),
  isDiscount: makeFilterableSchema(z.boolean()),
  isActive: makeFilterableSchema(z.boolean()),
});

export const serviceSchemas = {
  create: { body: serviceCreateBody },
  update: { body: serviceUpdateBody, params: serviceGetParams },
  get: { params: serviceGetParams },
  list: { query: serviceListQuery },
  remove: { params: serviceGetParams },
};

export default serviceSchemas;


