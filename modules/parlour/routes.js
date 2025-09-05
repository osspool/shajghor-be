import express from 'express';
import Parlour from './parlour.model.js';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import { parlourSchemas, parlourGetBySlugParams, parlourGetByOwnerParams } from './schemas.js';
import permissions from '#config/permissions.js';
import { validate } from '#common/middlewares/validate.js';
import Employee from '#modules/employee/employee.model.js';

const router = express.Router();

const { controller } = createServiceAndController(Parlour);

router.use('/', createCrudRouter(controller, {
  tag: 'Parlour',
  basePath: '/parlours',
  schemas: parlourSchemas,
  auth: {
    list: permissions.parlours.list,
    get: permissions.parlours.get,
    create: permissions.parlours.create,
    update: permissions.parlours.update,
    remove: permissions.parlours.remove,
  },
  additionalRoutes: [
    {
      method: 'get',
      path: '/slug/:slug',
      handler: async (req, res, next) => {
        try {
          const slug = (req.validated?.params?.slug) || req.params.slug;
          const doc = await controller.service.getByQuery({ slug });
          res.status(200).json({ success: true, data: doc });
        } catch (err) { next(err); }
      },
      schemas: { params: parlourGetBySlugParams },
      summary: 'Get parlour by slug',
      authRoles: permissions.parlours.get,
    },
    {
      method: 'get',
      path: '/owner/:ownerId',
      handler: async (req, res, next) => {
        try {
          const ownerId = (req.validated?.params?.ownerId) || req.params.ownerId;
          const user = req.user;
          let query = {};
          if (user && Array.isArray(user.roles) && user.roles.includes('employee')) {
            // Resolve parlour via employee mapping
            const mapping = await Employee.findOne({ userId: user._id, active: true }).select('parlourId').lean();
            if (!mapping) return res.status(404).json({ success: false, message: 'No parlour mapping for employee' });
            query = { _id: mapping.parlourId };
          } else {
            query = { ownerId };
          }
          const doc = await controller.service.getByQuery(query, { populate: 'organizationId' });
          res.status(200).json({ success: true, data: doc });
        } catch (err) { next(err); }
      },
      schemas: { params: parlourGetByOwnerParams },
      summary: 'Get parlour by owner id',
      authRoles: permissions.parlours.get,
    },
  ],
}));

export default router;


