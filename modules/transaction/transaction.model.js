import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { TRANSACTION_TYPE_VALUES, TRANSACTION_CATEGORY_VALUES } from '#common/constants/enums.js';

const { Schema } = mongoose;

const transactionSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  parlourId: { type: Schema.Types.ObjectId, ref: 'Parlour', required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: TRANSACTION_TYPE_VALUES, required: true },
  category: { type: String, enum: TRANSACTION_CATEGORY_VALUES, trim: true }, // e.g., booking, capital_injection, owner_withdrawal, salary, cash_adjustment
  amount: { type: Number, required: true, min: 0 },
  // Bangladesh-friendly payment methods
  method: { type: String, enum: ['cash', 'bkash', 'nagad', 'bank', 'online'], required: true },
  // Optional payment details for local providers
  paymentDetails: {
    provider: { type: String }, // bkash/nagad/bank/online
    walletNumber: { type: String }, // bkash/nagad number
    transactionId: { type: String }, // bkash trxID, nagad txnId, bank slip/reference
    bankName: { type: String },
    accountNumber: { type: String },
    senderName: { type: String },
  },
  reference: { type: String },
  notes: { type: String },
  idempotencyKey: { type: String },
  date: { type: Date, default: () => new Date() },
}, { timestamps: true });

transactionSchema.index({ parlourId: 1, date: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ parlourId: 1, customerId: 1 }, { sparse: true });
transactionSchema.index(
  { parlourId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

transactionSchema.plugin(mongoosePaginate);
transactionSchema.plugin(aggregatePaginate);

// TTL like behavior via partial TTL index on createdAt for records older than 15 months
transactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { createdAt: { $lt: new Date(Date.now() - 15 * 30 * 24 * 60 * 60 * 1000) } } });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
export default Transaction;


