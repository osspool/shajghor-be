import User from './user.model.js';
import { buildCrudSchemasFromModel } from '#common/utils/mongooseToJsonSchema.js';

export const loginBody = { type: 'object', properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 1 } }, required: ['email','password'], additionalProperties: false };
export const registerBody = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string' },
    password: { type: 'string', minLength: 6 },
    roles: { type: 'array', items: { type: 'string', enum: ['superadmin','admin','manager','hr','employee','user'] } },
  },
  required: ['name','email','password'],
  additionalProperties: false,
};
export const refreshBody = { type: 'object', properties: { token: { type: 'string', minLength: 1 } }, required: ['token'], additionalProperties: false };
export const forgotBody = { type: 'object', properties: { email: { type: 'string', format: 'email' } }, required: ['email'], additionalProperties: false };
export const resetBody = { type: 'object', properties: { token: { type: 'string', minLength: 1 }, newPassword: { type: 'string', minLength: 6 } }, required: ['token','newPassword'], additionalProperties: false };
export const getProfileBody = { type: 'object', properties: { email: { type: 'string', format: 'email' } }, required: ['email'], additionalProperties: false };
export const updateUserBody = { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, phone: { type: 'string' } }, additionalProperties: false };

// User CRUD schemas
const { crudSchemas } = buildCrudSchemasFromModel(User, {
  output: 'json',
  query: {
    // keep list open but at least provide basic filterables if needed later
    filterableFields: {
      name: { type: 'string' },
      email: { type: 'string' },
    },
  },
});

// Re-export shapes expected by auth routes
export const userCreateBody = crudSchemas.create.body;
export const userUpdateBody = crudSchemas.update.body;
export const userGetParams = crudSchemas.get.params;
export const userListQuery = crudSchemas.list.query;


