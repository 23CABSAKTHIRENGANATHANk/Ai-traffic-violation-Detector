// API Configuration
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:3000/api' : '/api');
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || (isLocal ? 'http://localhost:8000' : 'https://your-hf-space.hf.space');

export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    AI_SERVICE_URL: AI_SERVICE_URL,
    ENDPOINTS: {
        VIOLATIONS: `${API_BASE_URL}/violations`,
        UPLOAD: `${API_BASE_URL}/upload`,
        RECORD_VIOLATION: `${API_BASE_URL}/violations/record`,
        AI_DETECT: `${AI_SERVICE_URL}/detect`,
        AI_STREAM: `${AI_SERVICE_URL}/video_feed`,
    }
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
            throw new Error(`API Error: ${response.status}`);
        }
        
        // Handle blob responses (like PDFs)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
            return await response.blob();
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
};

export default API_CONFIG;
