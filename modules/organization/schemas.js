import Organization from './organization.model.js';
import { buildCrudSchemasFromModel } from '#common/utils/mongooseToJsonSchema.js';

const { crudSchemas } = buildCrudSchemasFromModel(Organization, {
  output: 'json',
  query: {
    filterableFields: {
      name: { type: 'string' },
      ownerId: { type: 'string' },
      isActive: { type: 'boolean' },
    },
  },
});

export default crudSchemas;


