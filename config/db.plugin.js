import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import config from './index.js';

async function mongooseConnector(fastify, opts) {
  const uri = config.db.uri;
  if (!uri) throw new Error('MONGO_URI is not defined');

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  fastify.decorate('mongoose', mongoose);

  fastify.addHook('onClose', async () => {
    try { await mongoose.disconnect(); } catch (_) {}
  });
}

export default fp(mongooseConnector, { name: 'mongoose-connector' });


