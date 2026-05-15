const pool = require('../../lib/db');
const utils = require('../../lib/utils');

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM violations ORDER BY created_at DESC');
            return res.status(200).json(result.rows.map(v => utils.formatViolation(v)));
        } catch (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'Failed to fetch violations' });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
}
