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

    // ============ GET: Fetch single violation ============
    if (req.method === 'GET' && id) {
        try {
            const result = await pool.query('SELECT * FROM violations WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Violation not found' 
                });
            }
            return res.status(200).json({
                success: true,
                data: utils.formatViolation(result.rows[0])
            });
        } catch (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to fetch violation',
                details: err.message 
            });
        }
    }

    // ============ PATCH: Update violation status/details ============
    if (req.method === 'PATCH' && id) {
        try {
            const { status, reviewed_by, notes } = req.body;

            // Validate status if provided
            if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid status. Must be PENDING, APPROVED, or REJECTED'
                });
            }

            const updateFields = [];
            const updateValues = [];
            let paramCount = 1;

            if (status !== undefined) {
                updateFields.push(`status = $${paramCount}`);
                updateValues.push(status);
                paramCount++;
            }

            if (reviewed_by !== undefined) {
                updateFields.push(`reviewed_by = $${paramCount}`);
                updateValues.push(reviewed_by);
                paramCount++;
            }

            if (notes !== undefined) {
                updateFields.push(`notes = $${paramCount}`);
                updateValues.push(notes);
                paramCount++;
            }

            if (status === 'APPROVED' || reviewed_by) {
                updateFields.push(`reviewed_at = CURRENT_TIMESTAMP`);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No fields to update'
                });
            }

            updateValues.push(id);
            const query = `UPDATE violations SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
            
            const result = await pool.query(query, updateValues);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Violation not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: utils.formatViolation(result.rows[0])
            });
        } catch (err) {
            console.error('Update Error:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to update violation',
                details: err.message
            });
        }
    }

    // ============ DELETE: Delete violation ============
    if (req.method === 'DELETE' && id) {
        try {
            const result = await pool.query('DELETE FROM violations WHERE id = $1 RETURNING *', [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Violation not found'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Violation deleted successfully',
                data: utils.formatViolation(result.rows[0])
            });
        } catch (err) {
            console.error('Delete Error:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to delete violation',
                details: err.message
            });
        }
    }

    // ============ POST: Generate Challan PDF ============
    if (req.method === 'POST' && id) {
        try {
            const vResult = await pool.query('SELECT * FROM violations WHERE id = $1', [id]);
            if (vResult.rows.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Violation not found' 
                });
            }

            const violation = vResult.rows[0];
            
            try {
                const { buffer, filename, amount } = await utils.generateChallanPDF(violation);

                // Update status and mark as reviewed
                await pool.query(
                    'UPDATE violations SET status = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2',
                    ['APPROVED', id]
                );

                // Send PDF
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Length', buffer.length);
                return res.status(200).send(buffer);
            } catch (pdfErr) {
                console.warn('Backend PDF generation failed, returning data for client-side generation:', pdfErr.message);
                return res.status(200).json({
                    success: true,
                    message: 'Use client-side PDF generation',
                    data: utils.formatViolation(violation)
                });
            }
        } catch (err) {
            console.error('Challan Generation Error:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to generate challan',
                details: err.message 
            });
        }
    }

    res.status(405).json({ 
        success: false,
        error: 'Method not allowed' 
    });
}
