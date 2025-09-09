// modules/job/plugin.js
import Job from './job.model.js';
import fp from 'fastify-plugin';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';

async function jobPlugin(fastify, opts) {
  const { controller } = createServiceAndController(Job, { lookups: {} });
  await fastify.register(async (instance) => {
    createCrudRouter(instance, controller, { tag: 'Job', basePath: '/jobs', schemas: {}, auth: {} });
  }, { prefix: '/jobs' });
}

export default fp(jobPlugin, { name: 'job-plugin' });