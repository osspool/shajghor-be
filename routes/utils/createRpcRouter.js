// routes/utils/createRpcRouter.js
// Creates a router mapping JSON-RPC style POST endpoints to controller methods
import express from 'express';
import { withAuth, withValidation } from '#routes/utils/compose.js';
import { registerPath, registerTag } from '#common/docs/apiDocs.js';
import { registerZod } from '#common/docs/swaggerHelpers.js';

// options: { auth?: { [methodName]: roles[] }, schemas?: { [methodName]: { body?, query?, params? } } }
export default function createRpcRouter(controller, methods, options = {}) {
  const router = express.Router();
  const auth = options.auth || {};
  const schemas = options.schemas || {};

  methods.forEach((method) => {
    const path = `/${method}`;
    const handler = controller[method];
    if (typeof handler !== 'function') return;
    router.post(
      path,
      ...withAuth(auth[method] || []),
      ...withValidation(schemas[method] || {}),
      handler
    );

    registerPath(`${options.basePath || ''}${path}`, 'post', {
      tags: options.tag ? [options.tag] : undefined,
      summary: `${options.tag || 'rpc'}: ${method}`,
      requestBody: schemas[method]?.body ? { required: true, content: { 'application/json': { schema: registerZod(`${options.tag || method}Body`, schemas[method].body) } } } : undefined,
      responses: { 200: { description: 'OK' } },
    });
  });

  registerTag(options.tag);
  return router;
}


