import { z } from 'zod';
import { schemaUtils } from '#common/utils/schemaUtils.js';
import { EMPLOYEE_ROLE_VALUES } from '#common/constants/enums.js';

const { objectIdStringSchema, createBaseQuerySchema, makeFilterableSchema } = schemaUtils;

export const employeeCreateBody = z.object({
  userId: objectIdStringSchema,
  parlourId: objectIdStringSchema,
  role: z.enum(EMPLOYEE_ROLE_VALUES).optional(),
  title: z.string().optional(),
  active: z.boolean().optional(),
  salaryAmount: z.number().min(0).optional(),
  salaryCurrency: z.string().optional(),
  salaryNotes: z.string().optional(),
});

export const employeeUpdateBody = employeeCreateBody.partial();
export const employeeGetParams = z.object({ id: objectIdStringSchema });
export const employeePaySalaryBody = z.object({
  amount: z.number().min(0).optional(),
  method: z.enum(['cash','online']).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const employeeListQuery = createBaseQuerySchema({
  userId: makeFilterableSchema(z.string(), true),
  parlourId: makeFilterableSchema(z.string(), true),
  active: makeFilterableSchema(z.string()),
});

export const employeeSchemas = {
  create: { body: employeeCreateBody },
  update: { body: employeeUpdateBody, params: employeeGetParams },
  get: { params: employeeGetParams },
  list: { query: employeeListQuery },
  remove: { params: employeeGetParams },
};

export default employeeSchemas;


