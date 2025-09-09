import Customer from './customer.model.js';
import { buildCrudSchemasFromModel } from '#common/utils/mongooseToJsonSchema.js';

const { crudSchemas } = buildCrudSchemasFromModel(Customer, {
  output: 'json',
  query: {
    filterableFields: {
      name: { type: 'string' },
      phone: { type: 'string' },
      email: { type: 'string', format: 'email' },
    },
  },
});

export default crudSchemas;


