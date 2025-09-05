// routes/health.js
import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Health check endpoint for monitoring
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.name,
    },
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
    },
  };

  const statusCode = health.database.status === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Simple ping endpoint
router.get('/ping', (req, res) => {
  res.json({ pong: true });
});

export default router;
