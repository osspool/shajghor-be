import mongoose from 'mongoose';
import Transaction from './transaction.model.js';
import Booking from '#modules/booking/booking.model.js';

export async function receivePayment(req, res, next) {
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
    } = req.body;

    const payload = {
      parlourId,
      organizationId: organizationId || req.context?.organizationId,
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
      handledBy: req.user?._id,
      idempotencyKey: req.body?.idempotencyKey,
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

    return res.status(201).json({ success: true, data: doc, summary });
  } catch (err) {
    next(err);
  }
}

export async function capitalInjection(req, res, next) {
  try {
    const body = req.body || {};
    const payload = {
      ...body,
      organizationId: body.organizationId || req.context?.organizationId,
      type: 'income',
      category: 'capital_injection',
      handledBy: req.user?._id,
    };
    if (!payload.idempotencyKey) delete payload.idempotencyKey;
    const doc = await Transaction.create(payload);
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
}

export async function ownerWithdrawal(req, res, next) {
  try {
    const body = req.body || {};
    const payload = {
      ...body,
      organizationId: body.organizationId || req.context?.organizationId,
      type: 'expense',
      category: 'owner_withdrawal',
      handledBy: req.user?._id,
    };
    if (!payload.idempotencyKey) delete payload.idempotencyKey;
    const doc = await Transaction.create(payload);
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
}

export async function refundPayment(req, res, next) {
  try {
    const { bookingId, amount, method, paymentDetails, reference, notes, date, parlourId, organizationId, customerId } = req.body;
    const payload = {
      bookingId,
      amount,
      method,
      paymentDetails,
      reference,
      notes,
      date: date ? new Date(date) : new Date(),
      parlourId,
      organizationId: organizationId || req.context?.organizationId,
      customerId,
      type: 'expense',
      category: 'refund',
      handledBy: req.user?._id,
    };
    if (!payload.idempotencyKey) payload.idempotencyKey = req.body?.idempotencyKey;
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

    return res.status(201).json({ success: true, data: doc, summary });
  } catch (err) { next(err); }
}

export async function bookingPaymentSummary(req, res, next) {
  try {
    const { bookingId } = req.query;
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
    res.status(200).json({ success: true, data: summary });
  } catch (err) { next(err); }
}


