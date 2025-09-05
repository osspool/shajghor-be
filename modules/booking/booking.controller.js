import BaseController from '#common/controllers/baseController.js';
import bookingService from './booking.service.js';

export class BookingController extends BaseController {
  constructor(service) {
    super(service);
    this.getAvailability = this.getAvailability.bind(this);
  }

  async getAvailability(req, res) {
    const { parlourId, date } = req.query;
    const slots = await this.service.computeAvailability({ parlourId, date });
    res.status(200).json({ success: true, data: slots });
  }
}

// Export a singleton instance for reuse
const bookingControllerInstance = new BookingController(bookingService);
export default bookingControllerInstance;


