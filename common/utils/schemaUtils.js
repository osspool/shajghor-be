import { z } from 'zod';


// Common ObjectId validation schema
export const objectIdStringSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

// Common pagination and query parameters
export const basePaginationSchema = {
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  populate: z.string().optional(),
  search: z.string().optional(),
  // Allow any other query parameters to pass through
  select: z.string().optional(),
  lean: z.string().optional(),
  includeDeleted: z.string().optional(),
};

// Schema for a field that can be a direct value or an object with operators
export const makeFilterableSchema = (typeSchema, isIdField = false) => {
  const idSchema = isIdField ? objectIdStringSchema : typeSchema;
  
  // Check if this is a number schema to handle string-to-number conversion
  const isNumberSchema = typeSchema._def.typeName === z.ZodFirstPartyTypeKind.ZodNumber;
  
  const baseOperators = {
    eq: isNumberSchema ? z.string().transform(val => parseFloat(val)).pipe(z.number()).optional() : (isIdField ? idSchema : typeSchema).optional(),
    ne: isNumberSchema ? z.string().transform(val => parseFloat(val)).pipe(z.number()).optional() : (isIdField ? idSchema : typeSchema).optional(),
    in: z.union([ z.array(isIdField ? idSchema : typeSchema), z.string() ]).optional(),
    nin: z.union([ z.array(isIdField ? idSchema : typeSchema), z.string() ]).optional(),
    size: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
    exists: z.union([z.boolean(), z.string().transform(val => val === 'true')]).optional(),
    type: z.string().optional(),
  };

  const stringOperators = {
    like: z.string().optional(),
    contains: z.string().optional(),
  };

  const numberOperators = {
    gt: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
    gte: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
    lt: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
    lte: z.string().transform(val => parseFloat(val)).pipe(z.number()).optional(),
  };

  let operatorConfig = baseOperators;
  
  // Safely check the schema's type to add the correct operators
  const schemaType = typeSchema._def.typeName;

  if (schemaType === z.ZodFirstPartyTypeKind.ZodString || schemaType === z.ZodFirstPartyTypeKind.ZodEnum) {
    operatorConfig = {...operatorConfig, ...stringOperators};
  }

  if (schemaType === z.ZodFirstPartyTypeKind.ZodNumber) {
    operatorConfig = {...operatorConfig, ...numberOperators};
  }

  return z.union([
    isNumberSchema ? z.string().transform(val => parseFloat(val)).pipe(z.number()) : typeSchema, // Direct value with number conversion if needed
    z.object(operatorConfig).strict() // Operator object
  ]).optional();
};

// Common CRUD schemas
export const createGetByIdSchema = (entityName = 'entity') => z.object({
  id: objectIdStringSchema.describe(`Invalid ${entityName} ID format`),
});

// Base query schema factory
export const createBaseQuerySchema = (additionalFields = {}) => {
  return z.object({
    ...basePaginationSchema,
    ...additionalFields,
  }).passthrough(); // Allow any additional fields to pass through without validation
};

// Common validation patterns
export const commonValidationPatterns = {
  // Standard CRUD validation object factory
  createCrudValidation: (createSchema, updateSchema, additionalSchemas = {}) => ({
    create: createSchema,
    update: updateSchema.partial ? updateSchema : createSchema.partial(),
    getById: createGetByIdSchema(),
    query: createBaseQuerySchema(),
    ...additionalSchemas,
  }),

  // Enhanced CRUD validation with custom query fields
  createCrudValidationWithQuery: (createSchema, updateSchema, queryFields = {}, additionalSchemas = {}) => ({
    create: createSchema,
    update: updateSchema.partial ? updateSchema : createSchema.partial(),
    getById: createGetByIdSchema(),
    query: createBaseQuerySchema(queryFields),
    ...additionalSchemas,
  }),
};




// Export all utilities as a single object for easier importing
export const schemaUtils = {
  objectIdStringSchema,
  basePaginationSchema,
  makeFilterableSchema,
  createGetByIdSchema,
  createBaseQuerySchema,
  commonValidationPatterns,
};

export default schemaUtils; 