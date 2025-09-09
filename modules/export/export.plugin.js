import fp from 'fastify-plugin';
import permissions from '#config/permissions.js';
import { stringify as csvStringify } from 'csv-stringify/sync';
import * as XLSX from 'xlsx';

async function exportPlugin(fastify, opts) {
  const auth = async (request, reply) => {
    if (!request.user) return reply.code(401).send({ success: false, message: 'Unauthorized' });
    const roles = Array.isArray(request.user.roles) ? request.user.roles : (request.user.roles ? [request.user.roles] : []);
    const allowed = permissions.export.any || [];
    if (allowed.length && !roles.some((r)=>allowed.includes(r)) && !roles.includes('superadmin')) return reply.code(403).send({ success: false, message: 'Forbidden' });
  };

  fastify.get('/export/csv', { preHandler: [auth] }, async (request, reply) => {
    const { collection, select, filter } = request.query || {};
    if (!collection) return reply.code(400).send({ message: 'collection is required' });
    const Model = (await import(`#modules/${collection}/${collection}.model.js`)).default;
    const criteria = filter ? JSON.parse(filter) : {};
    const fields = select ? select.split(',') : undefined;
    const docs = await Model.find(criteria).select(fields).lean();
    const headers = fields || Object.keys(docs[0] || {});
    const csv = csvStringify(docs, { header: true, columns: headers });
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', `attachment; filename="${collection}.csv"`);
    reply.send(csv);
  });

  fastify.get('/export/xlsx', { preHandler: [auth] }, async (request, reply) => {
    const { collection, select, filter } = request.query || {};
    if (!collection) return reply.code(400).send({ message: 'collection is required' });
    const Model = (await import(`#modules/${collection}/${collection}.model.js`)).default;
    const criteria = filter ? JSON.parse(filter) : {};
    const fields = select ? select.split(',') : undefined;
    const docs = await Model.find(criteria).select(fields).lean();
    const headers = fields || Object.keys(docs[0] || {});
    const worksheet = XLSX.utils.json_to_sheet(docs, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', `attachment; filename="${collection}.xlsx"`);
    reply.send(buffer);
  });
}

export default fp(exportPlugin, { name: 'export-plugin' });


