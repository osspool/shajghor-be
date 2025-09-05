import { z } from 'zod';
import { schemaUtils } from '#common/utils/schemaUtils.js';

const { objectIdStringSchema, createBaseQuerySchema } = schemaUtils;

const workingHoursItem = z.object({
  isOpen: z.boolean().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const parlourCreateBody = z.object({
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/i, 'Slug can contain letters, numbers, dashes'),
  name: z.string().min(1),
  ownerId: objectIdStringSchema.optional(),
  organizationId: objectIdStringSchema.optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  coverImage: z.string().optional(),
  socialLinks: z.record(z.string()).optional(),
  socialMediaUrl: z.object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    tiktok: z.string().url().optional(),
    youtube: z.string().url().optional(),
    website: z.string().url().optional(),
  }).optional(),
  workingHours: z.record(workingHoursItem).optional(),
  breaks: z.array(z.object({ startTime: z.string(), endTime: z.string() })).optional(),
  providerType: z.enum(['salon','artist']).optional(),
  serviceTypes: z.array(z.string()).optional(),
  serviceLocationMode: z.enum(['in-salon','at-home','both']).optional(),
  capacity: z.number().min(1).optional(),
  slotDurationMinutes: z.number().min(5).optional(),
  leadTimeMinutes: z.number().min(0).optional(),
  dailyCutoffTime: z.string().optional(),
  hasOffers: z.boolean().optional(),
  offerText: z.string().optional(),
  isActive: z.boolean().optional(),
  about: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    features: z.array(z.string()).optional(),
  }).optional(),
  portfolio: z.array(z.string()).optional(),
});

export const parlourUpdateBody = parlourCreateBody.partial();
export const parlourGetParams = z.object({ id: objectIdStringSchema });
export const parlourGetByOwnerParams = z.object({ ownerId: objectIdStringSchema });
export const parlourGetBySlugParams = z.object({ slug: z.string().min(3).regex(/^[a-z0-9-]+$/i) });

export const parlourListQuery = createBaseQuerySchema({
  slug: schemaUtils.makeFilterableSchema(z.string()),
  name: schemaUtils.makeFilterableSchema(z.string()),
  ownerId: schemaUtils.makeFilterableSchema(z.string(), true),
  organizationId: schemaUtils.makeFilterableSchema(z.string(), true),
  serviceLocationMode: schemaUtils.makeFilterableSchema(z.string()),
  hasOffers: schemaUtils.makeFilterableSchema(z.boolean()),
  offerText: schemaUtils.makeFilterableSchema(z.string()),
  isActive: schemaUtils.makeFilterableSchema(z.boolean()),
});

export const parlourSchemas = {
  create: { body: parlourCreateBody },
  update: { body: parlourUpdateBody, params: parlourGetParams },
  get: { params: parlourGetParams },
  list: { query: parlourListQuery },
  remove: { params: parlourGetParams },
};

export default parlourSchemas;


