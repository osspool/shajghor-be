// Factory that returns a Fastify preHandler to sanitize superadmin-protected fields
// Usage: const guard = createSanitizeSuperadminFields(['isFeatured','advert'])

function deleteNestedPath(obj, pathSegments) {
  if (!obj || typeof obj !== 'object' || !Array.isArray(pathSegments) || !pathSegments.length) return;
  const [head, ...tail] = pathSegments;
  if (!(head in obj)) return;
  if (tail.length === 0) {
    delete obj[head];
    return;
  }
  deleteNestedPath(obj[head], tail);
  // Clean up empty objects
  if (obj[head] && typeof obj[head] === 'object' && !Array.isArray(obj[head]) && Object.keys(obj[head]).length === 0) {
    delete obj[head];
  }
}

function stripFromContainer(container, protectedFields) {
  if (!container || typeof container !== 'object') return;

  const keys = Object.keys(container);
  // Remove exact/dotted matches on this container
  for (const key of keys) {
    for (const pf of protectedFields) {
      if (key === pf || key.startsWith(pf + '.')) {
        delete container[key];
        break;
      }
    }
  }

  // Remove nested paths inside nested objects
  for (const pf of protectedFields) {
    const segs = pf.split('.');
    deleteNestedPath(container, segs);
  }
}

export function createSanitizeSuperadminFields(protectedFields = []) {
  const uniqueProtected = Array.from(new Set(protectedFields.filter(Boolean)));
  const operatorKeys = ['$set', '$unset', '$setOnInsert', '$push', '$addToSet', '$pull'];

  return async function sanitizeGuard(request, reply) {
    const roles = Array.isArray(request.user?.roles) ? request.user.roles : [];
    const isSuperadmin = roles.includes('superadmin');
    if (isSuperadmin) return; // allow

    const body = request.body || {};

    // Root level strip
    stripFromContainer(body, uniqueProtected);

    // Operator containers
    for (const op of operatorKeys) {
      if (body[op] && typeof body[op] === 'object') {
        stripFromContainer(body[op], uniqueProtected);
        if (Object.keys(body[op]).length === 0) delete body[op];
      }
    }
  };
}

export function createWhitelistForNonSuperadmin(allowedFields = []) {
  const uniqueAllowed = Array.from(new Set(allowedFields.filter(Boolean)));
  const operatorKeys = ['$set', '$unset', '$setOnInsert', '$push', '$addToSet', '$pull'];

  function keepOnlyAllowed(container) {
    if (!container || typeof container !== 'object') return;
    for (const key of Object.keys(container)) {
      const isAllowed = uniqueAllowed.some((af) => key === af || key.startsWith(af + '.'));
      if (!isAllowed) delete container[key];
    }
  }

  return async function whitelistGuard(request, reply) {
    const roles = Array.isArray(request.user?.roles) ? request.user.roles : [];
    const isSuperadmin = roles.includes('superadmin');
    if (isSuperadmin) return; // unrestricted

    const body = request.body || {};
    // Root level: retain only allowed top-level fields
    for (const key of Object.keys(body)) {
      const isAllowed = uniqueAllowed.includes(key);
      if (!isAllowed && !operatorKeys.includes(key)) {
        delete body[key];
      }
    }

    // Operator containers: retain only allowed field paths
    for (const op of operatorKeys) {
      if (body[op] && typeof body[op] === 'object') {
        keepOnlyAllowed(body[op]);
        if (Object.keys(body[op]).length === 0) delete body[op];
      }
    }
  };
}

export default {
  createSanitizeSuperadminFields,
  createWhitelistForNonSuperadmin,
};


