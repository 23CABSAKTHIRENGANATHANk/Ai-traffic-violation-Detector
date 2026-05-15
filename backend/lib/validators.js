const { AppError } = require('./errors');

// Validate violation input
const validateViolation = (req, res, next) => {
    const { video_id, violation_type, timestamp, confidence, speed, vehicle_number, vehicle_type } = req.body;

    const errors = [];

    if (!video_id || typeof video_id !== 'string' || video_id.trim() === '') {
        errors.push('video_id is required and must be a non-empty string');
    }

    if (!violation_type || !['OVERSPEEDING', 'NO HELMET', 'TRIPLE RIDING', 'RED SIGNAL', 'PARKING VIOLATION', 'WRONG SIDE'].includes(violation_type)) {
        errors.push('violation_type is required and must be a valid violation type');
    }

    if (!timestamp || isNaN(Date.parse(timestamp))) {
        errors.push('timestamp is required and must be a valid ISO date string');
    }

    if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
        errors.push('confidence must be a number between 0 and 1');
    }

    if (typeof speed !== 'number' || speed < 0 || speed > 300) {
        errors.push('speed must be a number between 0 and 300 km/h');
    }

    if (!vehicle_number || typeof vehicle_number !== 'string' || vehicle_number.trim() === '') {
        errors.push('vehicle_number is required and must be a non-empty string');
    }

    if (!vehicle_type || !['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS', 'AUTORICKSHAW', 'BICYCLE', 'SCOOTER'].includes(vehicle_type)) {
        errors.push('vehicle_type is required and must be a valid vehicle type');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

// Validate file upload
const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const allowedMimes = ['video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-matroska'];
    if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid file type. Only video files are allowed.'
        });
    }

    // Max file size: 200 MB
    const maxSize = 200 * 1024 * 1024;
    if (req.file.size > maxSize) {
        return res.status(400).json({
            success: false,
            message: 'File size exceeds 200 MB limit'
        });
    }

    next();
};

// Validate query parameters
const validateQueryParams = (allowedParams) => (req, res, next) => {
    const { status, type, limit, offset } = req.query;

    if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status parameter'
        });
    }

    if (type && !['OVERSPEEDING', 'NO HELMET', 'TRIPLE RIDING', 'RED SIGNAL', 'PARKING VIOLATION'].includes(type)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid violation type parameter'
        });
    }

    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        return res.status(400).json({
            success: false,
            message: 'Limit must be a number between 1 and 100'
        });
    }

    if (offset && (isNaN(offset) || offset < 0)) {
        return res.status(400).json({
            success: false,
            message: 'Offset must be a non-negative number'
        });
    }

    next();
};

module.exports = {
    validateViolation,
    validateFileUpload,
    validateQueryParams
};
