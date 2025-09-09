// src/app.js
import Fastify from 'fastify';
import config from "./config/index.js";

import setupFastifySwagger from "./config/fastify-swagger.js";
import fastifyRoutes from "./routes/fastify.index.js";
import registerCorePlugins from '#common/plugins/register-core-plugins.js';

class App {
  constructor() {
    this.app = Fastify({
      logger: true,
      trustProxy: true,
      ajv: { customOptions: { coerceTypes: true, useDefaults: true, removeAdditional: false } },
    });
    this.server = null;
    this.setupGracefulShutdown();
  }

  async initialize() {
    try {
      // Database connection is now handled in index.js before app initialization
      this.setupJobQueueAndHandlers();
      await this.setupPlugins();
      await this.setupSwagger();
      await this.setupRoutes();
      this.setupErrorHandling();
      await this.initializeCronJobs();
    } catch (error) {
      console.error("Failed to initialize app:", error);
      process.exit(1);
    }
  }

  async seedPlatform() {
    try {
      console.log("Checking platform configuration...");
      await seedPlatform();
    } catch (error) {
      console.error("Failed to seed platform:", error);
      // Platform is critical for inventory sync, so we should exit
      process.exit(1);
    }
  }

  setupJobQueueAndHandlers() {
    console.log("Initializing Job Queue and registering handlers...");
    try {
      // Register unified inventory job handler for both sync and resync operation
    } catch (error) {
      console.error(
        "Failed to initialize Job Queue or register handlers:",
        error
      );
      // Decide if this is a fatal error for your application
      // process.exit(1); // Uncomment if job queue is critical
    }
  }

  async setupSwagger() {
    await setupFastifySwagger(this.app);
  }

  setupGracefulShutdown() {
    // Handle different termination signals
    const signals = ["SIGTERM", "SIGINT", "SIGUSR2"];
    signals.forEach((signal) => {
      process.on(signal, () => {
        console.log(`Received ${signal}, starting graceful shutdown...`);
        this.shutdown(signal);
      });
    });
  }

  async shutdown(signal) {
    console.log(`Starting graceful shutdown for signal: ${signal}`);
    try { await this.app.close(); } catch (error) { console.error("Error while closing server:", error); }

    // Exit process
    process.exit(0);
  }

  async setupPlugins() {
    await this.app.register(registerCorePlugins);
    // Health
    this.app.get('/health', async () => ({ success: true, message: 'OK' }));
  }

  async setupRoutes() {
    await this.app.register(fastifyRoutes, { prefix: '/api/v1' });
    // 404 fallback
    this.app.setNotFoundHandler((request, reply) => {
      reply.code(404).send({ success: false, message: `Cannot find ${request.url} on this server`, status: 'fail' });
    });
  }

  setupErrorHandling() {
    // Fastify has its own error handling; add a hook for logging in dev
    if (process.env.NODE_ENV === 'development') {
      this.app.setErrorHandler((err, request, reply) => {
        console.error('Error caught in app.js:', err);
        reply.send(err);
      });
    }
  }

  async initializeCronJobs() {
    if (config.app.disableCronJobs === true) {
      console.log("Cron jobs are disabled by environment configuration");
      return;
    }

    try {
      console.log("Initializing cron jobs...");
      // Dynamically import cron module only if present
      const module = await import("./cron/index.js").catch(() => null);
      if (module && (module.default?.initialize || module.initialize)) {
        const mgr = module.default || module;
        await (mgr.initialize ? mgr.initialize() : Promise.resolve());
        console.log("Cron jobs initialized successfully");
      } else {
        console.warn("Cron module not found or no initialize() exported. Skipping cron setup.");
      }
    } catch (error) {
      console.error("Failed to initialize cron jobs:", error);
    }
  }

  getApp() {
    return this.app;
  }

  start(port) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.initialize();
        await this.app.listen({ port });
        console.log(`Server running on port ${port}`);
        console.log(`✅ Application started successfully!`);
        console.log(`📊 Health check: http://localhost:${port}/health`);
        console.log(`📚 API Docs JSON: http://localhost:${port}/api-docs.json`);
        console.log(`🚀 API Base: http://localhost:${port}/api/v1`);
        resolve(this.app);
      } catch (error) {
        console.error('Error in start method:', error);
        reject(error);
      }
    });
  }
}

// Export the App instance
const appInstance = new App();
export default appInstance;