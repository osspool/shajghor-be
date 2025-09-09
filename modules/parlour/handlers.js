export function makeGetBySlugHandler(controller) {
  return async function getBySlug(request, reply) {
    const slug = (request.validated?.params?.slug) || request.params.slug;
    const doc = await controller.service.getByQuery({ slug });
    reply.code(200).send({ success: true, data: doc });
  };
}

export function makeGetByOwnerHandler(controller, EmployeeModel) {
  return async function getByOwner(request, reply) {
    const ownerId = (request.validated?.params?.ownerId) || request.params.ownerId;
    const user = request.user;
    let query = {};
    if (user && Array.isArray(user.roles) && user.roles.includes('employee')) {
      const mapping = await EmployeeModel.findOne({ userId: user._id, active: true }).select('parlourId').lean();
      if (!mapping) return reply.code(404).send({ success: false, message: 'No parlour mapping for employee' });
      query = { _id: mapping.parlourId };
    } else {
      query = { ownerId };
    }
    const doc = await controller.service.getByQuery(query, { populate: 'organizationId' });
    reply.code(200).send({ success: true, data: doc });
  };
}

export default {
  makeGetBySlugHandler,
  makeGetByOwnerHandler,
};


