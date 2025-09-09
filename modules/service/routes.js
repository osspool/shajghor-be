import Service from './service.model.js';
import fp from 'fastify-plugin';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import serviceSchemas from './schemas.js';
import permissions from '#config/permissions.js';

async function servicePlugin(fastify, opts) {
  const { controller } = createServiceAndController(Service);
  await fastify.register(async (instance) => {
    createCrudRouter(instance, controller, {
      tag: 'Service',
      basePath: '/services',
      schemas: serviceSchemas,
      auth: {
        list: permissions.services.list,
        get: permissions.services.get,
        create: permissions.services.create,
        update: permissions.services.update,
        remove: permissions.services.remove,
      },
    });
  }, { prefix: '/services' });
}

export default fp(servicePlugin, { name: 'service-plugin' });


