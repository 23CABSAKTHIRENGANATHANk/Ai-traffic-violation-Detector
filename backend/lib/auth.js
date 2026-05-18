const jwt = require('jsonwebtoken');

// JWT Secret from environment or default (use env var in production!)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

/**
 * Generate JWT token
 */
exports.generateToken = (userId, role = 'admin') => {
    return jwt.sign(
        { userId, role, iat: Date.now() },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
};

/**
 * Verify JWT token
 */
exports.verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        throw new Error(`Invalid token: ${err.message}`);
    }
};

/**
 * Middleware: Verify JWT Authentication
 * Checks Authorization header for Bearer token
 */
exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'No authentication token provided. Use Authorization: Bearer <token>'
        });
    }

    try {
        const decoded = exports.verifyToken(token);
        req.user = decoded; // Attach user info to request
        next();
    } catch (err) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid or expired token'
        });
    }
};

/**
 * Middleware: Verify Admin Role
 */
exports.requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access required'
        });
    }
    next();
};

/**
 * Middleware: Rate Limiting (Basic in-memory)
 * Tracks requests per IP
 */
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

exports.rateLimitMiddleware = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `${ip}:${Math.floor(Date.now() / RATE_LIMIT_WINDOW)}`;

    const count = (requestCounts.get(key) || 0) + 1;
    requestCounts.set(key, count);

    // Cleanup old entries
    if (requestCounts.size > 10000) {
        requestCounts.clear();
    }

    if (count > RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Max ${RATE_LIMIT_MAX_REQUESTS} requests per minute`,
            retryAfter: 60
        });
    }

    res.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
    res.set('X-RateLimit-Remaining', RATE_LIMIT_MAX_REQUESTS - count);
    next();
};

/**
 * Default credentials for demo (Replace with real user management!)
 */
exports.getDemoUsers = () => {
    return [
        { userId: 1, username: 'admin', password: 'admin123', role: 'admin' },
        { userId: 2, username: 'officer', password: 'officer123', role: 'officer' }
    ];
};

/**
 * Login endpoint handler
 */
exports.login = (username, password) => {
    const users = exports.getDemoUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const token = exports.generateToken(user.userId, user.role);
    return {
        token,
        user: { userId: user.userId, username: user.username, role: user.role }
    };
};
