import mongoose from 'mongoose';

/**
 * Upsert/link Customer and mirror user-parlour relation from a Booking-like document
 * Safe to call from Mongoose hooks (save/findOneAndUpdate).
 * - Upserts Customer by doc.customerId or doc.customerPhone
 * - Sets customerId on Booking if missing
 * - Mirrors visitedParlourIds on linked User
 *
 * @param {Object} doc - Booking mongoose document or plain object with booking fields
 */
export async function upsertCustomerFromBookingDoc(doc) {
  if (!doc) return;

  const Customer = mongoose.model('Customer');
  const User = mongoose.model('User');

  if (!(doc.customerPhone || doc.customerId)) return;

  const customerFilter = doc.customerId ? { _id: doc.customerId } : { phone: doc.customerPhone };
  const customerUpdate = {
    $setOnInsert: {
      name: doc.customerName,
      phone: doc.customerPhone,
    },
    $addToSet: { parlourIds: doc.parlourId },
  };

  let linkedUserId = undefined;
  if (doc.customerPhone) {
    const userMatch = await User.findOne({ phone: doc.customerPhone }).select('_id').lean();
    if (userMatch) linkedUserId = userMatch._id;
  }

  const customer = await Customer.findOneAndUpdate(
    customerFilter,
    { ...customerUpdate, ...(linkedUserId ? { $set: { userId: linkedUserId } } : {}) },
    { upsert: true, new: true }
  );

  if (!doc.customerId && customer && customer._id) {
    await mongoose.model('Booking').updateOne({ _id: doc._id }, { $set: { customerId: customer._id } });
  }

  if (linkedUserId) {
    await User.updateOne({ _id: linkedUserId }, { $addToSet: { visitedParlourIds: doc.parlourId } });
  }
}

export default {
  upsertCustomerFromBookingDoc,
};


