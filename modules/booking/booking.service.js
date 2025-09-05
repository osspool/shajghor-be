import BaseService from '#common/services/baseService.js';
import Service from '#modules/service/service.model.js';
import Parlour from '#modules/parlour/parlour.model.js';
import Booking from './booking.model.js';

export class BookingService extends BaseService {
  constructor(model = Booking) {
    super(model);
  }

  async computeAvailability({ parlourId, date }) {

    const parlour = await Parlour.findById(parlourId).lean();
    if (!parlour || parlour.isActive === false) return [];

    const capacity = Math.max(1, parlour.capacity || 1);
    const slotMinutes = Math.max(5, parlour.slotDurationMinutes || 30);

    // Working hours: use full day keys only (monday .. sunday) to avoid confusion
    const fullNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const [y, m, d] = date.split('-').map(n => parseInt(n, 10));
    const day = new Date(Date.UTC(y, m - 1, d));
    const idx = day.getUTCDay();
    const fullKey = fullNames[idx];
    const wh = (
      (parlour.workingHours && typeof parlour.workingHours.get === 'function' && parlour.workingHours.get(fullKey))
      || parlour.workingHours?.[fullKey]
    );
    if (!wh || !wh.isOpen) return [];

    // Lead time and cutoff
    const now = new Date();
    const leadMs = Math.max(0, parlour.leadTimeMinutes || 0) * 60000;
    const earliestTs = now.getTime() + leadMs;
    if (parlour.dailyCutoffTime) {
      const [ch, cm] = parlour.dailyCutoffTime.split(':').map(n => parseInt(n, 10));
      const cutoff = new Date(day);
      cutoff.setUTCHours(ch || 0, cm || 0, 0, 0);
      if (now > cutoff) return [];
    }

    // Build slot range for the day
    const dayStart = new Date(day);
    const [sh, sm] = String(wh.startTime || '00:00').split(':').map(x => parseInt(x, 10));
    const [eh, em] = String(wh.endTime || '23:59').split(':').map(x => parseInt(x, 10));
    const open = new Date(dayStart); open.setUTCHours(sh, sm, 0, 0);
    const close = new Date(dayStart); close.setUTCHours(eh, em, 0, 0);

    // Break windows
    const breaks = Array.isArray(parlour.breaks) ? parlour.breaks : [];
    const breakWindows = breaks.map(b => {
      const [bh, bm] = String(b.startTime).split(':').map(Number);
      const [ch2, cm2] = String(b.endTime).split(':').map(Number);
      const bs = new Date(dayStart); bs.setUTCHours(bh || 0, bm || 0, 0, 0);
      const be = new Date(dayStart); be.setUTCHours(ch2 || 0, cm2 || 0, 0, 0);
      return { bs, be };
    });

    // Fetch same-day bookings
    const bookings = await this.Model.find({
      parlourId,
      appointmentDate: dayStart,
      status: { $in: ['pending', 'confirmed'] }
    }).select('appointmentTime totalDuration').lean();

    // Capacity-aware per-slot availability (no service length constraint)
    const slots = [];
    for (let t = open.getTime(); t + slotMinutes * 60000 <= close.getTime(); t += slotMinutes * 60000) {
      const slotStart = new Date(t);
      const slotEnd = new Date(t + slotMinutes * 60000);

      // Skip if violates lead-time
      if (slotStart.getTime() < earliestTs) continue;
      // Skip if in any break window
      const inBreak = breakWindows.some(({ bs, be }) => slotStart < be && slotEnd > bs);
      if (inBreak) continue;

      let occ = 0;
      for (const b of bookings) {
        const [bh, bm] = String(b.appointmentTime).split(':').map(n => parseInt(n, 10));
        const bStart = new Date(dayStart); bStart.setUTCHours(bh, bm, 0, 0);
        const bEnd = new Date(bStart.getTime() + (b.totalDuration || 0) * 60000);
        if (bStart < slotEnd && bEnd > slotStart) {
          occ += 1;
          if (occ >= capacity) break;
        }
      }
      const available = occ < capacity;
      {
        const hh = String(slotStart.getUTCHours()).padStart(2, '0');
        const mm = String(slotStart.getUTCMinutes()).padStart(2, '0');
        slots.push({ time: `${hh}:${mm}`, availableCapacity: Math.max(0, capacity - occ), totalCapacity: capacity, isAvailable: available });
      }
    }

    return slots;
  }
}

// Export a singleton service instance for reuse
const bookingServiceInstance = new BookingService(Booking);
export default bookingServiceInstance;


