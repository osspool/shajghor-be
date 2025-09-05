import express from 'express';
import Archive from './archive.model.js';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import { archiveSchemas, archiveRunQuery } from './schemas.js';
import permissions from '#config/permissions.js';
import archiveService from './archive.service.js';
import { validate } from '#common/middlewares/validate.js';
import fs from 'node:fs/promises';

const router = express.Router();

const { controller } = createServiceAndController(Archive, { service: archiveService });

router.use('/', createCrudRouter(controller, {
  tag: 'Archive',
  basePath: '/archives',
  schemas: archiveSchemas,
  auth: {
    list: permissions.transactions.list,
    get: permissions.transactions.get,
    create: permissions.transactions.create,
    update: permissions.transactions.update,
    remove: permissions.transactions.remove,
  },
  additionalRoutes: [
    {
      method: 'post',
      path: '/run',
      handler: async (req, res, next) => {
        try {
          const archive = await archiveService.runArchive({ ...(req.validated?.body || req.body) }, { context: req.context });
          res.status(201).json({ success: true, data: archive });
        } catch (err) { next(err); }
      },
      schemas: { body: archiveRunQuery },
      summary: 'Run archive for bookings or transactions and delete originals',
      authRoles: permissions.transactions.remove,
    },
    {
      method: 'get',
      path: '/download/:id',
      handler: async (req, res, next) => {
        try {
          const arch = await archiveService.getById(req.params.id, {});
          const stat = await fs.stat(arch.filePath).catch(() => null);
          if (!stat) return res.status(404).json({ success: false, message: 'Archive file not found' });
          res.download(arch.filePath);
        } catch (err) { next(err); }
      },
      schemas: { params: archiveSchemas.get?.params },
      summary: 'Download archive file',
      authRoles: permissions.transactions.get,
    },
    // Superadmin: purge archive doc (and optionally file)
    {
      method: 'delete',
      path: '/purge/:id',
      handler: async (req, res, next) => {
        try {
          const roles = Array.isArray(req.user?.roles) ? req.user.roles : (req.user?.roles ? [req.user.roles] : []);
          if (!roles.includes('superadmin')) return res.status(403).json({ success: false, message: 'Forbidden' });
          const arch = await archiveService.getById(req.params.id, {});
          await archiveService.delete(req.params.id, {});
          await fs.unlink(arch.filePath).catch(() => null);
          res.status(200).json({ success: true, message: 'Archive purged' });
        } catch (err) { next(err); }
      },
      summary: 'Superadmin purge archive and file',
      authRoles: ['superadmin'],
    },
  ],
}));

export default router;


