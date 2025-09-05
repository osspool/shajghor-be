import express from 'express';
import Service from './service.model.js';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import { serviceSchemas } from './schemas.js';
import permissions from '#config/permissions.js';

const router = express.Router();

const { controller } = createServiceAndController(Service);

router.use('/', createCrudRouter(controller, {
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
}));

export default router;


