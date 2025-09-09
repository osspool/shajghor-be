// routes/utils/createCrudRouter.js
// Use Fastify-decorated auth plugin (authenticate/authorize)
import { registerPath, registerTag } from '#common/docs/apiDocs.js';
// using JSON schema only
import { createResponseCache } from '#common/plugins/cache.plugin.js';
import { buildCrudResponseSchemas, filterEntitySchema, itemWrapper, paginateWrapper, messageWrapper } from '#common/docs/responseSchemas.js';

/**
 * Creates a CRUD router from a controller implementing BaseController interface
 * Required controller methods: create, getAll, getById, update, delete
 * Optional middlewares can be provided per route
 */
// options: {
//   middlewares?: { list?, get?, create?, update?, remove? } -> array of middlewares per op
//   auth?: { list?, get?, create?, update?, remove? } -> array of allowed roles per op
//   schemas?: { list?, get?, create?, update?, remove? } -> { body?, query?, params? } per op
// }
// No wrapper needed; pass preHandlers directly

// No Express adapters; Fastify-only project

function ensureJsonSchema(obj) {
  if (!obj) return undefined;
  const out = {};
  if (obj.body) out.body = obj.body;
  if (obj.params) out.params = obj.params;
  if (obj.querystring) out.querystring = obj.querystring;
  if (obj.query) out.querystring = obj.query;
  return Object.keys(out).length ? out : undefined;
}

function buildParametersFromSchema(schemaLike, location = 'query') {
  if (!schemaLike) return [];
  const schema = schemaLike.querystring || schemaLike.params || schemaLike;
  if (schema && schema.type === 'object' && schema.properties) {
    return Object.entries(schema.properties).map(([name, prop]) => ({ in: location, name, required: Array.isArray(schema.required) ? schema.required.includes(name) : false, schema: prop && typeof prop === 'object' ? prop : { type: 'string' } }));
  }
  return [];
}

