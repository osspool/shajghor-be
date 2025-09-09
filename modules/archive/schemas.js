import Archive from './archive.model.js';
import { buildCrudSchemasFromModel } from '#common/utils/mongooseToJsonSchema.js';

const { crudSchemas } = buildCrudSchemasFromModel(Archive, {
  output: 'json',
  query: {
    filterableFields: {
      type: { type: 'string' },
      organizationId: { type: 'string' },
      parlourId: { type: 'string' },
    },
  },
});

export const archiveSchemas = crudSchemas;
export default archiveSchemas;

export const archiveRunQuery = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['booking','transaction'] },
    organizationId: { type: 'string' },
    parlourId: { type: 'string' },
    rangeFrom: { type: 'string', format: 'date-time' },
    rangeTo: { type: 'string', format: 'date-time' },
  },
  additionalProperties: false,
};


