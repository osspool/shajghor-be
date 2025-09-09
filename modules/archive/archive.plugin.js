import Archive from './archive.model.js';
import fp from 'fastify-plugin';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import archiveSchemas, { archiveRunQuery } from './schemas.js';
import permissions from '#config/permissions.js';
import archiveService from './archive.service.js';
import fs from 'node:fs/promises';

async function archivePlugin(fastify, opts) {
  const { controller } = createServiceAndController(Archive, { service: archiveService });
  await fastify.register(async (instance) => {
    createCrudRouter(instance, controller, {
      tag: 'Archive', basePath: '/archives', schemas: archiveSchemas, auth: permissions.transactions,
      additionalRoutes: [
        { method: 'post', path: '/run', schemas: { body: archiveRunQuery }, summary: 'Run archive for bookings or transactions and delete originals', authRoles: permissions.transactions.remove,
          handler: async (request, reply) => {
            const archive = await archiveService.runArchive({ ...(request.validated?.body || request.body) }, { context: request.context });
            reply.code(201).send({ success: true, data: archive });
          }
        },
        { method: 'get', path: '/download/:id', schemas: { params: archiveSchemas.get?.params }, summary: 'Download archive file', authRoles: permissions.transactions.get,
          handler: async (request, reply) => {
            const arch = await archiveService.getById(request.params.id, {});
            const stat = await fs.stat(arch.filePath).catch(() => null);
            if (!stat) return reply.code(404).send({ success: false, message: 'Archive file not found' });
            reply.download ? reply.download(arch.filePath) : reply.sendFile ? reply.sendFile(arch.filePath) : reply.send({ path: arch.filePath });
          }
        },
        { method: 'delete', path: '/purge/:id', summary: 'Superadmin purge archive and file', authRoles: ['superadmin'],
          handler: async (request, reply) => {
            const roles = Array.isArray(request.user?.roles) ? request.user.roles : (request.user?.roles ? [request.user.roles] : []);
            if (!roles.includes('superadmin')) return reply.code(403).send({ success: false, message: 'Forbidden' });
            const arch = await archiveService.getById(request.params.id, {});
            await archiveService.delete(request.params.id, {});
            await fs.unlink(arch.filePath).catch(() => null);
            reply.code(200).send({ success: true, message: 'Archive purged' });
          }
        },
      ],
    });
  }, { prefix: '/archives' });
}

export default fp(archivePlugin, { name: 'archive-plugin' });


