import Employee from './employee.model.js';
import fp from 'fastify-plugin';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import employeeSchemas, { employeePaySalaryBody } from './schemas.js';
import employeeService from './employee.service.js';
import permissions from '#config/permissions.js';

async function employeePlugin(fastify, opts) {
  const { controller } = createServiceAndController(Employee, { service: employeeService });

  const populateUserOnList = async (request, reply) => {
    request.validated = request.validated || {};
    const q = request.validated.query || {};
    if (!q.populate) q.populate = { path: 'userId', select: 'name email phone' };
    request.validated.query = q;
  };

  await fastify.register(async (instance) => {
    createCrudRouter(instance, controller, {
      tag: 'Employee', basePath: '/employees', schemas: employeeSchemas,
      auth: {
        list: permissions.users.list,
        get: permissions.users.get,
        create: permissions.users.update,
        update: permissions.users.update,
        remove: permissions.users.remove,
      },
      middlewares: { list: [populateUserOnList] },
      additionalRoutes: [
        { method: 'post', path: '/:id/pay-salary',
          handler: async (request, reply) => {
            const { id } = request.params;
            const result = await employeeService.paySalary(id, request.body, { context: request.context });
            reply.code(200).send({ success: true, ...result });
          },
          schemas: { params: employeeSchemas.get?.params, body: employeePaySalaryBody },
          summary: 'Pay salary for an employee and record expense transaction',
          authRoles: permissions.transactions.create,
        },
      ],
    });
  }, { prefix: '/employees' });
}

export default fp(employeePlugin, { name: 'employee-plugin' });


