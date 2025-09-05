import express from 'express';
import Employee from './employee.model.js';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import { employeeSchemas, employeePaySalaryBody, employeeGetParams } from './schemas.js';
import employeeService from './employee.service.js';
import permissions from '#config/permissions.js';

const router = express.Router();

const { controller } = createServiceAndController(Employee, { service: employeeService });

// Default populate userId when listing employees
const populateUserOnList = (req, res, next) => {
  try {
    req.validated = req.validated || {};
    const q = req.validated.query || {};
    if (!q.populate) {
      // Use object populate with select for cleanliness
      q.populate = { path: 'userId', select: 'name email phone' };
    }
    req.validated.query = q;
  } catch (e) {}
  next();
};

router.use('/', createCrudRouter(controller, {
  tag: 'Employee',
  basePath: '/employees',
  schemas: employeeSchemas,
  auth: {
    list: permissions.users.list,
    get: permissions.users.get,
    create: permissions.users.update,
    update: permissions.users.update,
    remove: permissions.users.remove,
  },
  middlewares: {
    list: [populateUserOnList],
  },
  additionalRoutes: [
    {
      method: 'post',
      path: '/:id/pay-salary',
      handler: async (req, res, next) => {
        try {
          const { id } = req.params;
          const result = await employeeService.paySalary(id, req.body, { context: req.context });
          res.status(200).json({ success: true, ...result });
        } catch (err) { next(err); }
      },
      schemas: { params: employeeGetParams, body: employeePaySalaryBody },
      summary: 'Pay salary for an employee and record expense transaction',
      authRoles: permissions.transactions.create,
    },
  ],
}));

export default router;


