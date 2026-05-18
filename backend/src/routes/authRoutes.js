const express = require('express');
const router = express.Router();
const { login, generateToken, getDemoUsers } = require('../../lib/auth');

/**
 * POST /api/auth/login
 * Login endpoint - returns JWT token
 * 
 * Body: { username, password }
 * Response: { token, user: { userId, username, role } }
 */
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: 'Invalid request',
            message: 'username and password are required'
        });
    }

    try {
        const result = login(username, password);
        res.json(result);
    } catch (err) {
        res.status(401).json({
            error: 'Authentication failed',
            message: err.message
        });
    }
});

/**
 * GET /api/auth/demo-users
 * Get demo users for testing
 */
router.get('/demo-users', (req, res) => {
    const users = getDemoUsers().map(u => ({
        username: u.username,
        password: u.password,
        role: u.role
    }));
    res.json({
        message: 'Demo credentials for testing',
        users,
        note: 'NEVER use these hardcoded credentials in production!'
    });
});

module.exports = router;
