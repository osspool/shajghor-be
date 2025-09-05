import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

const workingHoursSchema = new Schema({
  isOpen: { type: Boolean, default: false },
  startTime: { type: String }, // 'HH:mm'
  endTime: { type: String },   // 'HH:mm'
}, { _id: false });

const parlourSchema = new Schema({
  slug: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  address: { type: String },
  phone: { type: String },
  email: { type: String, lowercase: true, trim: true },
  coverImage: { type: String },
  socialLinks: { type: Map, of: String, default: {} },
  socialMediaUrl: {
    instagram: { type: String },
    facebook: { type: String },
    tiktok: { type: String },
    youtube: { type: String },
    website: { type: String },
  },
  workingHours: { type: Map, of: workingHoursSchema, default: {} },
  breaks: [{ startTime: { type: String }, endTime: { type: String } }],
  providerType: { type: String, enum: ['salon', 'artist'], default: 'salon' },
  serviceTypes: { type: [String], default: [] },
  serviceLocationMode: { type: String, enum: ['in-salon', 'at-home', 'both'], default: 'in-salon' },
  capacity: { type: Number, default: 1, min: 1 },
  slotDurationMinutes: { type: Number, default: 30, min: 5 },
  leadTimeMinutes: { type: Number, default: 0, min: 0 },
  dailyCutoffTime: { type: String },
  isActive: { type: Boolean, default: true },
  hasOffers: { type: Boolean, default: false },
  offerText: { type: String },
  about: {
    title: { type: String },
    description: { type: String },
    features: { type: [String], default: [] },
  },
  portfolio: { type: [String], default: [] },
  // advert: { array of objects in seperate model  add in future
  //   running: { type: Boolean, default: false },
  //   startTime: { type: String },
  //   endTime: { type: String },
  //   adImage: { type: String },
  //   adLink: { type: String },
  //   adText: { type: String },
  //   adButtonText: { type: String },
  // }
}, { timestamps: true });

parlourSchema.index({ slug: 1 }, { unique: true });
parlourSchema.index({ ownerId: 1 }, { unique: true, sparse: true });
parlourSchema.index({ organizationId: 1 }, { sparse: true });
parlourSchema.index({ isActive: 1 });

parlourSchema.plugin(mongoosePaginate);
parlourSchema.plugin(aggregatePaginate);

const Parlour = mongoose.models.Parlour || mongoose.model('Parlour', parlourSchema);
export default Parlour;


