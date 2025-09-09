import mongoose from 'mongoose';
import Transaction from './transaction.model.js';
import Booking from '#modules/booking/booking.model.js';

export async function receivePayment(request, reply) {
  try {
    const {
      parlourId,
      organizationId,
      bookingId,
      customerId,
      amount,
      method,
      paymentDetails,
      reference,
      notes,
      date,
      category,
    } = request.body;

    const payload = {
      parlourId,
      organizationId: organizationId || request.context?.organizationId,
      bookingId,
      customerId,
      type: 'income',
      category: category || (bookingId ? 'booking' : 'other'),
      amount,
      method,
      paymentDetails,
      reference,
      notes,
      date: date ? new Date(date) : new Date(),
      handledBy: request.user?._id,
      idempotencyKey: request.body?.idempotencyKey,
    };

    // Strip falsy idempotencyKey to avoid unique index conflicts on null/empty
    if (!payload.idempotencyKey) delete payload.idempotencyKey;

    // Idempotent insert by idempotencyKey (if provided)
    let doc;
    if (payload.idempotencyKey) {
      doc = await Transaction.findOneAndUpdate(
        { parlourId, idempotencyKey: payload.idempotencyKey },
        { $setOnInsert: payload },
        { upsert: true, new: true }
      );
    } else {
      doc = await Transaction.create(payload);
    }

    // Also return a simple payment summary when bookingId is present
    let summary = null;
    if (bookingId) {
      const booking = await Booking.findById(bookingId).select('totalAmount additionalCost');
      const paidAgg = await Transaction.aggregate([
        { $match: { bookingId: new mongoose.Types.ObjectId(String(bookingId)), type: 'income' } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]);
      const refundedAgg = await Transaction.aggregate([
        { $match: { bookingId: new mongoose.Types.ObjectId(String(bookingId)), type: 'expense', category: 'refund' } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]);
      const totalDue = (booking?.totalAmount || 0) + (booking?.additionalCost || 0);
      const paid = paidAgg[0]?.sum || 0;
      const refunded = refundedAgg[0]?.sum || 0;
      summary = { totalDue, paid, refunded, balance: totalDue - paid + refunded };

      // Update booking paymentStatus and last paymentMethod
      let paymentStatus = 'pending';
      if (paid - refunded >= totalDue && totalDue > 0) {
        paymentStatus = 'paid';
      } else if (refunded >= paid && paid > 0) {
        paymentStatus = 'refunded';
      }
      await Booking.updateOne({ _id: bookingId }, { $set: { paymentStatus, paymentMethod: method } });
    }

    return reply.code(201).send({ success: true, data: doc, summary });
  } catch (err) {
    return reply.code(500).send({ message: 'Failed to record payment' });
  }
}

export async function capitalInjection(request, reply) {
  try {
    const body = request.body || {};
    const payload = {
      ...body,
      organizationId: body.organizationId || request.context?.organizationId,
      type: 'income',
      category: 'capital_injection',
      handledBy: request.user?._id,
    };
    if (!payload.idempotencyKey) delete payload.idempotencyKey;
    const doc = await Transaction.create(payload);
    return reply.code(201).send({ success: true, data: doc });
  } catch (err) { return reply.code(500).send({ message: 'Failed to record capital injection' }); }
}

export async function ownerWithdrawal(request, reply) {
  try {
    const body = request.body || {};
    const payload = {
      ...body,
      organizationId: body.organizationId || request.context?.organizationId,
      type: 'expense',
      category: 'owner_withdrawal',
      handledBy: request.user?._id,
    };
    if (!payload.idempotencyKey) delete payload.idempotencyKey;
    const doc = await Transaction.create(payload);
    return reply.code(201).send({ success: true, data: doc });
  } catch (err) { return reply.code(500).send({ message: 'Failed to record owner withdrawal' }); }
}

export async function refundPayment(request, reply) {
  try {
    const { bookingId, amount, method, paymentDetails, reference, notes, date, parlourId, organizationId, customerId } = request.body;
    const payload = {
      bookingId,
      amount,
      method,
      paymentDetails,
      reference,
      notes,
      date: date ? new Date(date) : new Date(),
      parlourId,
      organizationId: organizationId || request.context?.organizationId,
      customerId,
      type: 'expense',
      category: 'refund',
      handledBy: request.user?._id,
    };
    if (!payload.idempotencyKey) payload.idempotencyKey = request.body?.idempotencyKey;
    if (!payload.idempotencyKey) delete payload.idempotencyKey;
    let doc;
    if (payload.idempotencyKey) {
      doc = await Transaction.findOneAndUpdate(
        { parlourId, idempotencyKey: payload.idempotencyKey },
        { $setOnInsert: payload },
        { upsert: true, new: true }
      );
    } else {
      doc = await Transaction.create(payload);
    }

    // Payment summary after refund
    const booking = await Booking.findById(bookingId).select('totalAmount additionalCost');
    const paidAgg = await Transaction.aggregate([
      { $match: { bookingId: new mongoose.Types.ObjectId(String(bookingId)), type: 'income' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);
    const refundedAgg = await Transaction.aggregate([
      { $match: { bookingId: new mongoose.Types.ObjectId(String(bookingId)), type: 'expense', category: 'refund' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);
    const totalDue = (booking?.totalAmount || 0) + (booking?.additionalCost || 0);
    const paid = paidAgg[0]?.sum || 0;
    const refunded = refundedAgg[0]?.sum || 0;
    const summary = { totalDue, paid, refunded, balance: totalDue - paid + refunded };

    // Update booking paymentStatus after refund
    let paymentStatus = 'pending';
    if (paid - refunded >= totalDue && totalDue > 0) {
      paymentStatus = 'paid';
    } else if (refunded >= paid && paid > 0) {
      paymentStatus = 'refunded';
    }
    await Booking.updateOne({ _id: bookingId }, { $set: { paymentStatus } });

    return reply.code(201).send({ success: true, data: doc, summary });
  } catch (err) { return reply.code(500).send({ message: 'Failed to refund payment' }); }
}

export async function bookingPaymentSummary(request, reply) {
  try {
    const { bookingId } = request.query;
    const booking = await Booking.findById(bookingId).select('totalAmount additionalCost');
    const paidAgg = await Transaction.aggregate([
      { $match: { bookingId: new mongoose.Types.ObjectId(String(bookingId)), type: 'income' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);
    const refundedAgg = await Transaction.aggregate([
      { $match: { bookingId: new mongoose.Types.ObjectId(String(bookingId)), type: 'expense', category: 'refund' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);
    const totalDue = (booking?.totalAmount || 0) + (booking?.additionalCost || 0);
    const paid = paidAgg[0]?.sum || 0;
    const refunded = refundedAgg[0]?.sum || 0;
    const summary = { totalDue, paid, refunded, balance: totalDue - paid + refunded };
    return reply.code(200).send({ success: true, data: summary });
  } catch (err) { return reply.code(500).send({ message: 'Failed to compute payment summary' }); }
}


