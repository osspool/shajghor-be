// src/index.js
// Load environment
import './config/env-loader.js';

// Add global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Async IIFE (Immediately Invoked Function Expression) to ensure connections are ready 
// before continuing to load other modules
(async () => {
  try {
    const { default: config } = await import('./config/index.js');
    const { default: appInstance } = await import('./app.js');

    const PORT = config.app.port || 8080;

    await appInstance.start(PORT);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
})();
