import fp from 'fastify-plugin';

async function organizationScopePlugin(fastify, opts) {
  // Decorate a preHandler factory to scope requests by organization
  fastify.decorate('organizationScoped', function organizationScoped(options = {}) {
    const { required = false } = options;
    return async function organizationScopePreHandler(request, reply) {
      const roles = Array.isArray(request.user?.roles)
        ? request.user.roles
        : (request.user?.roles ? [request.user.roles] : []);
      if (roles.includes('superadmin')) return; // unrestricted

      const orgId = request.user?.organization || request.user?.organizationId;

      if (orgId) {
        request.context = request.context || {};
        request.context.organizationId = String(orgId);
        return;
      }

      if (required) {
        return reply.code(403).send({ message: 'Organization is required' });
      }
    };
  });
}

export default fp(organizationScopePlugin, { name: 'organization-scope-plugin' });


