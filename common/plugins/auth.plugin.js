// Fastify auth plugin: decorate authenticate and authorize
import fp from 'fastify-plugin';
import User from "#modules/auth/user.model.js";

async function authPlugin(fastify, opts) {
  // Requires @fastify/jwt to be registered before this plugin
  fastify.decorate('authenticate', async function authenticate(request, reply) {
    try {
      await request.jwtVerify();
      const userId = request.user && (request.user.id || request.user._id);
      if (!userId) return reply.code(401).send({ message: 'Invalid token payload' });
      const user = await User.findById(userId).select('-password');
      if (!user) return reply.code(401).send({ message: 'User not found for provided token' });
      request.user = user;
    } catch (err) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }
  });

  fastify.decorate('authorize', function authorize(...allowedRoles) {
    return async function preHandler(request, reply) {
      if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
      const roles = Array.isArray(request.user.roles) ? request.user.roles : (request.user.roles ? [request.user.roles] : []);
      if (roles.includes('superadmin')) return;
      const ok = allowedRoles.length === 0 ? true : allowedRoles.some((r) => roles.includes(r));
      if (!ok) return reply.code(403).send({ message: 'Forbidden: You do not have access to this resource' });
    };
  });
}

export default fp(authPlugin, { name: 'auth-plugin' });
