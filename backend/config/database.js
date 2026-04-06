/**
 * Database Configuration
 * MongoDB and Redis connection setup
 */

const mongoose = require('mongoose');
const redis = require('redis');

// MongoDB Connection
const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// MongoDB Event Listeners
mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
});

// Redis Connection
let redisClient;

const connectRedis = async () => {
    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL,
        });

        redisClient.on('error', (err) => {
            console.error('❌ Redis error:', err);
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });

        await redisClient.connect();
    } catch (error) {
        console.error('❌ Redis connection error:', error);
        // Redis is optional, continue without it
    }
};

// Get Redis Client
const getRedisClient = () => redisClient;

module.exports = {
    connectMongoDB,
    connectRedis,
    getRedisClient,
};
