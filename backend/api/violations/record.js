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

    if (req.method === 'POST') {
        // Record Violation (Called by AI Service)
        // Accept both field names for flexibility: vehicle_plate or vehicle_number, evidence_image_path or evidence_image
        const { 
            video_id, 
            violation_type, 
            timestamp, 
            confidence, 
            speed,
            id
        } = req.body;
        
        // Normalize field names - accept multiple possible field names
        const vehicle_plate = req.body.vehicle_plate || req.body.vehicle_number || 'UNKNOWN';
        const evidence_image_path = req.body.evidence_image_path || req.body.evidence_image || null;
        const vehicle_type = req.body.vehicle_type || 'UNKNOWN';
        const speed_kmph = speed != null ? speed : req.body.speed_kmph || 0;
        const confidence_score = confidence != null ? confidence : 0.95;

        // Validation
        if (!video_id || !violation_type || !timestamp) {
            return res.status(400).json({ error: 'Missing required fields: video_id, violation_type, timestamp' });
        }

        try {
            const query = `
                INSERT INTO violations (video_id, violation_type, timestamp, confidence_score, speed_kmph, vehicle_plate, evidence_image_path, vehicle_type, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
                RETURNING *;
            `;
            const values = [video_id, violation_type, timestamp, confidence_score, speed_kmph, vehicle_plate, evidence_image_path, vehicle_type];
            const result = await pool.query(query, values);

            console.log(`✓ Violation Recorded: ID ${result.rows[0].id}, Type: ${violation_type}, Plate: ${vehicle_plate}`);
            return res.status(201).json(utils.formatViolation(result.rows[0]));
        } catch (err) {
            console.error('✗ Database Insert Error:', err.message);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
}
