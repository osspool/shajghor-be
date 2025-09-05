import express from 'express';
import Customer from './customer.model.js';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import { customerSchemas } from './schemas.js';
import permissions from '#config/permissions.js';

const router = express.Router();

const { controller } = createServiceAndController(Customer);

router.use('/', createCrudRouter(controller, {
  tag: 'Customer',
  basePath: '/customers',
  schemas: customerSchemas,
  auth: {
    list: permissions.customers.list,
    get: permissions.customers.get,
    create: permissions.customers.create,
    update: permissions.customers.update,
    remove: permissions.customers.remove,
  },
}));

export default router;


