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

// 2. List All Violations (Admin) - With Pagination & Filtering
exports.getViolations = async (req, res) => {
    try {
        // Pagination parameters
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 20); // Max 100 per page
        const offset = (page - 1) * limit;

        // Filtering parameters
        const status = req.query.status ? req.query.status.toUpperCase() : null;
        const violationType = req.query.violationType ? req.query.violationType.toUpperCase() : null;
        const vehiclePlate = req.query.vehiclePlate ? `%${req.query.vehiclePlate}%` : null;
        const searchTerm = req.query.search ? `%${req.query.search}%` : null;

        // Build dynamic query
        let query = 'SELECT * FROM violations WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            params.push(status);
        }

        if (violationType) {
            paramCount++;
            query += ` AND violation_type = $${paramCount}`;
            params.push(violationType);
        }

        if (vehiclePlate) {
            paramCount++;
            query += ` AND vehicle_plate ILIKE $${paramCount}`;
            params.push(vehiclePlate);
        }

        if (searchTerm) {
            paramCount++;
            query += ` AND (vehicle_plate ILIKE $${paramCount} OR video_id::text ILIKE $${paramCount})`;
            params.push(searchTerm);
        }

        // Add ordering and pagination
        query += ' ORDER BY created_at DESC';

        // Get total count for pagination
        let countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        paramCount++;
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        // Get paginated results
        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching violations:', err);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch violations',
            message: err.message 
        });
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
        let evidencePath = null;
        if (violation.evidence_image_path) {
            evidencePath = path.join(__dirname, '../../../ai_service/processed', violation.evidence_image_path);
        }

        if (evidencePath && fs.existsSync(evidencePath)) {
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

// 4. Get Single Violation by ID
exports.getViolationById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM violations WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Violation not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching violation:', err);
        res.status(500).json({ error: err.message });
    }
};

// 5. Approve Violation
exports.approveViolation = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'UPDATE violations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            ['APPROVED', id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Violation not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error approving violation:', err);
        res.status(500).json({ error: err.message });
    }
};

// 6. Reject Violation
exports.rejectViolation = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'UPDATE violations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            ['REJECTED', id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Violation not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error rejecting violation:', err);
        res.status(500).json({ error: err.message });
    }
};

// 7. Update Violation Status
exports.updateViolationStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    try {
        const result = await pool.query(
            'UPDATE violations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Violation not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating violation status:', err);
        res.status(500).json({ error: err.message });
    }
};

// 8. Delete Violation (Soft Delete)
exports.deleteViolation = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'UPDATE violations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            ['DELETED', id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Violation not found' });
        }
        res.json({ message: 'Violation deleted successfully', violation: result.rows[0] });
    } catch (err) {
        console.error('Error deleting violation:', err);
        res.status(500).json({ error: err.message });
    }
};

// 9. Bulk Approve Violations
exports.bulkApproveViolations = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Valid array of IDs is required' });
    }

    try {
        const result = await pool.query(
            'UPDATE violations SET status = $1, updated_at = NOW() WHERE id = ANY($2) RETURNING *',
            ['APPROVED', ids]
        );
        res.json({ 
            message: `${result.rows.length} violations approved`,
            violations: result.rows 
        });
    } catch (err) {
        console.error('Error bulk approving violations:', err);
        res.status(500).json({ error: err.message });
    }
};

// 10. Bulk Reject Violations
exports.bulkRejectViolations = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Valid array of IDs is required' });
    }

    try {
        const result = await pool.query(
            'UPDATE violations SET status = $1, updated_at = NOW() WHERE id = ANY($2) RETURNING *',
            ['REJECTED', ids]
        );
        res.json({ 
            message: `${result.rows.length} violations rejected`,
            violations: result.rows 
        });
    } catch (err) {
        console.error('Error bulk rejecting violations:', err);
        res.status(500).json({ error: err.message });
    }
};
