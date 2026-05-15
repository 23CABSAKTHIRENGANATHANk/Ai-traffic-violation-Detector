const pool = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// 1. Record Violation (Called by AI Service)
exports.recordViolation = async (req, res) => {
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
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Database Insert Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// 2. List All Violations (Admin)
exports.getViolations = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM violations ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Approve & Generate Challan (Stream PDF Download)
exports.generateChallan = async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch violation details
        const vResult = await pool.query('SELECT * FROM violations WHERE id = $1', [id]);
        if (vResult.rows.length === 0) return res.status(404).json({ error: 'Violation not found' });

        const violation = vResult.rows[0];

        // Define Fine Amount
        const fines = {
            'NO HELMET': 1000,
            'TRIPLE RIDING': 2000,
            'OVERSPEEDING': 5000
        };
        const amount = fines[violation.violation_type] || 500;

        // Set Headers for Download
        const filename = `Challan_${violation.video_id}_${violation.vehicle_plate || 'UNKNOWN'}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Create PDF Stream
        const doc = new PDFDocument();
        doc.pipe(res);

        // PDF Content
        doc.fontSize(25).text('E-CHALLAN - TRAFFIC CONTROL', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Challan ID: ${Date.now()}`);
        doc.text(`Date: ${new Date().toLocaleString()}`);
        doc.moveDown();
        doc.text(`Vehicle Number: ${violation.vehicle_plate || 'UNKNOWN'}`);
        doc.text(`Violation Type: ${violation.violation_type}`);
        doc.text(`Fine Amount: INR ${amount}`);
        doc.text(`Speed Recorded: ${violation.speed_kmph || 0} kmph`);
        doc.moveDown();

        // Embed Evidence Image
        // Path: backend/src/controllers -> ../../../ai_service/processed
        const evidencePath = path.join(__dirname, '../../../ai_service/processed', violation.evidence_image_path);

        if (fs.existsSync(evidencePath)) {
            doc.text('EVIDENCE IMAGE:', { underline: true });
            doc.moveDown();
            try {
                // Fit image within page width (approx 500px)
                doc.image(evidencePath, { fit: [500, 300], align: 'center' });
                doc.moveDown();
            } catch (imgErr) {
                console.error("Image embedding failed:", imgErr);
                doc.text('[Error loading evidence image]', { color: 'red' });
            }
        } else {
            doc.text('[EVIDENCE IMAGE NOT FOUND]', { align: 'center', color: 'red' });
        }

        doc.end();

        // Update DB Status Only (No Challan Record Saved)
        await pool.query('UPDATE violations SET status = $1 WHERE id = $2', ['APPROVED', id]);

    } catch (err) {
        console.error(err);
        if (!res.headersSent) res.status(500).json({ error: 'Challan creation failed' });
    }
};
