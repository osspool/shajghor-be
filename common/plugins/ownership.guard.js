import fp from 'fastify-plugin';

async function ownershipGuardPlugin(fastify, opts) {
  // Ensures the resource being accessed belongs to the user's organization (non-superadmin)
  // Usage: fastify.ownershipGuard({ model, idParam: 'id', orgField: 'organizationId' })
  fastify.decorate('ownershipGuard', function ownershipGuard({ model, idParam = 'id', orgField = 'organizationId' } = {}) {
    if (!model) throw new Error('ownershipGuard requires a Mongoose model');
    return async function guard(request, reply) {
      const roles = Array.isArray(request.user?.roles) ? request.user.roles : [];
      if (roles.includes('superadmin')) return; // unrestricted

      const resourceId = request.params?.[idParam];
      if (!resourceId) return reply.code(400).send({ message: 'Missing resource id' });
      const orgId = request.user?.organization || request.user?.organizationId;
      if (!orgId) return reply.code(403).send({ message: 'Organization required' });

      const exists = await model.exists({ _id: resourceId, [orgField]: orgId });
      if (!exists) return reply.code(404).send({ message: 'Resource not found' });
    };
  });
}

export default fp(ownershipGuardPlugin, { name: 'ownership-guard-plugin' });


