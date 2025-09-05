import fs from 'node:fs/promises';
import path from 'node:path';
import BaseService from '#common/services/baseService.js';
import Archive from './archive.model.js';
import Booking from '#modules/booking/booking.model.js';
import Transaction from '#modules/transaction/transaction.model.js';

const ARCHIVE_DIR = path.resolve(process.cwd(), 'storage', 'archives');

export class ArchiveService extends BaseService {
  constructor(model = Archive) {
    super(model);
  }

  async ensureDir() {
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });
    return ARCHIVE_DIR;
  }

  async runArchive({ type, organizationId, parlourId, rangeFrom, rangeTo, ttlDays }, options = {}) {
    await this.ensureDir();
    const from = rangeFrom ? new Date(rangeFrom) : new Date(0);
    const to = rangeTo ? new Date(rangeTo) : new Date();
    const match = { createdAt: { $gte: from, $lte: to } };
    if (organizationId) match.organizationId = organizationId;
    if (parlourId) match.parlourId = parlourId;

    const Model = type === 'booking' ? Booking : Transaction;
    const cursor = Model.find(match).lean().cursor();
    const fileName = `${type}-${organizationId || 'org'}-${parlourId || 'parlour'}.json`;
    const filePath = path.join(ARCHIVE_DIR, fileName);
    let count = 0;
    let sizeBytes = 0;
    const fd = await fs.open(filePath, 'w');
    await fd.write('[\n');
    let first = true;
    for await (const doc of cursor) {
      const chunk = (first ? '' : ',\n') + JSON.stringify(doc);
      first = false;
      await fd.write(chunk);
      count += 1;
      sizeBytes += Buffer.byteLength(chunk);
    }
    await fd.write('\n]');
    await fd.close();

    // Calculate TTL for archive document auto-removal
    const expiresAt = ttlDays ? new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000) : undefined;
    // Upsert single archive per type/org/parlour to avoid multiple files
    const archive = await this.Model.findOneAndUpdate(
      { type, organizationId, parlourId },
      { $set: { rangeFrom: from, rangeTo: to, filePath, format: 'json', recordCount: count, sizeBytes, expiresAt, archivedAt: new Date() } },
      { upsert: true, new: true }
    );

    // Delete archived records (hard delete) for partial cleanup
    await Model.deleteMany(match);

    return archive;
  }

  async cleanupExpiredAndOrphans() {
    await this.ensureDir();
    // 1) Remove expired archives (delete file and doc)
    const now = new Date();
    const expired = await this.Model.find({ expiresAt: { $lte: now } }).lean();
    for (const doc of expired) {
      await fs.unlink(doc.filePath).catch(() => null);
      await this.Model.deleteOne({ _id: doc._id });
    }

    // 2) Remove orphan files that have no corresponding DB record
    const files = await fs.readdir(ARCHIVE_DIR).catch(() => []);
    const docs = await this.Model.find({}).select('filePath').lean();
    const valid = new Set(docs.map(d => d.filePath));
    for (const f of files) {
      const full = path.join(ARCHIVE_DIR, f);
      if (!valid.has(full)) {
        await fs.unlink(full).catch(() => null);
      }
    }
  }
}

const archiveService = new ArchiveService();
export default archiveService;


