// src/config/swagger.js
import swaggerUi from 'swagger-ui-express';
import { getApiSpec } from '#common/docs/apiDocs.js';


const version = '1.0.0';

// Import module-specific swagger docs
// import jobSwagger from '../modules/job/swagger.js';
// Import other module swagger docs as your project grows

/**
 * Aggregates swagger definitions from all modules
 * @param {Array} moduleSwaggers - Array of module swagger objects
 * @returns {Object} Combined swagger definition
 */
const aggregateSwagger = (moduleSwaggers) => {
  const paths = {};
  const schemas = {};
  const parameters = {};
  
  moduleSwaggers.forEach(swagger => {
    // Merge paths
    Object.assign(paths, swagger.paths);
    
    // Merge schemas
    Object.assign(schemas, swagger.components?.schemas || {});
    
    // Merge parameters
    Object.assign(parameters, swagger.components?.parameters || {});
  });
  
  return { paths, components: { schemas, parameters } };
};

// Aggregate all module swagger docs
const aggregated = aggregateSwagger([
  // jobSwagger,
  // Add other module swagger objects here
]);

// Base swagger definition
const swaggerBase = {
  openapi: '3.0.0',
  info: {
    title: 'Express API Documentation',
    version,
    description: 'Documentation for the Express API',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    }
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API Server (v1)',
    },
  ],
  tags: [
    {
      name: 'Jobs',
      description: 'Job management endpoints'
    },
    // Add more tags as you add more modules
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  // Apply bearer auth by default to all endpoints unless overridden per-path
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// Create setup function
const setupSwagger = (app) => {
  // Build dynamic spec from registry
  // Serve swagger docs; UI will fetch the JSON dynamically
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, {
    swaggerUrl: '/api-docs.json',
    swaggerOptions: {
      persistAuthorization: true,
      requestInterceptor: (req) => {
        try {
          const token = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem('swagger_token') : null;
          if (token && !req.headers['Authorization'] && !req.headers['authorization']) {
            req.headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (e) {}
        return req;
      },
      responseInterceptor: (res) => {
        try {
          // Capture token from login/refresh responses for convenience
          const isAuthEndpoint = /\/api\/v1\/auth\/(login|refresh)/.test(res.url);
          if (isAuthEndpoint && res.status === 200) {
            const data = JSON.parse(res.text || '{}');
            const token = data?.token || data?.accessToken || data?.access_token;
            if (token && typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem('swagger_token', token);
            }
          }
        } catch (e) {}
        return res;
      },
    },
  }));
  
  // Serve swagger JSON 
  app.get('/api-docs.json', (req, res) => {
    const dynamicSpec = getApiSpec();
    const swaggerDefinition = {
      ...swaggerBase,
      ...dynamicSpec,
      components: {
        ...swaggerBase.components,
        ...(dynamicSpec.components || {}),
      },
    };
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDefinition);
  });
  
  console.log('✅ Swagger documentation available at /api-docs');
};

export default setupSwagger;