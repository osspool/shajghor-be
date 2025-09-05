// src/common/middlewares/validate.js

import { ZodError } from 'zod';
import createError from 'http-errors';

/**
 * Format Zod validation errors into a more readable structure
 * @param {ZodError} zodError - The Zod validation error
 * @returns {Object} Formatted error object
 */
const formatZodError = (zodError) => {
  const errors = {};
  
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    
    // Create a more descriptive error message
    let message = error.message;
    if (error.code === 'invalid_type') {
      if (error.received === 'undefined') {
        message = `Field '${path}' is required but missing`;
      } else {
        message = `Field '${path}' expected ${error.expected} but received ${error.received}`;
      }
    } else if (error.code === 'invalid_enum_value') {
      message = `Field '${path}' must be one of: ${error.options.join(', ')}`;
    } else if (error.code === 'too_small') {
      message = `Field '${path}' ${error.message}`;
    } else if (error.code === 'too_big') {
      message = `Field '${path}' ${error.message}`;
    }
    
    errors[path].push(message);
  });
  
  return errors;
};

/**
 * Log detailed validation errors for debugging
 * @param {string} location - Where the validation failed (body, query, params)
 * @param {ZodError} zodError - The Zod validation error
 * @param {any} actualData - The actual data that was being validated
 */
const logValidationError = (location, zodError, actualData) => {
  console.log(`\n=== VALIDATION ERROR in ${location.toUpperCase()} ===`);
  console.log(`Actual ${location} data:`, JSON.stringify(actualData, null, 2));
  
  zodError.errors.forEach((error, index) => {
    const fieldPath = error.path.join('.');
    console.log(`\nError ${index + 1}:`);
    console.log(`  Field: ${fieldPath || 'root'}`);
    console.log(`  Error Code: ${error.code}`);
    console.log(`  Message: ${error.message}`);
    
    if (error.code === 'invalid_type') {
      console.log(`  Expected: ${error.expected}`);
      console.log(`  Received: ${error.received}`);
    } else if (error.code === 'invalid_enum_value') {
      console.log(`  Received: ${error.received}`);
      console.log(`  Expected one of: [${error.options.join(', ')}]`);
    } else if (error.code === 'too_small' || error.code === 'too_big') {
      console.log(`  Minimum: ${error.minimum}`);
      console.log(`  Type: ${error.type}`);
      console.log(`  Inclusive: ${error.inclusive}`);
    }
    
    // Log the actual value at the failed path
    if (fieldPath && actualData) {
      const actualValue = fieldPath.split('.').reduce((obj, key) => {
        return obj && obj[key] !== undefined ? obj[key] : undefined;
      }, actualData);
      console.log(`  Actual value: ${JSON.stringify(actualValue)}`);
    }
  });
  console.log(`=== END VALIDATION ERROR ===\n`);
};

/**
 * Validate middleware to handle body, query, and params using Zod schemas.
 * @param {Object} schemas - An object containing Zod schemas for body, query, and/or params.
 * @param {ZodSchema} schemas.body - Schema to validate req.body.
 * @param {ZodSchema} schemas.query - Schema to validate req.query.
 * @param {ZodSchema} schemas.params - Schema to validate req.params.
 * @returns Express middleware function.
 */
export const validate = ({ body, query, params }) => (req, res, next) => {
  try {
    const validationErrors = {};

    if (body) {
      const parsedBody = body.safeParse(req.body);
      if (!parsedBody.success) {
        logValidationError('body', parsedBody.error, req.body);
        validationErrors.body = formatZodError(parsedBody.error);
      } else {
        req.body = parsedBody.data;
      }
    }

    if (query) {
      const parsedQuery = query.safeParse(req.query);
      if (!parsedQuery.success) {
        logValidationError('query', parsedQuery.error, req.query);
        validationErrors.query = formatZodError(parsedQuery.error);
      } else {
        // Avoid overwriting req.query (Express 5 getter). Store validated instead.
        req.validated = req.validated || {};
        req.validated.query = parsedQuery.data;
      }
    }

    if (params) {
      const parsedParams = params.safeParse(req.params);
      if (!parsedParams.success) {
        logValidationError('params', parsedParams.error, req.params);
        validationErrors.params = formatZodError(parsedParams.error);
      } else {
        // Avoid overwriting req.params. Store validated instead.
        req.validated = req.validated || {};
        req.validated.params = parsedParams.data;
      }
    }

    // If there are any validation errors, throw them
    if (Object.keys(validationErrors).length > 0) {
      const errorMessage = 'Validation failed';
      const error = createError(400, errorMessage);
      error.validationErrors = validationErrors;
      
      // Create a detailed message for logging
      const detailedMessages = [];
      Object.entries(validationErrors).forEach(([location, errors]) => {
        Object.entries(errors).forEach(([field, messages]) => {
          messages.forEach(message => {
            detailedMessages.push(`${location}.${field}: ${message}`);
          });
        });
      });
      
      console.log('Summary of validation errors:', detailedMessages.join('; '));
      
      return next(error);
    }

    next();
  } catch (err) {
    console.error('Unexpected error in validation middleware:', err);
    next(err);
  }
};