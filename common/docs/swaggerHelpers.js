import { zodToJsonSchema } from 'zod-to-json-schema';
import { registerSchema } from '#common/docs/apiDocs.js';

export function registerZod(name, zodSchema) {
  if (!zodSchema) return { $ref: `#/components/schemas/${name}` };
  const json = zodToJsonSchema(zodSchema, { name, $refStrategy: 'none' });
  // If the converter returns a wrapper with definitions
  if (json && typeof json === 'object') {
    const defs = json.definitions || json.components?.schemas;
    if (defs && typeof defs === 'object') {
      Object.entries(defs).forEach(([defName, defSchema]) => registerSchema(defName, defSchema));
    }
    // Prefer main schema at provided name
    if (json[typeof name === 'string' ? name : 'schema']) {
      registerSchema(name, json[name]);
    } else if (!defs) {
      registerSchema(name, json);
    }
  }
  return { $ref: `#/components/schemas/${name}` };
}

function unwrapToZodObject(schema) {
  let current = schema;
  while (current && current._def && (
    current._def.typeName === 'ZodEffects' ||
    current._def.typeName === 'ZodOptional' ||
    current._def.typeName === 'ZodDefault' ||
    current._def.typeName === 'ZodNullable'
  )) {
    current = current._def.schema;
  }
  return current;
}

function isOptionalSchema(schema) {
  let current = schema;
  let optional = false;
  while (current && current._def) {
    const t = current._def.typeName || '';
    if (t === 'ZodOptional' || t === 'ZodDefault' || t === 'ZodNullable') optional = true;
    if (current._def.schema) {
      current = current._def.schema;
    } else {
      break;
    }
  }
  return optional;
}

export function buildParametersFromZodObject(zodObject, location = 'query') {
  if (!zodObject || typeof zodObject._def !== 'object') return [];
  const unwrapped = unwrapToZodObject(zodObject);
  if (!unwrapped || typeof unwrapped._def?.shape !== 'function') return [];
  const shape = unwrapped._def.shape();
  return Object.entries(shape).map(([key, schema]) => ({
    in: location,
    name: key,
    required: !isOptionalSchema(schema),
    schema: convertBasic(schema),
  }));
}

function convertBasic(schema) {
  const type = schema?._def?.typeName || '';
  if (schema?._def?.checks?.some?.(c => c.kind === 'minLength' || c.kind === 'maxLength')) {
    return { type: 'string' };
  }
  if (type.includes('ZodString')) return { type: 'string' };
  if (type.includes('ZodNumber')) return { type: 'number' };
  if (type.includes('ZodBoolean')) return { type: 'boolean' };
  if (type.includes('ZodArray')) return { type: 'array', items: { type: 'string' } };
  return { type: 'string' };
}


