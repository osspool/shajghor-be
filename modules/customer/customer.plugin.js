import Customer from './customer.model.js';
import fp from 'fastify-plugin';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import customerSchemas from './schemas.js';
import permissions from '#config/permissions.js';

async function customerPlugin(fastify, opts) {
  const { controller } = createServiceAndController(Customer);
  await fastify.register(async (instance) => {
    createCrudRouter(instance, controller, {
      tag: 'Customer', basePath: '/customers', schemas: customerSchemas, auth: permissions.customers,
    });
  }, { prefix: '/customers' });
}

export default fp(customerPlugin, { name: 'customer-plugin' });


