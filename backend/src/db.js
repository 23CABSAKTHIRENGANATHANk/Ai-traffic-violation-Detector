const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

/**
 * MockDB: In-Memory Database for Development/Demo
 * Supports pagination, filtering, and basic queries
 */
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
                created_at: new Date(),
                updated_at: new Date()
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
                created_at: new Date(Date.now() - 3600000),
                updated_at: new Date(Date.now() - 3600000)
            },
            {
                id: 3,
                video_id: 'sample_video_03',
                violation_type: 'TRIPLE RIDING',
                timestamp: new Date().toISOString(),
                confidence_score: 0.92,
                speed_kmph: 50,
                vehicle_plate: 'MH02AB5555',
                evidence_image_path: 'sample_evidence_3.jpg',
                vehicle_type: 'MOTORCYCLE',
                status: 'REJECTED',
                created_at: new Date(Date.now() - 7200000),
                updated_at: new Date(Date.now() - 7200000)
            }
        ];
        this.challans = [];
        this.nextViolationId = 4;
        console.log('✅ Using In-Memory Mock Database (Development Mode)');
    }

    async query(text, params = []) {
        // Remove comments and normalize whitespace
        const normalized = text.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
        
        // COUNT QUERY
        if (normalized.includes('SELECT COUNT(*) as total')) {
            let results = [...this.violations];
            results = this._applyFilters(results, text, params);
            return { rows: [{ total: results.length.toString() }] };
        }

        // SELECT with pagination
        if (normalized.includes('SELECT * FROM violations') && normalized.includes('LIMIT')) {
            let results = [...this.violations];
            results = this._applyFilters(results, text, params);
            
            // Sort by created_at DESC
            results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Extract LIMIT and OFFSET
            const limitMatch = normalized.match(/LIMIT\s+\$(\d+)/);
            const offsetMatch = normalized.match(/OFFSET\s+\$(\d+)/);
            
            if (limitMatch && offsetMatch) {
                const limitIndex = parseInt(limitMatch[1]) - 1;
                const offsetIndex = parseInt(offsetMatch[1]) - 1;
                const limit = parseInt(params[limitIndex]);
                const offset = parseInt(params[offsetIndex]);
                results = results.slice(offset, offset + limit);
            }
            
            return { rows: results };
        }

        // SELECT ALL (no pagination)
        if (normalized.includes('SELECT * FROM violations')) {
            let results = [...this.violations];
            results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            return { rows: results };
        }

        // SELECT by ID
        if (normalized.includes('SELECT * FROM violations WHERE id')) {
            const id = parseInt(params[0]);
            const found = this.violations.find(v => v.id === id);
            return { rows: found ? [found] : [] };
        }

        // INSERT violation
        if (normalized.includes('INSERT INTO violations')) {
            const newViolation = {
                id: this.nextViolationId++,
                video_id: params[0],
                violation_type: params[1],
                timestamp: params[2],
                confidence_score: params[3],
                speed_kmph: params[4],
                vehicle_plate: params[5],
                evidence_image_path: params[6],
                vehicle_type: params[7] || 'UNKNOWN',
                status: 'PENDING',
                created_at: new Date(),
                updated_at: new Date()
            };
            this.violations.push(newViolation);
            return { rows: [newViolation] };
        }

        // UPDATE violation status
        if (normalized.includes('UPDATE violations SET status')) {
            const statusIndex = 0;
            const idIndex = text.includes('$1') ? 1 : 0;
            const id = parseInt(params[idIndex]);
            const status = params[statusIndex];
            
            const found = this.violations.find(v => v.id === id);
            if (found) {
                found.status = status;
                found.updated_at = new Date();
            }
            return { rows: found ? [found] : [] };
        }

        // UPDATE with ANY (for bulk operations)
        if (normalized.includes('UPDATE violations') && normalized.includes('ANY')) {
            const status = params[0];
            const ids = params[1];
            const updated = [];
            
            ids.forEach(id => {
                const found = this.violations.find(v => v.id === id);
                if (found) {
                    found.status = status;
                    found.updated_at = new Date();
                    updated.push(found);
                }
            });
            
            return { rows: updated };
        }

        // INSERT challan
        if (normalized.includes('INSERT INTO challans')) {
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

        // Default: return empty
        return { rows: [] };
    }

    /**
     * Apply WHERE filters to results
     */
    _applyFilters(results, text, params) {
        // This is a simplified filter - in production, use proper SQL parser
        let paramIndex = 0;

        // Extract WHERE conditions from text
        if (text.includes('WHERE')) {
            // Status filter
            if (text.includes('status = $')) {
                const status = params[paramIndex];
                paramIndex++;
                results = results.filter(v => v.status === status);
            }

            // Violation type filter
            if (text.includes('violation_type = $')) {
                const type = params[paramIndex];
                paramIndex++;
                results = results.filter(v => v.violation_type === type);
            }

            // Vehicle plate filter
            if (text.includes('vehicle_plate ILIKE $')) {
                const plate = params[paramIndex];
                paramIndex++;
                results = results.filter(v => v.vehicle_plate && v.vehicle_plate.toLowerCase().includes(plate.toLowerCase().replace(/%/g, '')));
            }

            // Search filter
            if (text.includes('(vehicle_plate ILIKE') || text.includes('OR video_id::text ILIKE')) {
                const search = params[paramIndex];
                paramIndex++;
                const searchLower = search.toLowerCase().replace(/%/g, '');
                results = results.filter(v => 
                    (v.vehicle_plate && v.vehicle_plate.toLowerCase().includes(searchLower)) ||
                    (v.video_id && v.video_id.toLowerCase().includes(searchLower))
                );
            }
        }

        return results;
    }
}

// Try to use real PostgreSQL, fallback to MockDB
let pool;
try {
    if (process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME)) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        pool.on('error', (err) => {
            console.warn('❌ PostgreSQL connection error, falling back to MockDB:', err.message);
            pool = new MockDB();
        });
        
        // Test connection
        pool.query('SELECT NOW();').then(() => {
            console.log('✅ Connected to PostgreSQL');
        }).catch(() => {
            console.warn('❌ PostgreSQL unavailable, using MockDB');
            pool = new MockDB();
        });
    } else {
        throw new Error('Database credentials not provided');
    }
} catch (err) {
    console.log('📝 Using MockDB (development mode)');
    pool = new MockDB();
}

module.exports = pool;