export default function createCrudRouter(fastify, controller, options = {}) {

  const middlewares = options.middlewares || {};
  const auth = options.auth || {};
  const schemas = options.schemas || {};

  const mw = {
    list: middlewares.list || [],
    get: middlewares.get || [],
    create: middlewares.create || [],
    update: middlewares.update || [],
    remove: middlewares.remove || [],
  };

  const authMw = (roles) => (roles && roles.length ? [fastify.authenticate, fastify.authorize(...roles)] : []);

  // Optional simple cache for read-heavy endpoints
  const cache = options.cache || {};
  const listCacheMw = cache.list ? [createResponseCache(cache.list).middleware] : [];
  const getCacheMw = cache.get ? [createResponseCache(cache.get).middleware] : [];

  // Additional custom routes FIRST to avoid '/:id' conflicts
  registerTag(options.tag);
  if (Array.isArray(options.additionalRoutes)) {
    options.additionalRoutes.forEach((r) => {
      if (!r || !r.method || !r.path || !r.handler) return;
      const method = String(r.method).toLowerCase();
      const tag = r.tag || options.tag;
      const fullPath = (options.basePath || '') + r.path;
      const toOpenApiPath = (p) => p.replace(/:([A-Za-z0-9_]+)/g, '{$1}');

      const routeAuthMw = authMw(r.authRoles || []);
      const baseSchema = ensureJsonSchema(r.schemas || {});
      // Auto-generate response schema if none provided
      const filteredEntity = filterEntitySchema((schemas.entity || {}), options.schemas?.filter || options.filter || {});
      const successCode = r.successCode || (method === 'post' ? 201 : 200);
      let responseSchemas = r.responses;
      if (!responseSchemas && r.noResponseSchema !== true) {
        if (r.responseSchema) {
          responseSchemas = { [successCode]: r.responseSchema };
        } else if (r.response === 'list' || r.isList === true) {
          responseSchemas = { [successCode]: paginateWrapper(filteredEntity) };
        } else if (r.response === 'message') {
          responseSchemas = { [successCode]: messageWrapper() };
        } else {
          // Heuristic by method
          if (method === 'get') responseSchemas = { 200: itemWrapper(filteredEntity) };
          else if (method === 'post') responseSchemas = { 201: itemWrapper(filteredEntity) };
          else if (method === 'delete') responseSchemas = { 200: messageWrapper() };
          else responseSchemas = { 200: itemWrapper(filteredEntity) };
        }
      }

      const schema = { ...(baseSchema || {}), ...(responseSchemas ? { response: responseSchemas } : {}) };

      fastify.route({ method: method.toUpperCase(), url: r.path, schema, preHandler: [...routeAuthMw], handler: r.handler });

      const parameters = [
        ...buildParametersFromSchema(schema?.params ? { params: schema.params } : (r.schemas?.params || {}), 'path'),
        ...buildParametersFromSchema(schema?.querystring ? { querystring: schema.querystring } : (r.schemas?.query || {}), 'query'),
      ].filter(Boolean);

      registerPath(toOpenApiPath(fullPath), method, {
        tags: tag ? [tag] : undefined,
        summary: r.summary || undefined,
        parameters: parameters.length ? parameters : undefined,
        requestBody: r.schemas?.body ? { required: true, content: { 'application/json': { schema: r.schemas.body } } } : undefined,
        responses: responseSchemas || { 200: { description: 'Success' } },
      });
    });
  }

  // Auto response schemas
  const responses = buildCrudResponseSchemas(schemas.entity || {} , { filter: schemas.filter });

  // List
  fastify.get('/', { schema: { ...ensureJsonSchema(schemas.list), response: responses.list }, preHandler: [...authMw(auth.list), ...listCacheMw, ...mw.list] }, controller.getAll);
  const listSchema = ensureJsonSchema(schemas.list) || schemas.list || {};
  registerPath((options.basePath || '') + '/', 'get', {
    tags: options.tag ? [options.tag] : undefined,
    summary: `List ${options.tag || 'items'}`,
    parameters: buildParametersFromSchema(listSchema?.querystring ? { querystring: listSchema.querystring } : (schemas.list?.query || {}), 'query'),
    responses: {
      200: {
        description: 'Paginated list',
      },
    },
  });
  // Get by id
  fastify.get('/:id', { schema: { ...ensureJsonSchema(schemas.get), response: responses.get }, preHandler: [...authMw(auth.get), ...getCacheMw, ...mw.get] }, controller.getById);
  registerPath((options.basePath || '') + '/{id}', 'get', {
    tags: options.tag ? [options.tag] : undefined,
    summary: `Get ${options.tag || 'item'} by id`,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Item' } },
  });
  // Create
  fastify.post('/', { schema: { ...ensureJsonSchema(schemas.create), response: responses.create }, preHandler: [...authMw(auth.create), ...mw.create] }, controller.create);
  registerPath((options.basePath || '') + '/', 'post', {
    tags: options.tag ? [options.tag] : undefined,
    summary: `Create ${options.tag || 'item'}`,
    requestBody: schemas.create?.body ? { required: true, content: { 'application/json': { schema: schemas.create.body } } } : undefined,
    responses: { 201: { description: 'Created' } },
  });
  // Update (PATCH preferred)
  fastify.patch('/:id', { schema: { ...ensureJsonSchema(schemas.update), response: responses.update }, preHandler: [...authMw(auth.update), ...mw.update] }, controller.update);
  registerPath((options.basePath || '') + '/{id}', 'patch', {
    tags: options.tag ? [options.tag] : undefined,
    summary: `Update ${options.tag || 'item'}`,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
    requestBody: schemas.update?.body ? { required: true, content: { 'application/json': { schema: schemas.update.body } } } : undefined,
    responses: { 200: { description: 'Updated' } },
  });
  // Delete
  fastify.delete('/:id', { schema: { ...ensureJsonSchema(schemas.remove), response: responses.remove }, preHandler: [...authMw(auth.remove), ...mw.remove] }, controller.delete);
  registerPath((options.basePath || '') + '/{id}', 'delete', {
    tags: options.tag ? [options.tag] : undefined,
    summary: `Delete ${options.tag || 'item'}`,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Deleted' } },
  });

  registerTag(options.tag);
  return fastify;
}


