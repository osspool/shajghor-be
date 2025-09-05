// src/app.js
import cors from "cors";
import helmet from "helmet";
import express from "express";
import errorHandler from "./common/middlewares/errorHandler.js";
// import auditMiddleware from "./common/middlewares/auditMiddleware.js";
import db from "./config/db.js";
import config from "./config/index.js";
import setupSwagger from "./config/swagger.js";
import routes from "./routes/routes.index.js";
import healthRoutes from "./routes/health.js";

class App {
  constructor() {
    this.app = express();
    this.server = null;
    this.setupGracefulShutdown();
  }

  async initialize() {
    try {
      // Database connection is now handled in index.js before app initialization
      this.setupJobQueueAndHandlers();
      this.setupMiddleware();
      this.setupSwagger();
      this.setupRoutes();
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

  setupSwagger() {
    setupSwagger(this.app);
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

    // Close server if it exists
    if (this.server) {
      try {
        await new Promise((resolve, reject) => {
          this.server.close((err) => {
            if (err) {
              console.error("Error during server shutdown:", err);
              reject(err);
            } else {
              console.log("Server closed successfully");
              resolve();
            }
          });
        });
      } catch (error) {
        console.error("Error while closing server:", error);
      }
    }

    // Close database connection
    try {
      await db.disconnect();
      console.log("Database connection closed successfully");
    } catch (error) {
      console.error("Error while closing database connection:", error);
    }

    // Exit process
    process.exit(0);
  }

  setupMiddleware() {
    this.app.set("trust proxy", 1);
    this.app.use(helmet());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // --- START: CORRECT CORS CONFIGURATION ---
    const allowedOrigins = config.cors.origin;

    const corsOptions = {
      origin: (origin, callback) => {
        // This logic allows requests from your allowed origins list
        // and also allows requests that don't have an origin (like Postman or server-to-server)
        if (
          !origin ||
          allowedOrigins.includes("*") ||
          allowedOrigins.includes(origin)
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true, // This MUST be true to allow the Authorization header
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
      ],
      optionsSuccessStatus: 200, // For legacy browser compatibility
    };

    this.app.use(cors(corsOptions));
    // --- END: CORRECT CORS CONFIGURATION ---

    console.log("CORS configured to allow requests from:", allowedOrigins);
  }

  setupRoutes() {
    // Health check routes (no auth needed)
    this.app.use("/", healthRoutes);
    
    // API v1 routes
    this.app.use("/api/v1", routes);
    
    
    // 404 handler for unknown routes (Express 5 will forward thrown errors)
    this.app.use((req, res) => {
      res
        .status(404)
        .json({ success: false, message: `Cannot find ${req.originalUrl} on this server`, status: "fail" });
    });
  }

  setupErrorHandling() {
    // Development error logging
    if (process.env.NODE_ENV === "development") {
      this.app.use((err, req, res, next) => {
        console.error("Error caught in app.js:", err);
        next(err);
      });
    }
    // Global error handler
    this.app.use(errorHandler);
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
        await this.initialize(); // Initialize before starting server
        this.server = this.app.listen(port, () => {
          console.log(`Server running on port ${port}`);
          console.log(`✅ Application started successfully!`);
          console.log(`📊 Health check: http://localhost:${port}/health`);
          console.log(`📚 API Docs: http://localhost:${port}/api-docs`);
          console.log(`🚀 API Base: http://localhost:${port}/api/v1`);
          resolve(this.server);
        });

        this.server.on("error", (error) => {
          console.error("Server error:", error);
          reject(error);
        });
      } catch (error) {
        console.error("Error in start method:", error);
        reject(error);
      }
    });
  }
}

// Export the App instance
const appInstance = new App();
export default appInstance;