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

    // ============ GET: Fetch violations with filters ============
    if (req.method === 'GET') {
        try {
            const { 
                status, 
                violation_type, 
                vehicle_type,
                vehicle_plate,
                sort_by = 'created_at',
                order = 'DESC',
                limit = 50,
                offset = 0,
                search
            } = req.query;

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

            if (vehicle_plate) {
                query += ` AND vehicle_plate ILIKE $${paramCount}`;
                countQuery += ` AND vehicle_plate ILIKE $${paramCount}`;
                params.push(`%${vehicle_plate}%`);
                paramCount++;
            }

            if (search) {
                query += ` AND (vehicle_plate ILIKE $${paramCount} OR video_id ILIKE $${paramCount})`;
                countQuery += ` AND (vehicle_plate ILIKE $${paramCount} OR video_id ILIKE $${paramCount})`;
                const searchTerm = `%${search}%`;
                params.push(searchTerm);
                params.push(searchTerm);
                paramCount += 2;
            }

            // Add sorting with validation
            const validSortFields = ['timestamp', 'speed_kmph', 'confidence_score', 'created_at', 'id'];
            const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
            const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            
            query += ` ORDER BY ${sortField} ${sortOrder}`;
            query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;

            // Execute queries
            const countResult = await pool.query(countQuery, params.slice(0, paramCount - 1));
            const result = await pool.query(query, [...params, parseInt(limit), parseInt(offset)]);

            return res.status(200).json({
                success: true,
                data: result.rows.map(v => utils.formatViolation(v)),
                total: parseInt(countResult.rows[0]?.total || 0),
                count: result.rows.length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        } catch (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to fetch violations',
                details: err.message 
            });
        }
    }

    // ============ POST: Create violation (for testing/manual entry) ============
    if (req.method === 'POST') {
        try {
            const {
                video_id,
                violation_type,
                timestamp,
                confidence_score,
                speed_kmph,
                vehicle_plate,
                evidence_image_path,
                vehicle_type,
                location
            } = req.body;

            // Validation
            if (!violation_type || !timestamp) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Missing required fields: violation_type, timestamp'
                });
            }

            const query = `
                INSERT INTO violations 
                (video_id, violation_type, timestamp, confidence_score, speed_kmph, 
                 vehicle_plate, evidence_image_path, vehicle_type, location, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
                RETURNING *;
            `;

            const values = [
                video_id || null,
                violation_type,
                timestamp,
                confidence_score || 0.95,
                speed_kmph || null,
                vehicle_plate || 'UNKNOWN',
                evidence_image_path || null,
                vehicle_type || 'UNKNOWN',
                location || null
            ];

            const result = await pool.query(query, values);
            return res.status(201).json({
                success: true,
                data: utils.formatViolation(result.rows[0])
            });
        } catch (err) {
            console.error('Insert Error:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to create violation',
                details: err.message 
            });
        }
    }

    return res.status(405).json({ 
        success: false,
        error: 'Method not allowed' 
    });
}
