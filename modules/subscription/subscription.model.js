import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

const subscriptionSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  planName: { type: String, default: 'custom' },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'BDT' },
  billingCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'custom'], default: 'monthly' },
  status: { type: String, enum: ['active', 'inactive', 'pending', 'expired'], default: 'pending' },
  // Payment request submitted by org (manual verification)
  paymentRequest: {
    method: { type: String }, // bkash, nagad, bank
    senderAccount: { type: String }, // mobile no / bank account
    reference: { type: String },
    amount: { type: Number },
    transactionDate: { type: Date },
    notes: { type: String },
  },
  // Admin verification
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  periodStart: { type: Date },
  periodEnd: { type: Date },
}, { timestamps: true });

subscriptionSchema.index({ organizationId: 1, status: 1 });

subscriptionSchema.plugin(mongoosePaginate);
subscriptionSchema.plugin(aggregatePaginate);

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
export default Subscription;


