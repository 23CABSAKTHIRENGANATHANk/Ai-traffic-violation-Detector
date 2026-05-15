// Form Validation Utilities

export const validators = {
    vehicleNumber: (value) => {
        if (!value) return 'Vehicle number is required';
        if (!/^[A-Z0-9]{2,10}$/.test(value.toUpperCase())) {
            return 'Invalid vehicle number format';
        }
        return null;
    },

    violationType: (value) => {
        const validTypes = ['OVERSPEEDING', 'NO HELMET', 'TRIPLE RIDING', 'RED SIGNAL', 'PARKING VIOLATION'];
        if (!value) return 'Violation type is required';
        if (!validTypes.includes(value)) return 'Invalid violation type';
        return null;
    },

    vehicleType: (value) => {
        const validTypes = ['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS', 'AUTORICKSHAW'];
        if (!value) return 'Vehicle type is required';
        if (!validTypes.includes(value)) return 'Invalid vehicle type';
        return null;
    },

    speed: (value) => {
        if (value && isNaN(value)) return 'Speed must be a number';
        if (value && (value < 0 || value > 300)) return 'Speed must be between 0 and 300 km/h';
        return null;
    },

    confidence: (value) => {
        if (isNaN(value)) return 'Confidence must be a number';
        if (value < 0 || value > 1) return 'Confidence must be between 0 and 1';
        return null;
    },

    email: (value) => {
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email address';
        return null;
    },

    phone: (value) => {
        if (!value) return 'Phone number is required';
        if (!/^[0-9]{10}$/.test(value.replace(/\D/g, ''))) {
            return 'Phone number must be 10 digits';
        }
        return null;
    },

    licenseNumber: (value) => {
        if (!value) return 'License number is required';
        if (!/^[A-Z0-9]{4,20}$/.test(value.toUpperCase())) {
            return 'Invalid license number format';
        }
        return null;
    },

    address: (value) => {
        if (!value) return 'Address is required';
        if (value.length < 10) return 'Address must be at least 10 characters';
        if (value.length > 200) return 'Address must not exceed 200 characters';
        return null;
    },

    name: (value) => {
        if (!value) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (!/^[a-zA-Z\s\-.']+$/.test(value)) return 'Name contains invalid characters';
        return null;
    },
};

export const validateForm = (data, schema) => {
    const errors = {};
    Object.keys(schema).forEach(field => {
        const validator = schema[field];
        const error = validator(data[field]);
        if (error) errors[field] = error;
    });
    return errors;
};

export const formatIndianNumber = (num) => {
    return num.toLocaleString('en-IN');
};

export const formatDate = (date, format = 'en-IN') => {
    return new Date(date).toLocaleDateString(format);
};

export const formatDateTime = (date, format = 'en-IN') => {
    const d = new Date(date);
    return `${d.toLocaleDateString(format)} ${d.toLocaleTimeString(format, { hour: '2-digit', minute: '2-digit' })}`;
};

export const calculateDueDate = (issueDate, days = 30) => {
    const date = new Date(issueDate);
    date.setDate(date.getDate() + days);
    return date;
};

// File validation for uploads
export const validateFile = (file, options = {}) => {
    const {
        maxSize = 100 * 1024 * 1024, // 100MB
        allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime'],
    } = options;

    if (!file) return 'File is required';
    if (file.size > maxSize) return `File size exceeds ${maxSize / (1024 * 1024)}MB limit`;
    if (!allowedTypes.includes(file.type)) return 'Invalid file type. Only video files are allowed';
    return null;
};

// API Response handling
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return 'Network error: Unable to connect to server';
    }
    if (error.message.includes('timeout')) {
        return 'Request timeout: Server took too long to respond';
    }
    return error.message || defaultMessage;
};
