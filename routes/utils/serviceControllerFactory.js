// routes/utils/serviceControllerFactory.js
import BaseService from '#common/services/baseService.js';
import BaseController from '#common/controllers/baseController.js';

/**
 * Creates a BaseService and BaseController for a given Mongoose model.
 * Optionally configures lookup mappings used for nested filtering in aggregation.
 */
export function createServiceAndController(Model, options = {}) {
  const service = options.service
    ? options.service
    : options.serviceClass
    ? new options.serviceClass(Model)
    : new BaseService(Model);
  if (options.lookups) {
    service.configureLookups(options.lookups);
  }
  const controller = new BaseController(service);
  return { service, controller };
}


