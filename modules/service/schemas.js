import Service from './service.model.js';
import { buildCrudSchemasFromModel } from '#common/utils/mongooseToJsonSchema.js';

const { crudSchemas } = buildCrudSchemasFromModel(Service, {
  output: 'json',
  query: {
    filterableFields: {
      parlourId: { type: 'string' },
      name: { type: 'string' },
      category: { type: 'string' },
      isFeatured: { type: 'boolean' },
      isDiscount: { type: 'boolean' },
      isActive: { type: 'boolean' },
    },
  },
});

export default crudSchemas;


