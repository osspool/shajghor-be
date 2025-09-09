import fp from 'fastify-plugin';

async function requestMetaPlugin(fastify, opts) {
  // Set up a per-request context and validated container for downstream handlers
  fastify.addHook('onRequest', async (request, reply) => {
    request.context = request.context || {};
    request.validated = request.validated || {};
  });
}

export default fp(requestMetaPlugin, { name: 'request-meta-plugin' });


