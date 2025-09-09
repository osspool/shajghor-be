import Parlour from './parlour.model.js';
import { buildCrudSchemasFromModel } from '#common/utils/mongooseToJsonSchema.js';

// Generate base CRUD schemas from Mongoose model
const { crudSchemas, createBody, updateBody, listQuery } = buildCrudSchemasFromModel(Parlour, {
  output: 'json',
  create: {
    // Keep defaults; requireds inferred from schema
    omitFields: ['createdAt', 'updatedAt', '__v'],
  },
  query: {
    // Preserve existing filterable fields and operators
    filterableFields: {
      slug: { type: 'string' },
      name: { type: 'string' },
      branch: { type: 'string' },
      ownerId: { type: 'string' },
      organizationId: { type: 'string' },
      serviceLocationMode: { type: 'string' },
      hasOffers: { type: 'boolean' },
      isFeatured: { type: 'boolean' },
      'advert.running': { type: 'boolean' },
      providerType: { type: 'string' },
      serviceTypes: { type: 'string' },
      tags: { type: 'string' },
      offerText: { type: 'string' },
      isActive: { type: 'boolean' },
      'address.address': { type: 'string' },
      'address.city': { type: 'string' },
      'address.area': { type: 'string' },
    },
  },
});

export const parlourCreateBody = createBody;
export const parlourUpdateBody = updateBody;
export const parlourListQuery = listQuery;

export const parlourGetParams = { type: 'object', properties: { id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }, required: ['id'] };
export const parlourGetByOwnerParams = { type: 'object', properties: { ownerId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }, required: ['ownerId'] };
export const parlourGetBySlugParams = { type: 'object', properties: { slug: { type: 'string', minLength: 3 } }, required: ['slug'] };

export default crudSchemas;


