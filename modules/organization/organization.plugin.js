import Organization from './organization.model.js';
import fp from 'fastify-plugin';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import organizationSchemas from './schemas.js';
import permissions from '#config/permissions.js';

async function organizationPlugin(fastify, opts) {
  const { controller } = createServiceAndController(Organization);
  await fastify.register(async (instance) => {
    createCrudRouter(instance, controller, {
      tag: 'Organization', basePath: '/organizations', schemas: organizationSchemas, auth: permissions.organizations,
    });
  }, { prefix: '/organizations' });
}

export default fp(organizationPlugin, { name: 'organization-plugin' });


