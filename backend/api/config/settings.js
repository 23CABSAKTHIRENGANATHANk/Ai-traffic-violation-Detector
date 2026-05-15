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

    // Default configuration
    const DEFAULT_CONFIG = {
        speed_limit: 80,
        detection_confidence_threshold: 0.7,
        enable_helmet_detection: true,
        enable_triple_riding_detection: true,
        enable_speed_detection: true,
        enable_red_light_detection: false, // Can be enabled in future
        fine_amounts: {
            'NO_HELMET': 1000,
            'TRIPLE_RIDING': 2000,
            'OVERSPEEDING': 5000,
            'RED_LIGHT': 3000,
            'WRONG_LANE': 2500
        },
        video_processing: {
            max_file_size_mb: 500,
            supported_formats: ['mp4', 'avi', 'mov', 'mkv'],
            max_duration_minutes: 30
        },
        ui_settings: {
            theme: 'dark',
            language: 'en',
            enable_notifications: true,
            chart_type: 'bar'
        }
    };

    if (req.method === 'GET') {
        try {
            console.log('✓ Settings retrieved');
            return res.status(200).json(DEFAULT_CONFIG);
        } catch (err) {
            console.error('✗ Settings Error:', err.message);
            return res.status(500).json({ error: 'Failed to fetch settings' });
        }
    }

    if (req.method === 'POST' || req.method === 'PUT') {
        try {
            const { settings } = req.body;

            if (!settings) {
                return res.status(400).json({ error: 'Settings object is required' });
            }

            // Validate settings
            const validatedSettings = {
                ...DEFAULT_CONFIG,
                ...settings,
                fine_amounts: { ...DEFAULT_CONFIG.fine_amounts, ...settings.fine_amounts },
                video_processing: { ...DEFAULT_CONFIG.video_processing, ...settings.video_processing },
                ui_settings: { ...DEFAULT_CONFIG.ui_settings, ...settings.ui_settings }
            };

            console.log('✓ Settings updated:', validatedSettings);
            
            // In a real implementation, save to database
            // For now, return the validated settings
            return res.status(200).json({
                message: 'Settings updated successfully',
                settings: validatedSettings
            });
        } catch (err) {
            console.error('✗ Settings Update Error:', err.message);
            return res.status(500).json({ error: 'Failed to update settings', details: err.message });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
}
