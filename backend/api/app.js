/**
 * Main Express Application for CampusFeedback+ 2.0
 * Integrates AI moderation, blockchain, and database services
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const feedbackRoutes = require('./routes/feedback');
// Initialize Express app
const app = express();

// Initialize database connections
connectMongoDB();
connectRedis();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
const authRoutes = require('./routes/auth');
const feedbackRoutes = require('./routes/feedback');
const ratingRoutes = require('./routes/rating');
const userRoutes = require('./routes/user');
const moderationRoutes = require('./routes/moderation');
const governanceRoutes = require('./routes/governance');

app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/moderation', authenticateToken, moderationRoutes);
app.use('/api/governance', authenticateToken, governanceRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource does not exist'
    });
});

// Error handling middleware
app.use(errorHandler);

// Database connection
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Redis connection
const redis = require('redis');
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.connect()
    .then(() => console.log('✅ Redis connected'))
    .catch(err => console.error('❌ Redis connection error:', err));

// Export for testing
module.exports = { app, redisClient };

// Start server if not in test mode
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚀 CampusFeedback+ Backend running on port ${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`${'='.repeat(60)}\n`);
    });
}
