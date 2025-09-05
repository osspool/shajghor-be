import { z } from 'zod';
import { schemaUtils } from '#common/utils/schemaUtils.js';

const { objectIdStringSchema, createBaseQuerySchema, makeFilterableSchema } = schemaUtils;

export const archiveCreateBody = z.object({
  type: z.enum(['booking','transaction']),
  organizationId: objectIdStringSchema.optional(),
  parlourId: objectIdStringSchema.optional(),
  rangeFrom: z.string().datetime().optional(),
  rangeTo: z.string().datetime().optional(),
  filePath: z.string(),
  format: z.enum(['json']).optional(),
  recordCount: z.number().min(0).optional(),
  sizeBytes: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const archiveUpdateBody = archiveCreateBody.partial();
export const archiveGetParams = z.object({ id: objectIdStringSchema });

export const archiveListQuery = createBaseQuerySchema({
  type: makeFilterableSchema(z.string()),
  organizationId: makeFilterableSchema(z.string(), true),
  parlourId: makeFilterableSchema(z.string(), true),
});

export const archiveSchemas = {
  create: { body: archiveCreateBody },
  update: { body: archiveUpdateBody, params: archiveGetParams },
  get: { params: archiveGetParams },
  list: { query: archiveListQuery },
  remove: { params: archiveGetParams },
};

export const archiveRunQuery = z.object({
  type: z.enum(['booking','transaction']),
  organizationId: objectIdStringSchema.optional(),
  parlourId: objectIdStringSchema.optional(),
  rangeFrom: z.string().datetime().optional(),
  rangeTo: z.string().datetime().optional(),
});


