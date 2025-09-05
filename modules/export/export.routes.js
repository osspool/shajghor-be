import express from 'express';
import { Parser as CsvParser } from 'json2csv';
import ExcelJS from 'exceljs';
import { withAuth } from '#routes/utils/compose.js';
import { registerPath, registerTag } from '#common/docs/apiDocs.js';
import permissions from '#config/permissions.js';

const router = express.Router();

// Generic CSV export for any collection via query params
router.get('/csv', ...withAuth(permissions.export.any), async (req, res, next) => {
  try {
    const { collection, select, filter } = req.query;
    if (!collection) return res.status(400).json({ message: 'collection is required' });

    const Model = (await import(`#modules/${collection}/${collection}.model.js`)).default;
    const criteria = filter ? JSON.parse(filter) : {};
    const fields = select ? select.split(',') : undefined;
    const docs = await Model.find(criteria).select(fields).lean();

    const parser = new CsvParser({ fields: fields || Object.keys(docs[0] || {}) });
    const csv = parser.parse(docs);
    res.header('Content-Type', 'text/csv');
    res.attachment(`${collection}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});
registerPath('/export/csv', 'get', { tags: ['Export'], summary: 'Export data as CSV' });

// Generic XLSX export
router.get('/xlsx', ...withAuth(permissions.export.any), async (req, res, next) => {
  try {
    const { collection, select, filter } = req.query;
    if (!collection) return res.status(400).json({ message: 'collection is required' });

    const Model = (await import(`#modules/${collection}/${collection}.model.js`)).default;
    const criteria = filter ? JSON.parse(filter) : {};
    const fields = select ? select.split(',') : undefined;
    const docs = await Model.find(criteria).select(fields).lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    const headers = fields || Object.keys(docs[0] || {});
    sheet.addRow(headers);
    docs.forEach((doc) => sheet.addRow(headers.map((h) => doc[h])));

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`${collection}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});
registerPath('/export/xlsx', 'get', { tags: ['Export'], summary: 'Export data as XLSX' });
registerTag('Export');

export default router;


