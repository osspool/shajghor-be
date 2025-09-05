import { z } from 'zod';
import { schemaUtils } from '#common/utils/schemaUtils.js';

const { objectIdStringSchema, createBaseQuerySchema, makeFilterableSchema } = schemaUtils;

const bookingServiceItem = z.object({
  serviceId: objectIdStringSchema,
  serviceName: z.string(),
  price: z.number().min(0),
  duration: z.number().min(1),
});

export const bookingCreateBody = z.object({
  organizationId: objectIdStringSchema.optional(),
  parlourId: objectIdStringSchema,
  customerId: objectIdStringSchema.optional(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(5),
  services: z.array(bookingServiceItem).min(1),
  serviceType: z.enum(['in-salon','at-home']).optional(),
  serviceAddress: z.string().optional(),
  appointmentDate: z.string().datetime(),
  appointmentTime: z.string().min(4),
  status: z.enum(['pending','confirmed','completed','cancelled']).optional(),
  paymentStatus: z.enum(['pending','paid','refunded']).optional(),
  paymentMethod: z.enum(['cash','bkash','nagad','bank','online']).optional(),
  totalAmount: z.number().min(0),
  totalDuration: z.number().min(1),
  additionalCost: z.number().optional(),
  additionalCostReason: z.string().optional(),
  notes: z.string().optional(),
});

export const bookingUpdateBody = bookingCreateBody.partial();
export const bookingGetParams = z.object({ id: objectIdStringSchema });

export const bookingListQuery = createBaseQuerySchema({
  organizationId: makeFilterableSchema(z.string(), true),
  parlourId: makeFilterableSchema(z.string(), true),
  customerId: makeFilterableSchema(z.string(), true),
  customerPhone: makeFilterableSchema(z.string()),
  appointmentDate: makeFilterableSchema(z.string()),
  status: makeFilterableSchema(z.string()),
  paymentStatus: makeFilterableSchema(z.string()),
});

export const bookingSchemas = {
  create: { body: bookingCreateBody },
  update: { body: bookingUpdateBody, params: bookingGetParams },
  get: { params: bookingGetParams },
  list: { query: bookingListQuery },
  remove: { params: bookingGetParams },
};

export default bookingSchemas;

// Availability query schema
export const bookingAvailabilityQuery = z.object({
  parlourId: objectIdStringSchema,
  date: z.string().min(8), // expected YYYY-MM-DD
});


