import BaseController from '#common/controllers/baseController.js';
import bookingService from './booking.service.js';

export class BookingController extends BaseController {
  constructor(service) {
    super(service);
    this.getAvailability = this.getAvailability.bind(this);
  }

  async getAvailability(request, reply) {
    const { parlourId, date } = (request.validated?.query || request.query || {});
    const slots = await this.service.computeAvailability({ parlourId, date });
    return reply.code(200).send({ success: true, data: slots });
  }
}

// Export a singleton instance for reuse
const bookingControllerInstance = new BookingController(bookingService);
export default bookingControllerInstance;


