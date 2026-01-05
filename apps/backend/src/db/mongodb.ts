// =============================================
// MongoDB Connection Handler
// =============================================

import mongoose from 'mongoose';

import { DATABASE_URL, NODE_ENV } from '../config/env.js';

// connectMongoDB: Establishes MongoDB connection with environment-aware pool sizing
// Production uses larger pool (100) for high concurrency, dev uses smaller pool (10)
export const connectMongoDB = async (): Promise<void> => {
    mongoose.connection.on('connected', () => console.log('[MongoDB] Connected'));
    mongoose.connection.on('error', (err) => console.error('[MongoDB] Error:', err));
    mongoose.connection.on('disconnected', () => console.log('[MongoDB] Disconnected'));

    await mongoose.connect(DATABASE_URL, { maxPoolSize: NODE_ENV === 'production' ? 100 : 10 });
};

export const disconnectMongoDB = async (): Promise<void> => {
    await mongoose.disconnect();
};

export const isMongoDBConnected = (): boolean => mongoose.connection.readyState === 1;
