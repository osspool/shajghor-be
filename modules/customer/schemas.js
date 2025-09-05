import { z } from 'zod';
import { schemaUtils } from '#common/utils/schemaUtils.js';

const { objectIdStringSchema, createBaseQuerySchema, makeFilterableSchema } = schemaUtils;

export const customerCreateBody = z.object({
  userId: objectIdStringSchema.optional(),
  name: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email().optional(),
  parlourIds: z.array(objectIdStringSchema).optional(),
});

export const customerUpdateBody = customerCreateBody.partial();
export const customerGetParams = z.object({ id: objectIdStringSchema });

export const customerListQuery = createBaseQuerySchema({
  name: makeFilterableSchema(z.string()),
  phone: makeFilterableSchema(z.string()),
  email: makeFilterableSchema(z.string()),
});

export const customerSchemas = {
  create: { body: customerCreateBody },
  update: { body: customerUpdateBody, params: customerGetParams },
  get: { params: customerGetParams },
  list: { query: customerListQuery },
  remove: { params: customerGetParams },
};

export default customerSchemas;


