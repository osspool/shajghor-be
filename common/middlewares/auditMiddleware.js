// common/middlewares/auditMiddleware.js
import AuditLog from '#modules/audit/audit.model.js';

/**
 * Audit middleware to log all write operations
 * Attach after auth middleware to capture user info
 */
export const auditMiddleware = async (req, res, next) => {
  // Only audit write operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Capture original json method
  const originalJson = res.json;
  
  res.json = function(data) {
    // Log audit after successful response
    if (res.statusCode < 400) {
      const entity = req.baseUrl.split('/').pop(); // Extract entity from route
      const action = 
        req.method === 'POST' ? 'CREATE' :
        req.method === 'DELETE' ? 'DELETE' : 'UPDATE';
      
      // Fire and forget audit log
      AuditLog.create({
        actor: req.user?._id,
        action,
        entity,
        entityId: req.params.id || data?.data?._id || data?._id,
        payload: req.body,
        metadata: {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          method: req.method,
          path: req.originalUrl,
        },
      }).catch(err => console.error('Audit log error:', err));
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

export default auditMiddleware;
