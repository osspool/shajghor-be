import User from '#modules/auth/user.model.js';
import fp from 'fastify-plugin';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import permissions from '#config/permissions.js';
import { userCreateBody, userUpdateBody, userGetParams, userListQuery } from '#modules/auth/schemas.js';
// Use fastify.authenticate from auth plugin
import { getUserByToken, updateUser } from '#modules/auth/userController.js';
import { register, login, refreshToken, forgotPassword, resetPassword } from '#modules/auth/authController.js';
import { loginBody, registerBody, refreshBody, forgotBody, resetBody } from '#modules/auth/schemas.js';

async function authPlugin(fastify, opts) {
  const { controller } = createServiceAndController(User);

  const schemas = {
    list: { query: userListQuery },
    get: { params: userGetParams },
    create: { body: userCreateBody },
    update: { body: userUpdateBody, params: userGetParams },
    remove: { params: userGetParams },
  };

  await fastify.register(async (instance) => {
    createCrudRouter(instance, controller, {
      basePath: '/users', tag: 'Users', auth: permissions.users, schemas,
    });
  });

  // Self profile routes
  fastify.get('/users/me', { preHandler: [fastify.authenticate] }, getUserByToken);
  fastify.patch('/users/me', { preHandler: [fastify.authenticate] }, updateUser);

  // Auth routes under /auth
  await fastify.register(async (instance) => {
    instance.post('/register', { schema: { body: registerBody } }, register);
    instance.post('/login', { schema: { body: loginBody } }, login);
    instance.post('/refresh', { schema: { body: refreshBody } }, refreshToken);
    instance.post('/forgot-password', { schema: { body: forgotBody } }, forgotPassword);
    instance.post('/reset-password', { schema: { body: resetBody } }, resetPassword);
  }, { prefix: '/auth' });
}

export default fp(authPlugin, { name: 'auth-plugin' });


