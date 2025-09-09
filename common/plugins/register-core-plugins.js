import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import fastifyJwt from '@fastify/jwt';
import underPressure from '@fastify/under-pressure';
import rateLimit from '@fastify/rate-limit';

import config from '#config/index.js';
import mongoosePlugin from '#config/db.plugin.js';
import authPlugin from '#common/plugins/auth.plugin.js';
import requestMetaPlugin from '#common/plugins/request-meta.plugin.js';
import cachePlugin from '#common/plugins/cache.plugin.js';
import organizationScopePlugin from '#common/plugins/organization-scope.plugin.js';
import ownershipGuardPlugin from '#common/plugins/ownership.guard.js';
import emptyJsonPlugin from '#common/plugins/empty-json.plugin.js';

async function registerCorePlugins(fastify, opts) {
  const allowedOrigins = config.cors.origin;

  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization","X-Requested-With","Accept","Origin"],
  });

  await fastify.register(sensible);
  await fastify.register(underPressure, { exposeStatusRoute: true });
  await fastify.register(rateLimit, { max: 200, timeWindow: '1 minute' });

  await fastify.register(fastifyJwt, { secret: config.app.jwtSecret });
  await fastify.register(emptyJsonPlugin);

  await fastify.register(mongoosePlugin);
  await fastify.register(authPlugin);
  await fastify.register(requestMetaPlugin);
  await fastify.register(cachePlugin);
  await fastify.register(organizationScopePlugin);
  await fastify.register(ownershipGuardPlugin);
}

export default fp(registerCorePlugins, { name: 'register-core-plugins' });


