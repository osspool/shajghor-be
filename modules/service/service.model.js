import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

const serviceSchema = new Schema({
  parlourId: { type: Schema.Types.ObjectId, ref: 'Parlour', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  duration: { type: Number, required: true, min: 1 },
  category: { type: String, trim: true },
  isFeatured: { type: Boolean, default: false },
  isDiscount: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

serviceSchema.index({ parlourId: 1, isActive: 1 });
serviceSchema.index({ category: 1 });

serviceSchema.plugin(mongoosePaginate);
serviceSchema.plugin(aggregatePaginate);

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
export default Service;


