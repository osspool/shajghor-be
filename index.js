// src/index.js
// Import and set up environment variables first
import './config/env-loader.js';

// Connect to database BEFORE importing models or anything else
import databaseService from './config/db.js';

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
    // Establish database connections
    console.log('Establishing database connections from index.js...');
    await databaseService.connect();
    console.log('Database connections established. Proceeding with application startup...');
    
    // Now that connections are ready, it's safe to import the rest of the app
    const { default: config } = await import('./config/index.js');
    const { default: appInstance } = await import('./app.js');
    
    const PORT = config.app.port || 8080;
    
    // Start the application
    await appInstance.start(PORT);
    
  } catch (error) {
    console.error('Failed to establish database connections:', error);
    process.exit(1);
  }
})();
