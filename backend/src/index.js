const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { errorHandler, AppError } = require('../lib/errors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =============== Middleware ===============
// Security & Parsing
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Traffic Violation Detection Backend API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Import & Use Routes
const violationRoutes = require('./routes/violationRoutes');
app.use('/api/violations', violationRoutes);

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
