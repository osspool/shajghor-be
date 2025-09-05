import express from 'express';
import Organization from './organization.model.js';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import { organizationSchemas } from './schemas.js';
import permissions from '#config/permissions.js';

const router = express.Router();

const { controller } = createServiceAndController(Organization);

router.use('/', createCrudRouter(controller, {
  tag: 'Organization',
  basePath: '/organizations',
  schemas: organizationSchemas,
  auth: {
    list: permissions.organizations.list,
    get: permissions.organizations.get,
    create: permissions.organizations.create,
    update: permissions.organizations.update,
    remove: permissions.organizations.remove,
  },
}));

export default router;


