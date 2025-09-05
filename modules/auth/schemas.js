import { z } from 'zod';

export const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  roles: z.array(z.enum(['superadmin','admin','manager','hr','employee','user'])).optional(),
});

export const refreshBody = z.object({ token: z.string().min(1) });
export const forgotBody = z.object({ email: z.string().email() });
export const resetBody = z.object({ token: z.string().min(1), newPassword: z.string().min(6) });
export const getProfileBody = z.object({ email: z.string().email() });
export const updateUserBody = z.object({ name: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional() });

// User CRUD schemas
export const userCreateBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  roles: z.array(z.enum(['superadmin','admin','manager','hr','employee','user'])).optional(),
});
export const userUpdateBody = userCreateBody.partial();
export const userGetParams = z.object({ id: z.string().length(24) });
export const userListQuery = z.object({}).passthrough();


