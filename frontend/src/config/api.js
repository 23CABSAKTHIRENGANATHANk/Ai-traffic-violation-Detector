// API Configuration
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:3000/api' : '/api');
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || (isLocal ? 'http://localhost:8000' : 'https://your-hf-space.hf.space');

export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    AI_SERVICE_URL: AI_SERVICE_URL,
    ENDPOINTS: {
        // Violation endpoints
        VIOLATIONS: `${API_BASE_URL}/violations`,
        VIOLATIONS_ALL: `${API_BASE_URL}/violations`,
        UPLOAD: `${API_BASE_URL}/upload`,
        RECORD_VIOLATION: `${API_BASE_URL}/violations/record`,
        
        // AI Service endpoints
        AI_DETECT: `${AI_SERVICE_URL}/detect`,
        AI_STREAM: `${AI_SERVICE_URL}/video_feed`,
        AI_VIOLATIONS: `${AI_SERVICE_URL}/violations`,
        
        // Analytics endpoints
        ANALYTICS: `${API_BASE_URL}/analytics`,
        
        // Admin endpoints
        ADMIN_VIOLATIONS: `${API_BASE_URL}/admin/violations`,
        
        // Settings endpoints
        SETTINGS: `${API_BASE_URL}/config/settings`,
        
        // Challan endpoints
        GENERATE_CHALLAN: (id) => `${API_BASE_URL}/violations/${id}/challan`,
    }
};

// Error handler
export const handleError = (error) => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
            code: 'NETWORK_ERROR',
            message: 'Network connection failed. Please check your connection.',
            status: null
        };
    }
    
    if (error instanceof SyntaxError) {
        return {
            code: 'PARSE_ERROR',
            message: 'Failed to parse server response.',
            status: null
        };
    }

    if (error.response) {
        return {
            code: 'HTTP_ERROR',
            message: error.response.data?.message || error.message,
            status: error.response.status
        };
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        status: null
    };
};

// Fetch wrapper with error handling
export const apiCall = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            const error = new Error(errorData || `HTTP ${response.status}`);
            error.response = { status: response.status, data: errorData };
            throw error;
        }
        
        // Handle blob responses (like PDFs)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
            return await response.blob();
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Call Error:', error);
        throw handleError(error);
    }
};

// Upload file with progress
export const uploadFile = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) => {
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });
            
            xhr.open('POST', `${API_BASE_URL}/upload`);
            xhr.send(formData);
        });
    } catch (error) {
        throw handleError(error);
    }
};

export default API_CONFIG;
