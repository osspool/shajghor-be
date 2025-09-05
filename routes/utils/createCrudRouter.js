// routes/utils/createCrudRouter.js
import express from 'express';
import { validate } from '#common/middlewares/validate.js';
import authMiddleware, { authorize } from '#common/middlewares/authMiddleware.js';
import { registerPath, registerTag } from '#common/docs/apiDocs.js';
import { registerZod, buildParametersFromZodObject } from '#common/docs/swaggerHelpers.js';

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
export default function createCrudRouter(controller, options = {}) {
  const router = express.Router();

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

  const authMw = (roles) => (roles && roles.length ? [authMiddleware, authorize(...roles)] : []);
  const valMw = (schema) => (schema && (schema.body || schema.query || schema.params) ? [validate(schema)] : []);

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
      const routeValMw = valMw(r.schemas || {});

      if (typeof router[method] === 'function') {
        router[method](r.path, ...routeAuthMw, ...routeValMw, r.handler);
      }

      const parameters = [
        ...(buildParametersFromZodObject(r.schemas?.params, 'path') || []),
        ...(buildParametersFromZodObject(r.schemas?.query, 'query') || []),
      ].filter(Boolean);

      registerPath(toOpenApiPath(fullPath), method, {
        tags: tag ? [tag] : undefined,
        summary: r.summary || undefined,
        parameters: parameters.length ? parameters : undefined,
        requestBody: r.schemas?.body
          ? { required: true, content: { 'application/json': { schema: registerZod(`${tag || 'Item'}CustomBody`, r.schemas.body) } } }
          : undefined,
        responses: r.responses || { 200: { description: 'Success' } },
      });
    });
  }

  // List
  router.get('/', ...authMw(auth.list), ...valMw(schemas.list), ...mw.list, controller.getAll);
  registerPath((options.basePath || '') + '/', 'get', {
    tags: options.tag ? [options.tag] : undefined,
    summary: `List ${options.tag || 'items'}`,
    parameters: buildParametersFromZodObject(schemas.list?.query),
    responses: {
      200: {
        description: 'Paginated list',
      },
    },
  });
  // Get by id
  router.get('/:id', ...authMw(auth.get), ...valMw(schemas.get), ...mw.get, controller.getById);
  registerPath((options.basePath || '') + '/{id}', 'get', {
    tags: options.tag ? [options.tag] : undefined,
    summary: `Get ${options.tag || 'item'} by id`,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Item' } },
  });
  // Create
  router.post('/', ...authMw(auth.create), ...valMw(schemas.create), ...mw.create, controller.create);
  registerPath((options.basePath || '') + '/', 'post', {
    tags: options.tag ? [options.tag] : undefined,
    summary: `Create ${options.tag || 'item'}`,
    requestBody: schemas.create?.body ? { required: true, content: { 'application/json': { schema: registerZod(`${options.tag || 'Item'}Create`, schemas.create.body) } } } : undefined,
    responses: { 201: { description: 'Created' } },
  });
  // Update (PATCH preferred)
  router.patch('/:id', ...authMw(auth.update), ...valMw(schemas.update), ...mw.update, controller.update);
  registerPath((options.basePath || '') + '/{id}', 'patch', {
    tags: options.tag ? [options.tag] : undefined,
    summary: `Update ${options.tag || 'item'}`,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
    requestBody: schemas.update?.body ? { required: true, content: { 'application/json': { schema: registerZod(`${options.tag || 'Item'}Update`, schemas.update.body) } } } : undefined,
    responses: { 200: { description: 'Updated' } },
  });
  // Delete
  router.delete('/:id', ...authMw(auth.remove), ...valMw(schemas.remove), ...mw.remove, controller.delete);
  registerPath((options.basePath || '') + '/{id}', 'delete', {
    tags: options.tag ? [options.tag] : undefined,
    summary: `Delete ${options.tag || 'item'}`,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Deleted' } },
  });

  registerTag(options.tag);
  return router;
}


