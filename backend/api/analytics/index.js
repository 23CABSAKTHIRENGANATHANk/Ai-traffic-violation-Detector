const pool = require('../../lib/db');

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        try {
            // Get analytics data
            const violationsResult = await pool.query('SELECT * FROM violations ORDER BY timestamp DESC LIMIT 1000');
            const violations = violationsResult.rows || [];

            // Calculate analytics
            const analytics = {
                total_violations: violations.length,
                violations_by_type: {},
                violations_by_vehicle_type: {},
                average_speed: 0,
                recent_violations: violations.slice(0, 10),
                status_breakdown: { PENDING: 0, APPROVED: 0, REJECTED: 0 },
                total_fine_amount: 0,
            };

            // Process violations for analytics
            const fines = {
                'NO HELMET': 1000,
                'TRIPLE RIDING': 2000,
                'OVERSPEEDING': 5000,
                'RED LIGHT': 3000,
                'WRONG LANE': 2500
            };

            let totalSpeed = 0;
            let speedCount = 0;

            violations.forEach(v => {
                // By type
                analytics.violations_by_type[v.violation_type] = (analytics.violations_by_type[v.violation_type] || 0) + 1;
                
                // By vehicle type
                analytics.violations_by_vehicle_type[v.vehicle_type] = (analytics.violations_by_vehicle_type[v.vehicle_type] || 0) + 1;
                
                // Status breakdown
                analytics.status_breakdown[v.status] = (analytics.status_breakdown[v.status] || 0) + 1;
                
                // Average speed
                if (v.speed_kmph) {
                    totalSpeed += v.speed_kmph;
                    speedCount++;
                }

                // Fine calculation
                const fine = fines[v.violation_type] || 500;
                analytics.total_fine_amount += fine;
            });

            analytics.average_speed = speedCount > 0 ? (totalSpeed / speedCount).toFixed(2) : 0;
            
            // Time-based analytics (today, this week, this month)
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

            analytics.violations_today = violations.filter(v => new Date(v.timestamp) >= today).length;
            analytics.violations_this_week = violations.filter(v => new Date(v.timestamp) >= weekAgo).length;
            analytics.violations_this_month = violations.filter(v => new Date(v.timestamp) >= monthAgo).length;

            console.log(`✓ Analytics retrieved: ${analytics.total_violations} violations`);
            return res.status(200).json(analytics);
        } catch (err) {
            console.error('✗ Analytics Error:', err.message);
            return res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
}
