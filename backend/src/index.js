const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { errorHandler, AppError } = require('../lib/errors');
const { authenticateToken, requireAdmin, rateLimitMiddleware } = require('../lib/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =============== Middleware ===============
// Security & Parsing
// Fixed CORS: Allow only frontend origin for security
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiting for all routes
app.use(rateLimitMiddleware);

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// =============== Static Files ===============
// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve processed videos
app.use('/processed', express.static(path.join(__dirname, '../../ai_service/processed')));

// =============== Routes ===============
// Health check (Public)
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Traffic Violation Detection Backend API',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: ['JWT Authentication', 'Rate Limiting', 'WebSocket Ready', 'Admin Panel']
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Authentication Routes (Public)
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Import & Use Routes
const violationRoutes = require('./routes/violationRoutes');
// Protect violation routes with authentication
app.use('/api/violations', authenticateToken, violationRoutes);

// =============== Error Handling ===============
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler middleware
app.use(errorHandler);

// =============== Server ===============
const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║  Traffic Violation Detection - Backend Server         ║
╠════════════════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}
║  📁 Uploads: ${path.join(__dirname, '../uploads')}
║  🎬 Processed: ${path.join(__dirname, '../../ai_service/processed')}
║  🌍 CORS: ${process.env.CORS_ORIGIN || '*'}
║  🔄 Environment: ${process.env.NODE_ENV || 'development'}
╚════════════════════════════════════════════════════════╝
    `);
});

// =============== Graceful Shutdown ===============
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;
