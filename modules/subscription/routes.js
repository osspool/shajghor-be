import express from 'express';
import Subscription from './subscription.model.js';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import { subscriptionSchemas } from './schemas.js';
import permissions from '#config/permissions.js';

const router = express.Router();

const { controller } = createServiceAndController(Subscription);

router.use('/', createCrudRouter(controller, {
  tag: 'Subscription',
  basePath: '/subscriptions',
  schemas: subscriptionSchemas,
  auth: {
    list: permissions.subscriptions?.list || ['admin'],
    get: permissions.subscriptions?.get || ['admin'],
    create: permissions.subscriptions?.create || ['admin'],
    update: permissions.subscriptions?.update || ['admin'],
    remove: permissions.subscriptions?.remove || ['admin'],
  },
}));

export default router;


