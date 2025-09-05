import express from 'express';
import User from '#modules/auth/user.model.js';
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';
import permissions from '#config/permissions.js';
import { userCreateBody, userUpdateBody, userGetParams, userListQuery } from '#modules/auth/schemas.js';
import authMiddleware from '#common/middlewares/authMiddleware.js';
import { getUserByToken, updateUser } from '#modules/auth/userController.js';

const router = express.Router();

const { controller } = createServiceAndController(User);


const createUserSchema = userCreateBody;
const updateUserSchema = userUpdateBody;
const getUserParamsSchema = userGetParams;
const listUserQuerySchema = userListQuery;

router.use(
  '/',
  createCrudRouter(controller, {
    basePath: '/users',
    tag: 'Users',
    auth: permissions.users,
    schemas: {
      list: { query: listUserQuerySchema },
      get: { params: getUserParamsSchema },
      create: { body: createUserSchema },
      update: { body: updateUserSchema, params: getUserParamsSchema },
      remove: { params: getUserParamsSchema },
    },
  })
);

// Self profile routes
const meRouter = express.Router();
meRouter.get('/', authMiddleware, getUserByToken);
meRouter.patch('/', authMiddleware, updateUser);
router.use('/users/me', meRouter);

export default router;


