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
        const { video_id, violation_type, timestamp, confidence, speed, vehicle_number, evidence_image, vehicle_type } = req.body;

        try {
            const query = `
                INSERT INTO violations (video_id, violation_type, timestamp, confidence_score, speed_kmph, vehicle_plate, evidence_image_path, vehicle_type, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
                RETURNING *;
            `;
            const values = [video_id, violation_type, timestamp, confidence, speed, vehicle_number, evidence_image, vehicle_type];
            const result = await pool.query(query, values);

            console.log(`Violation Recorded: ${result.rows[0].id}`);
            return res.status(201).json(utils.formatViolation(result.rows[0]));
        } catch (err) {
            console.error('Database Insert Error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
}
