import Booking from './booking.model.js';
import { buildCrudSchemasFromModel } from '#common/utils/mongooseToJsonSchema.js';

const { crudSchemas } = buildCrudSchemasFromModel(Booking, {
  output: 'json',
  query: {
    filterableFields: {
      organizationId: { type: 'string' },
      parlourId: { type: 'string' },
      customerId: { type: 'string' },
      customerPhone: { type: 'string' },
      appointmentDate: { type: 'string' },
      status: { type: 'string' },
      paymentStatus: { type: 'string' },
    },
  },
});

export const bookingSchemas = crudSchemas;
export default bookingSchemas;

// Preserve additional queries
export const bookingAvailabilityQuery = {
  type: 'object',
  properties: {
    parlourId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
    date: { type: 'string', minLength: 8 },
  },
  required: ['parlourId','date'],
};

export const bookingAvailabilityResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          time: { type: 'string' },
          availableCapacity: { type: 'integer' },
          totalCapacity: { type: 'integer' },
          isAvailable: { type: 'boolean' },
        },
        required: ['time', 'availableCapacity', 'totalCapacity', 'isAvailable'],
        additionalProperties: false,
      },
    },
  },
  required: ['success', 'data'],
  additionalProperties: false,
};


