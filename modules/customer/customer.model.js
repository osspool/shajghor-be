import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

const customerSchema = new Schema({
  // Optional link to a registered user account
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  // CRM: which parlours this customer visited
  parlourIds: [{ type: Schema.Types.ObjectId, ref: 'Parlour' }],
}, { timestamps: true });

customerSchema.index({ phone: 1 }, { unique: true });


customerSchema.plugin(mongoosePaginate);
customerSchema.plugin(aggregatePaginate);

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
export default Customer;


