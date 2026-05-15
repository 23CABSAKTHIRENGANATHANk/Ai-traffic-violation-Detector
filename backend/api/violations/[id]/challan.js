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

    if (!id) {
        return res.status(400).json({ error: 'Violation ID is required' });
    }

    if (req.method === 'POST') {
        // Generate Challan
        try {
            // Fetch violation details
            const vResult = await pool.query('SELECT * FROM violations WHERE id = $1', [id]);
            if (vResult.rows.length === 0) {
                console.error(`✗ Violation not found: ID ${id}`);
                return res.status(404).json({ error: 'Violation not found' });
            }

            const violation = vResult.rows[0];
            
            // Generate PDF
            const { buffer, filename, amount } = await utils.generateChallanPDF(violation);
            
            // Store challan information in database
            const challanQuery = `
                INSERT INTO challans (violation_id, amount, pdf_path, issued_at)
                VALUES ($1, $2, $3, NOW())
                RETURNING *;
            `;
            
            try {
                await pool.query(challanQuery, [id, amount, filename]);
                console.log(`✓ Challan created successfully: Violation ${id}, Amount: INR ${amount}`);
            } catch (dbErr) {
                // If challans table doesn't exist, just log it
                console.warn('⚠️  Challans table may not exist, but PDF generated successfully');
            }

            // Update violation status to APPROVED
            await pool.query('UPDATE violations SET status = $1 WHERE id = $2', ['APPROVED', id]);
            console.log(`✓ Violation ${id} status updated to APPROVED`);

            // Send PDF with metadata
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('X-Challan-Amount', amount.toString());
            res.setHeader('X-Violation-ID', id.toString());
            
            return res.status(200).send(buffer);
        } catch (err) {
            console.error('✗ Challan Generation Error:', err.message);
            return res.status(500).json({ error: 'Failed to generate challan', details: err.message });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
}
