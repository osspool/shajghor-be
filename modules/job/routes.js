// modules/job/routes.js
import express from 'express';
import Job from './job.model.js';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';

const router = express.Router();

// Provide optional customization points per module
const { service, controller } = createServiceAndController(Job, {
  // configure lookup keys if needed for nested filters in BaseService aggregation
  lookups: {
    // Example: 'organization.name': { from: 'organizations', localField: 'organization', foreignField: '_id', as: 'organization_lookup' }
  },
});

// Standard CRUD routes
router.use('/', createCrudRouter(controller));

export default router;