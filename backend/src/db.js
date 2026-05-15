const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Attempt to connect to real DB, but fallback to Mock if it fails OR if we just want to force Mock for Demo
// For this environment where Postgres might not be running, we will use a robust In-Memory Mock.

class MockDB {
    constructor() {
        this.violations = [
            {
                id: 1,
                video_id: 'sample_video_01',
                violation_type: 'OVERSPEEDING',
                timestamp: new Date().toISOString(),
                confidence_score: 0.95,
                speed_kmph: 85,
                vehicle_plate: 'TN38AB1234',
                evidence_image_path: 'sample_evidence_1.jpg',
                vehicle_type: 'CAR',
                status: 'PENDING',
                created_at: new Date()
            },
            {
                id: 2,
                video_id: 'sample_video_02',
                violation_type: 'NO HELMET',
                timestamp: new Date().toISOString(),
                confidence_score: 0.88,
                speed_kmph: 45,
                vehicle_plate: 'KA01HJ9988',
                evidence_image_path: 'sample_evidence_2.jpg',
                vehicle_type: 'MOTORCYCLE',
                status: 'APPROVED',
                created_at: new Date(Date.now() - 3600000) // 1 hour ago
            }
        ];
        this.challans = [];
        console.log('⚠️  Using In-Memory Mock Database (Initialized with Sample Data) ⚠️');
    }

    async query(text, params = []) {
        console.log(`[MockDB Query]: ${text.substring(0, 50)}...`);

        // 1. Insert Violation
        if (text.includes('INSERT INTO violations')) {
            const newViolation = {
                id: this.violations.length + 1,
                video_id: params[0],
                violation_type: params[1],
                timestamp: params[2],
                confidence_score: params[3],
                speed_kmph: params[4],
                vehicle_plate: params[5],
                evidence_image_path: params[6],
                vehicle_type: params[7] || 'UNKNOWN',
                status: 'PENDING',
                created_at: new Date()
            };
            this.violations.push(newViolation);
            return { rows: [newViolation] };
        }

        // 2. Select All Violations
        if (text.includes('SELECT * FROM violations ORDER BY')) {
            return { rows: [...this.violations].reverse() };
        }

        // 3. Select Single Violation
        if (text.includes('SELECT * FROM violations WHERE id')) {
            const id = parseInt(params[0]);
            const found = this.violations.find(v => v.id === id);
            return { rows: found ? [found] : [] };
        }

        // 4. Update Violation Status
        if (text.includes('UPDATE violations SET status')) {
            const id = parseInt(params[1]);
            const found = this.violations.find(v => v.id === id);
            if (found) found.status = params[0];
            return { rows: found ? [found] : [] };
        }

        // 5. Insert Challan
        if (text.includes('INSERT INTO challans')) {
            const newChallan = {
                id: params[0],
                violation_id: params[0],
                amount: params[1],
                pdf_path: params[2],
                issued_at: new Date()
            };
            this.challans.push(newChallan);
            return { rows: [newChallan] };
        }

        return { rows: [] };
    }
}

// Export MockDB instance effectively acting as the Pool
module.exports = new MockDB();
