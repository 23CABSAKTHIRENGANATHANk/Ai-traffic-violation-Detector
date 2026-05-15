const pool = require('../../../lib/db');
const utils = require('../../../lib/utils');

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

    const { id } = req.query;

    if (req.method === 'GET' && id) {
        try {
            const result = await pool.query('SELECT * FROM violations WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Violation not found' });
            }
            return res.status(200).json(result.rows[0]);
        } catch (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'Failed to fetch violation' });
        }
    }

    if (req.method === 'POST' && id) {
        // Generate Challan
        try {
            const vResult = await pool.query('SELECT * FROM violations WHERE id = $1', [id]);
            if (vResult.rows.length === 0) {
                return res.status(404).json({ error: 'Violation not found' });
            }

            const violation = vResult.rows[0];
            const { buffer, filename, amount } = await utils.generateChallanPDF(violation);

            // Update status
            await pool.query('UPDATE violations SET status = $1 WHERE id = $2', ['APPROVED', id]);

            // Send PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.status(200).send(buffer);
        } catch (err) {
            console.error('Challan Generation Error:', err);
            return res.status(500).json({ error: 'Failed to generate challan' });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
}
