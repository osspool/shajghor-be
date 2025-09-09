import fp from 'fastify-plugin';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import subscriptionSchemas from './schemas.js';
import permissions from '#config/permissions.js';
import Subscription from './subscription.model.js';
import { createWhitelistForNonSuperadmin } from '#common/guards/superadminFields.guard.js';

async function subscriptionPlugin(fastify, opts) {
  const { controller } = createServiceAndController(Subscription);
  const whitelistNonSuper = createWhitelistForNonSuperadmin(['paymentRequest']);
  await fastify.register(async (instance) => {
    createCrudRouter(instance, controller, {
      tag: 'Subscription', basePath: '/subscriptions', schemas: subscriptionSchemas, auth: permissions.subscriptions || { list: ['admin'], get: ['admin'], create: ['admin'], update: ['admin'], remove: ['admin'] },
      middlewares: {
        // Scope non-superadmins to their organization for listing and getting subscriptions
        list: [instance.organizationScoped()],
        get: [instance.ownershipGuard({ model: Subscription })],
        create: [instance.organizationScoped()],
        update: [instance.ownershipGuard({ model: Subscription }), whitelistNonSuper],
        remove: [instance.ownershipGuard({ model: Subscription })],
      },
    });
  }, { prefix: '/subscriptions' });
}

export default fp(subscriptionPlugin, { name: 'subscription-plugin' });


