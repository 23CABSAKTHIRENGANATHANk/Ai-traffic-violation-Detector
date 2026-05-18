/**
 * WebSocket Manager for Real-time Violation Updates
 * Replaces polling with proper WebSocket connection for live updates
 */

class WebSocketManager {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.listeners = new Map();
        this.isManuallyConnected = false;
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('[WS] Already connected');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                this.isManuallyConnected = true;
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    console.log('[WS] Connected to WebSocket');
                    this.reconnectAttempts = 0;
                    this.emit('connected');
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('[WS] Received:', data);
                        this.handleMessage(data);
                    } catch (err) {
                        console.error('[WS] Failed to parse message:', err);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('[WS] Error:', error);
                    this.emit('error', error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('[WS] Disconnected');
                    this.emit('disconnected');
                    if (this.isManuallyConnected) {
                        this.reconnect();
                    }
                };
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Reconnect with exponential backoff
     */
    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[WS] Max reconnection attempts reached');
            this.emit('reconnect_failed');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`[WS] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
        
        setTimeout(() => {
            this.connect().catch(() => {
                // Reconnect will be called again by onclose
            });
        }, delay);
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        const { type, payload } = data;
        
        switch (type) {
            case 'violation_detected':
                this.emit('violation_new', payload);
                break;
            case 'violation_updated':
                this.emit('violation_updated', payload);
                break;
            case 'violation_approved':
                this.emit('violation_approved', payload);
                break;
            case 'violation_rejected':
                this.emit('violation_rejected', payload);
                break;
            case 'analytics_updated':
                this.emit('analytics_updated', payload);
                break;
            default:
                console.warn('[WS] Unknown message type:', type);
        }
    }

    /**
     * Send message to server
     */
    send(type, payload) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('[WS] WebSocket not connected');
            return false;
        }

        try {
            this.ws.send(JSON.stringify({ type, payload }));
            return true;
        } catch (err) {
            console.error('[WS] Failed to send message:', err);
            return false;
        }
    }

    /**
     * Subscribe to event
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        
        return () => this.off(event, callback); // Return unsubscribe function
    }

    /**
     * Unsubscribe from event
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Emit event
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;
        
        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (err) {
                console.error(`[WS] Error in listener for event ${event}:`, err);
            }
        });
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        this.isManuallyConnected = false;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        console.log('[WS] Disconnected');
    }

    /**
     * Get connection status
     */
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

// Export singleton instance
export const wsManager = new WebSocketManager(
    `${import.meta.env.VITE_WS_URL || (window.location.protocol === 'https:' ? 'wss' : 'ws')}://${window.location.host}/api/ws`
);

export default WebSocketManager;
