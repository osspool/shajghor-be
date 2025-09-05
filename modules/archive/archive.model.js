import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

const archiveSchema = new Schema({
  type: { type: String, enum: ['booking', 'transaction'], required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  parlourId: { type: Schema.Types.ObjectId, ref: 'Parlour' },
  rangeFrom: { type: Date },
  rangeTo: { type: Date },
  filePath: { type: String, required: true },
  format: { type: String, enum: ['json'], default: 'json' },
  recordCount: { type: Number, default: 0 },
  sizeBytes: { type: Number, default: 0 },
  archivedAt: { type: Date, default: () => new Date() },
  expiresAt: { type: Date }, // TTL target (auto-delete doc). File cleanup handled by cron
  notes: { type: String },
}, { timestamps: true });

archiveSchema.index({ type: 1, archivedAt: -1 });
archiveSchema.index({ organizationId: 1, parlourId: 1 });
archiveSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
archiveSchema.index({ type: 1, organizationId: 1, parlourId: 1 }, { unique: true, sparse: true });

archiveSchema.plugin(mongoosePaginate);
archiveSchema.plugin(aggregatePaginate);

const Archive = mongoose.models.Archive || mongoose.model('Archive', archiveSchema);
export default Archive;


