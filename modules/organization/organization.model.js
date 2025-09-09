import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import User from '#modules/auth/user.model.js';

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

// Validate ownerId references an existing user
organizationSchema.pre('validate', async function(next) {
  try {
    const ownerId = this.ownerId;
    if (!ownerId) return next();
    const userExists = await User.exists({ _id: ownerId });
    if (!userExists) {
      return next(new Error('Invalid ownerId: user does not exist'));
    }
    next();
  } catch (err) {
    next(err);
  }
});

// After creating an organization, set the owner's organization field if empty
organizationSchema.post('save', async function(doc, next) {
  try {
    const ownerId = doc.ownerId;
    await User.updateOne(
      { _id: ownerId, $or: [ { organization: { $exists: false } }, { organization: null } ] },
      { $set: { organization: doc._id } }
    );
    next();
  } catch (err) {
    next(err);
  }
});

// When ownerId changes via updates, reflect the change on users
organizationSchema.post('findOneAndUpdate', async function(doc) {
  try {
    if (!doc) return;
    const update = this.getUpdate() || {};
    // Support both direct set and $set
    const newOwnerId = update.ownerId || (update.$set && update.$set.ownerId);
    if (!newOwnerId) return;

    const orgId = doc._id;
    const previous = await this.model.findById(orgId).select('ownerId').lean();
    const prevOwnerId = previous?.ownerId?.toString();
    const nextOwnerId = String(newOwnerId);
    if (prevOwnerId && prevOwnerId !== nextOwnerId) {
      // Clear old owner's organization if it was pointing to this org
      await User.updateOne(
        { _id: prevOwnerId, organization: orgId },
        { $unset: { organization: '' } }
      );
    }
    // Set new owner's organization
    await User.updateOne(
      { _id: nextOwnerId },
      { $set: { organization: orgId } }
    );
  } catch (err) {
    // swallow, do not block the main operation
  }
});

const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
export default Organization;


