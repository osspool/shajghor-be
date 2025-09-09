import mongoose from 'mongoose';

function isMongooseSchema(value) {
  return value instanceof mongoose.Schema;
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function isObjectIdType(t) {
  return t === mongoose.Schema.Types.ObjectId || t === mongoose.Types.ObjectId;
}

// All Zod-related code paths removed; JSON Schema only.

export function buildCrudSchemasFromMongooseSchema(mongooseSchema, options = {}) {
  const tree = mongooseSchema?.obj || {};

  // Always generate JSON schemas
  const jsonCreate = buildJsonSchemaForCreate(tree, options);
  const jsonUpdate = buildJsonSchemaForUpdate(jsonCreate);
  const jsonParams = { type: 'object', properties: { id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }, required: ['id'] };
  const jsonQuery = buildJsonSchemaForQuery(tree, options);

  const crudSchemas = {
    create: { body: jsonCreate },
    update: { body: jsonUpdate, params: jsonParams },
    get: { params: jsonParams },
    list: { query: jsonQuery },
    remove: { params: jsonParams },
  };

  return { createBody: jsonCreate, updateBody: jsonUpdate, params: jsonParams, listQuery: jsonQuery, crudSchemas };
}

export function buildCrudSchemasFromModel(mongooseModel, options = {}) {
  if (!mongooseModel || !mongooseModel.schema) throw new Error('Invalid mongoose model');
  return buildCrudSchemasFromMongooseSchema(mongooseModel.schema, options);
}

export default {
  buildCrudSchemasFromMongooseSchema,
  buildCrudSchemasFromModel,
};

// ==== JSON Schema helpers ====
function jsonTypeFor(def, options, seen) {
  if (Array.isArray(def)) {
    return { type: 'array', items: jsonTypeFor(def[0] ?? String, options, seen) };
  }
  if (isPlainObject(def) && def.type) {
    if (def.enum && Array.isArray(def.enum) && def.enum.length) return { type: 'string', enum: def.enum.map(String) };
    // Array typed via { type: [X] }
    if (Array.isArray(def.type)) {
      const inner = def.type[0] !== undefined ? def.type[0] : String;
      return { type: 'array', items: jsonTypeFor(inner, options, seen) };
    }
    if (def.type === String) return { type: 'string' };
    if (def.type === Number) return { type: 'number' };
    if (def.type === Boolean) return { type: 'boolean' };
    if (def.type === Date) {
      const mode = options?.dateAs || 'datetime';
      return mode === 'date' ? { type: 'string', format: 'date' } : { type: 'string', format: 'date-time' };
    }
    if (def.type === Map || def.type === mongoose.Schema.Types.Map) {
      const ofSchema = jsonTypeFor(def.of || String, options, seen);
      return { type: 'object', additionalProperties: ofSchema };
    }
    if (isObjectIdType(def.type)) return { type: 'string', pattern: '^[0-9a-fA-F]{24}$' };
    if (isMongooseSchema(def.type)) {
      const obj = def.type.obj;
      if (obj && typeof obj === 'object') {
        if (seen.has(obj)) return { type: 'object', additionalProperties: true };
        seen.add(obj);
        return convertTreeToJsonSchema(obj, options, seen);
      }
    }
  }
  if (def === String) return { type: 'string' };
  if (def === Number) return { type: 'number' };
  if (def === Boolean) return { type: 'boolean' };
  if (def === Date) {
    const mode = options?.dateAs || 'datetime';
    return mode === 'date' ? { type: 'string', format: 'date' } : { type: 'string', format: 'date-time' };
  }
  if (isObjectIdType(def)) return { type: 'string', pattern: '^[0-9a-fA-F]{24}$' };
  if (isPlainObject(def)) {
    if (seen.has(def)) return { type: 'object', additionalProperties: true };
    seen.add(def);
    return convertTreeToJsonSchema(def, options, seen);
  }
  return {};
}

function convertTreeToJsonSchema(tree, options, seen = new WeakSet()) {
  if (!tree || typeof tree !== 'object') return { type: 'object', properties: {} };
  if (seen.has(tree)) return { type: 'object', additionalProperties: true };
  seen.add(tree);
  const properties = {};
  const required = [];
  for (const [key, val] of Object.entries(tree || {})) {
    if (key === '__v' || key === '_id' || key === 'id') continue;
    const cfg = isPlainObject(val) && val.type !== undefined ? val : { type: val };
    properties[key] = jsonTypeFor(val, options, seen);
    if (cfg.required === true) required.push(key);
  }
  const schema = { type: 'object', properties };
  if (required.length) schema.required = required;
  return schema;
}

function buildJsonSchemaForCreate(tree, options) {
  const base = convertTreeToJsonSchema(tree, options, new WeakSet());
  const omit = new Set(['createdAt','updatedAt','__v',...((options?.create?.omitFields)||[])]);
  for (const field of omit) {
    if (base.properties && base.properties[field]) {
      delete base.properties[field];
    }
    if (base.required) {
      base.required = base.required.filter((k) => k !== field);
    }
  }
  // Apply overrides
  const reqOv = options?.create?.requiredOverrides || {};
  const optOv = options?.create?.optionalOverrides || {};
  base.required = base.required || [];
  for (const [k,v] of Object.entries(reqOv)) {
    if (v && !base.required.includes(k)) base.required.push(k);
  }
  for (const [k,v] of Object.entries(optOv)) {
    if (v && base.required) base.required = base.required.filter((x)=>x!==k);
  }
  // schemaOverrides (top-level)
  const schemaOverrides = options?.create?.schemaOverrides || {};
  for (const [k, override] of Object.entries(schemaOverrides)) {
    if (base.properties[k]) base.properties[k] = override;
  }
  return base;
}

function buildJsonSchemaForUpdate(createJson) {
  const clone = JSON.parse(JSON.stringify(createJson));
  delete clone.required;
  return clone;
}

function buildJsonSchemaForQuery(tree, options) {
  const basePagination = {
    type: 'object',
    properties: {
      page: { type: 'string' },
      limit: { type: 'string' },
      sort: { type: 'string' },
      populate: { type: 'string' },
      search: { type: 'string' },
      select: { type: 'string' },
      lean: { type: 'string' },
      includeDeleted: { type: 'string' },
    },
    additionalProperties: true,
  };
  const filterable = options?.query?.filterableFields || {};
  for (const [k, v] of Object.entries(filterable)) {
    basePagination.properties[k] = v && v.type ? v : { type: 'string' };
  }
  return basePagination;
}


