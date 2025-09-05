// src/middlewares/contextMiddleware.js
export const contextMiddleware = async (req, res, next) => {
  req.context = {};
  // Multi-tenant context: organization and parlour scoping (if provided from headers or user)
  const orgId = req.headers['x-organization-id'] || req.query.organizationId || (req.user && req.user.organization && req.user.organization._id && req.user.organization._id.toString());
  if (orgId) req.context.organizationId = orgId;
  // Optional parlour scoping via header
  const parlourId = req.headers['x-parlour-id'] || req.query.parlourId;
  if (parlourId) req.context.parlourId = parlourId;

  if (req.user) {
    const roles = Array.isArray(req.user.roles) ? req.user.roles : (req.user.roles ? [req.user.roles] : []);
    if (roles.includes('admin')) {
      req.context.accessLevel = 'admin';
    } else if (roles.includes('manager')) {
      req.context.accessLevel = 'manager';
    } else {
      req.context.accessLevel = 'user';
    }
  } else {
    req.context.accessLevel = 'public';
  }
  next();
};

export const assignUserIdMiddleware = (req, res, next) => {
  if (req.user && req.user._id) {
    req.body.userId = req.user._id.toString();
  }
  next();
};

export const assignVendorIdMiddleware = (req, res, next) => {
  if (req.user && req.user._id) {
    req.body.vendorId = req.user._id.toString();
  }
  next();
};
