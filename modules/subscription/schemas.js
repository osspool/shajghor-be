import Subscription from './subscription.model.js';
import { buildCrudSchemasFromModel } from '#common/utils/mongooseToJsonSchema.js';

const { crudSchemas } = buildCrudSchemasFromModel(Subscription, {
  output: 'json',
  query: {
    filterableFields: {
      organizationId: { type: 'string' },
      status: { type: 'string' },
      billingCycle: { type: 'string' },
    },
  },
});

export default crudSchemas;


