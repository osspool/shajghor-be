import Employee from './employee.model.js';
import { buildCrudSchemasFromModel } from '#common/utils/mongooseToJsonSchema.js';

export const employeePaySalaryBody = {
  type: 'object',
  properties: {
    amount: { type: 'number' },
    method: { type: 'string', enum: ['cash','online'] },
    reference: { type: 'string' },
    notes: { type: 'string' },
  },
  additionalProperties: false,
};

const { crudSchemas } = buildCrudSchemasFromModel(Employee, {
  output: 'json',
  query: {
    filterableFields: {
      userId: { type: 'string' },
      parlourId: { type: 'string' },
      active: { type: 'string' },
    },
  },
});

export default crudSchemas;


