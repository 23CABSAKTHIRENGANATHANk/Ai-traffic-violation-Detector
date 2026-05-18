import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getDemoUsers, TokenManager } from '../config/api';
import './Login.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [demoUsers, setDemoUsers] = useState([]);
    const [showDemo, setShowDemo] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect if already logged in
        if (TokenManager.hasToken()) {
            navigate('/dashboard');
        }

        // Fetch demo users for testing
        fetchDemoUsers();
    }, []);

    const fetchDemoUsers = async () => {
        try {
            const data = await getDemoUsers();
            setDemoUsers(data.users || []);
        } catch (err) {
            console.error('Failed to fetch demo users:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!username || !password) {
                throw new Error('Please enter both username and password');
            }

            const result = await login(username, password);
            
            // Navigate to dashboard on successful login
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
            setPassword(''); // Clear password on error
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = (demoUser) => {
        setUsername(demoUser.username);
        setPassword(demoUser.password);
        setError('');
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>🚦 Traffic Violation Detector</h1>
                    <p>Admin Login Portal</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            disabled={loading}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            disabled={loading}
                            className="form-input"
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="submit-button"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Demo Users Section */}
                {demoUsers.length > 0 && (
                    <div className="demo-section">
                        <button 
                            type="button"
                            onClick={() => setShowDemo(!showDemo)}
                            className="demo-toggle"
                        >
                            {showDemo ? '✕ Hide Demo' : '📋 Show Demo Credentials'}
                        </button>

                        {showDemo && (
                            <div className="demo-users">
                                <p className="demo-title">Available Test Accounts:</p>
                                {demoUsers.map((user, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleDemoLogin(user)}
                                        className="demo-user-button"
                                    >
                                        <span className="demo-role">{user.role.toUpperCase()}</span>
                                        <span className="demo-creds">{user.username} / {user.password}</span>
                                    </button>
                                ))}
                                <p className="demo-warning">⚠️ These are demo credentials only. Replace with real authentication in production.</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="login-info">
                    <h3>🔒 Security Information</h3>
                    <ul>
                        <li>All admin actions require JWT authentication</li>
                        <li>Tokens expire after 7 days</li>
                        <li>Rate limiting: 100 requests per minute per IP</li>
                        <li>CORS restricted to configured domain</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
