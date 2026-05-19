const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate PDF Challan
exports.generateChallanPDF = async (violation) => {
    return new Promise((resolve, reject) => {
        try {
            const fines = {
                'NO HELMET': 1000,
                'TRIPLE RIDING': 2000,
                'OVERSPEEDING': 5000
            };
            const amount = fines[violation.violation_type] || 500;

            const filename = `Challan_${violation.video_id}_${violation.vehicle_plate || 'UNKNOWN'}.pdf`;
            
            // For serverless: Use in-memory buffer
            const chunks = [];
            const doc = new PDFDocument();

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({ buffer, filename, amount });
            });

            // PDF Content
            const issueDate = new Date().toLocaleDateString('en-IN');
            const issueTime = new Date().toLocaleTimeString('en-IN');
            const challanId = `CH-${Date.now()}`;

            doc.rect(50, 50, 500, 40).fill('#8B0000');
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('E-CHALLAN', 60, 58);
            doc.fillColor('#ffffff').fontSize(10).text('Automated Traffic Violation Notice', 60, 84);
            doc.fillColor('#000000');
            doc.moveDown(2);

            doc.font('Helvetica-Bold').fontSize(12).text('Challan Details', { underline: true });
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(10);
            doc.text(`Challan ID: ${challanId}`);
            doc.text(`Issue Date: ${issueDate}`);
            doc.text(`Issue Time: ${issueTime}`);
            doc.moveDown(1);

            doc.font('Helvetica-Bold').fontSize(12).text('Vehicle / Violation Information');
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(10);
            doc.text(`Vehicle Number: ${violation.vehicle_plate || 'UNKNOWN'}`);
            doc.text(`Vehicle Type: ${violation.vehicle_type || 'UNKNOWN'}`);
            doc.text(`Violation Type: ${violation.violation_type}`);
            doc.text(`Recorded Speed: ${violation.speed_kmph || 0} kmph`);
            doc.text(`Recorded At: ${violation.timestamp || 'N/A'}`);
            doc.text(`Detection Confidence: ${Math.round((violation.confidence_score || 0.95) * 100)}%`);
            doc.moveDown(1);

            doc.font('Helvetica-Bold').fontSize(12).text('Fine Summary');
            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').fontSize(16).fillColor('#cc0000').text(`INR ${amount}`, { align: 'left' });
            doc.fillColor('#000000').font('Helvetica').fontSize(10);
            doc.moveDown(1);
            doc.text('Evidence Reference:', { continued: true });
            doc.text(` ${violation.evidence_image_path || 'Not available'}`);
            doc.moveDown(1);

            doc.font('Helvetica-Bold').fontSize(12).text('Important Notice');
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(10);
            doc.text('This e-challan is generated from the AI Traffic Violation Detection System.', { width: 500 });
            doc.text('Pay the fine within 30 days to avoid further enforcement action.', { width: 500 });
            doc.text('Keep this document as proof of the detected violation and payment reference.', { width: 500 });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

// Format violation response
exports.formatViolation = (violation) => {
    return {
        id: violation.id,
        video_id: violation.video_id,
        violation_type: violation.violation_type,
        timestamp: violation.timestamp,
        confidence_score: violation.confidence_score,
        speed_kmph: violation.speed_kmph,
        vehicle_plate: violation.vehicle_plate,
        evidence_image_path: violation.evidence_image_path,
        vehicle_type: violation.vehicle_type,
        status: violation.status,
        created_at: violation.created_at
    };
};
