import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

const organizationSchema = new Schema({
  name: { type: String, required: true, trim: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String, lowercase: true, trim: true },
  // Billing / subscription settings
  billingPrice: { type: Number, default: 0, min: 0 },
  billingCurrency: { type: String, default: 'BDT' },
  lastPaidAt: { type: Date },
  lastPaidMethod: { type: String }, // e.g., bkash, nagad, bank
  billingNotes: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ isActive: 1 });

organizationSchema.plugin(mongoosePaginate);
organizationSchema.plugin(aggregatePaginate);

const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
export default Organization;


