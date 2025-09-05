import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { upsertCustomerFromBookingDoc } from '#common/services/common.js';

const { Schema } = mongoose;

const bookingServiceSchema = new Schema({
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  serviceName: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  duration: { type: Number, required: true, min: 1 },
}, { _id: false });

const bookingSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  parlourId: { type: Schema.Types.ObjectId, ref: 'Parlour', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  services: { type: [bookingServiceSchema], required: true, validate: v => v.length > 0 },
  serviceType: { type: String, enum: ['in-salon', 'at-home'], default: 'in-salon' },
  serviceAddress: { type: String },
  appointmentDate: { type: Date, required: true }, // date-only, normalized to 00:00 UTC
  appointmentTime: { type: String, required: true }, // 'HH:mm'
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'bkash', 'nagad', 'bank', 'online'], default: 'cash' },
  totalAmount: { type: Number, required: true, min: 0 },
  totalDuration: { type: Number, required: true, min: 1 },
  additionalCost: { type: Number },
  additionalCostReason: { type: String },
  notes: { type: String },
}, { timestamps: true });

bookingSchema.index({ parlourId: 1, appointmentDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });

// Normalize appointmentDate to date-only (UTC midnight) before save
bookingSchema.pre('save', function(next) {
  if (this.isModified('appointmentDate') && this.appointmentDate) {
    const d = new Date(this.appointmentDate);
    this.appointmentDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  next();
});

// Prevent overlapping bookings for same parlour and time window
bookingSchema.pre('validate', async function(next) {
  try {
    if (!this.parlourId || !this.appointmentDate || !this.appointmentTime || !this.totalDuration) return next();
    if (this.serviceType === 'at-home') return next();

    const [startHour, startMinute] = this.appointmentTime.split(':').map(n => parseInt(n, 10));
    const start = new Date(this.appointmentDate);
    start.setUTCHours(startHour, startMinute, 0, 0);
    const end = new Date(start.getTime() + this.totalDuration * 60000);

    const Parlour = mongoose.model('Parlour');
    const parlour = await Parlour.findById(this.parlourId).lean();
    const capacity = Math.max(1, (parlour && parlour.capacity) || 1);
    const slotMinutes = Math.max(5, (parlour && parlour.slotDurationMinutes) || 30);

    const Booking = mongoose.models.Booking || this.constructor;
    const sameDayBookings = await Booking.find({
      _id: { $ne: this._id },
      parlourId: this.parlourId,
      appointmentDate: this.appointmentDate,
      status: { $in: ['pending', 'confirmed'] },
    }).lean();

    const requiredSlots = Math.ceil(this.totalDuration / slotMinutes);
    for (let i = 0; i < requiredSlots; i++) {
      const slotStart = new Date(start.getTime() + i * slotMinutes * 60000);
      const slotEnd = new Date(Math.min(end.getTime(), slotStart.getTime() + slotMinutes * 60000));

      let occupancy = 0;
      for (const b of sameDayBookings) {
        const [h, m] = String(b.appointmentTime).split(':').map(x => parseInt(x, 10));
        const bStart = new Date(b.appointmentDate);
        bStart.setUTCHours(h, m, 0, 0);
        const bEnd = new Date(bStart.getTime() + (b.totalDuration || 0) * 60000);
        if (bStart < slotEnd && bEnd > slotStart) {
          occupancy += 1;
          if (occupancy >= capacity) break;
        }
      }
      if (occupancy >= capacity) {
        const err = new Error('No capacity available for the selected time window');
        err.status = 400;
        return next(err);
      }
    }
    return next();
  } catch (e) {
    return next(e);
  }
});

// After save: maintain Customer CRM linkage and, for paid status, create a consolidated Transaction (legacy)
bookingSchema.post('save', async function(doc, next) {
  try {
    await upsertCustomerFromBookingDoc(doc);
    next();
  } catch (e) {
    next(e);
  }
});

// Keep customer linkage updated on PATCH/UPDATE operations as well
bookingSchema.post('findOneAndUpdate', async function(doc, next) {
  try {
    if (!doc) return next();
    await upsertCustomerFromBookingDoc(doc);
    next();
  } catch (e) {
    next(e);
  }
});

bookingSchema.plugin(mongoosePaginate);
bookingSchema.plugin(aggregatePaginate);

// Auto-delete legacy records older than 15 months via TTL on createdAt (apply only if desired)
bookingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { createdAt: { $lt: new Date(Date.now() - 15 * 30 * 24 * 60 * 60 * 1000) } } });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export default Booking;


