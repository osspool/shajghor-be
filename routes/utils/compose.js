// routes/utils/compose.js
// Helper to compose auth + validation + custom middlewares succinctly
import { validate } from '#common/middlewares/validate.js';
import { authorize } from '#common/middlewares/authMiddleware.js';

export function withAuth(roles = []) {
  return roles.length ? [authorize(...roles)] : [];
}

export function withValidation(schema = {}) {
  return schema && (schema.body || schema.query || schema.params) ? [validate(schema)] : [];
}

export function combine(...groups) {
  return groups.flat().filter(Boolean);
}


