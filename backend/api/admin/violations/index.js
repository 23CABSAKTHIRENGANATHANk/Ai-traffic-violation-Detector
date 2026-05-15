const pool = require('../../lib/db');

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Admin Dashboard - Get all violations with filters
    if (req.method === 'GET') {
        try {
            const { status, violation_type, vehicle_type, sort_by = 'timestamp', order = 'DESC', limit = 50, offset = 0 } = req.query;

            let query = 'SELECT * FROM violations WHERE 1=1';
            let countQuery = 'SELECT COUNT(*) as total FROM violations WHERE 1=1';
            let params = [];
            let paramCount = 1;

            // Apply filters
            if (status) {
                query += ` AND status = $${paramCount}`;
                countQuery += ` AND status = $${paramCount}`;
                params.push(status);
                paramCount++;
            }

            if (violation_type) {
                query += ` AND violation_type = $${paramCount}`;
                countQuery += ` AND violation_type = $${paramCount}`;
                params.push(violation_type);
                paramCount++;
            }

            if (vehicle_type) {
                query += ` AND vehicle_type = $${paramCount}`;
                countQuery += ` AND vehicle_type = $${paramCount}`;
                params.push(vehicle_type);
                paramCount++;
            }

            // Add sorting
            const validSortFields = ['timestamp', 'speed_kmph', 'confidence_score', 'created_at'];
            const sortField = validSortFields.includes(sort_by) ? sort_by : 'timestamp';
            const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            
            query += ` ORDER BY ${sortField} ${sortOrder} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            
            params.push(parseInt(limit) || 50, parseInt(offset) || 0);

            // Get violations
            const violationsResult = await pool.query(query, params);
            
            // Get total count
            const countResult = await pool.query(countQuery, params.slice(0, -2));
            const total = countResult.rows[0]?.total || 0;

            console.log(`✓ Admin violations retrieved: ${violationsResult.rows.length} of ${total}`);
            
            return res.status(200).json({
                violations: violationsResult.rows,
                pagination: {
                    total,
                    limit: parseInt(limit) || 50,
                    offset: parseInt(offset) || 0,
                    has_more: (parseInt(offset) || 0) + violationsResult.rows.length < total
                }
            });
        } catch (err) {
            console.error('✗ Admin Dashboard Error:', err.message);
            return res.status(500).json({ error: 'Failed to fetch violations', details: err.message });
        }
    }

    // Update violation status
    if (req.method === 'PATCH') {
        try {
            const { id, status, notes } = req.body;

            if (!id || !status) {
                return res.status(400).json({ error: 'Violation ID and status are required' });
            }

            const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'APPEALED'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            }

            const updateQuery = `
                UPDATE violations 
                SET status = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING *;
            `;

            const result = await pool.query(updateQuery, [status, id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Violation not found' });
            }

            console.log(`✓ Violation ${id} status updated to ${status}`);
            return res.status(200).json(result.rows[0]);
        } catch (err) {
            console.error('✗ Status Update Error:', err.message);
            return res.status(500).json({ error: 'Failed to update violation', details: err.message });
        }
    }

    // Delete violation (soft delete by marking as REJECTED)
    if (req.method === 'DELETE') {
        try {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: 'Violation ID is required' });
            }

            const deleteQuery = `
                UPDATE violations 
                SET status = 'REJECTED', updated_at = NOW()
                WHERE id = $1
                RETURNING *;
            `;

            const result = await pool.query(deleteQuery, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Violation not found' });
            }

            console.log(`✓ Violation ${id} marked as rejected`);
            return res.status(200).json({ message: 'Violation deleted', violation: result.rows[0] });
        } catch (err) {
            console.error('✗ Delete Error:', err.message);
            return res.status(500).json({ error: 'Failed to delete violation', details: err.message });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
}
