import Parlour from './parlour.model.js';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import parlourSchemas, { parlourGetBySlugParams, parlourGetByOwnerParams } from './schemas.js';
import permissions from '#config/permissions.js';
import Employee from '#modules/employee/employee.model.js';
import { restrictFeaturedAdvert } from './guards.js';
import { makeGetByOwnerHandler, makeGetBySlugHandler } from './handlers.js';
import fp from 'fastify-plugin';

async function parlourPlugin(fastify, opts) {
  const { controller } = createServiceAndController(Parlour);
  await fastify.register(async (instance) => {
    const getBySlug = makeGetBySlugHandler(controller);
    const getByOwner = makeGetByOwnerHandler(controller, Employee);
    createCrudRouter(instance, controller, {
      tag: 'Parlour', basePath: '/parlours', schemas: parlourSchemas, auth: permissions.parlours,
      middlewares: { create: [restrictFeaturedAdvert], update: [restrictFeaturedAdvert] },
      additionalRoutes: [
        {
          method: 'get', path: '/slug/:slug', schemas: { params: parlourGetBySlugParams }, summary: 'Get parlour by slug', authRoles: permissions.parlours.get,
          handler: getBySlug,
        },
        {
          method: 'get', path: '/owner/:ownerId', schemas: { params: parlourGetByOwnerParams }, summary: 'Get parlour by owner id', authRoles: permissions.parlours.get,
          handler: getByOwner,
        },
      ],
    });
  }, { prefix: '/parlours' });
}

export default fp(parlourPlugin, { name: 'parlour-plugin' });


