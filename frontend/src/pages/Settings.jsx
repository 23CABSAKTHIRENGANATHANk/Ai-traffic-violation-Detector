import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FaCog, FaSave, FaCheckCircle, FaExclamationTriangle,
    FaToggleOn, FaToggleOff, FaSlider, FaSpinner, FaArrowLeft
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';

const Settings = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [changes, setChanges] = useState({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_CONFIG.ENDPOINTS.SETTINGS);
            if (!response.ok) throw new Error('Failed to fetch settings');
            const data = await response.json();
            setSettings(data);
            setChanges({});
        } catch (err) {
            console.error('Settings fetch error:', err);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = (path, value) => {
        setChanges({
            ...changes,
            [path]: value
        });
    };

    const saveSettings = async () => {
        if (Object.keys(changes).length === 0) {
            setMessage({ type: 'info', text: 'No changes to save' });
            return;
        }

        try {
            setSaving(true);
            
            // Apply changes to settings object
            const updatedSettings = JSON.parse(JSON.stringify(settings));
            Object.keys(changes).forEach(path => {
                const keys = path.split('.');
                let obj = updatedSettings;
                for (let i = 0; i < keys.length - 1; i++) {
                    obj = obj[keys[i]];
                }
                obj[keys[keys.length - 1]] = changes[path];
            });

            const response = await fetch(API_CONFIG.ENDPOINTS.SETTINGS, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: updatedSettings })
            });

            if (!response.ok) throw new Error('Failed to save settings');
            
            const result = await response.json();
            setSettings(result.settings);
            setChanges({});
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
            
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error('Save error:', err);
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950">
                <div className="text-center">
                    <FaSpinner className="text-6xl text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-300">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-800 rounded transition"
                    >
                        <FaArrowLeft className="text-xl" />
                    </button>
                    <FaCog className="text-4xl text-blue-500" />
                    <h1 className="text-4xl font-bold">System Settings</h1>
                </div>
                <p className="text-slate-400">Configure detection and system parameters</p>
            </motion.div>

            {message && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`mb-6 px-6 py-4 rounded-lg border ${
                        message.type === 'success'
                            ? 'bg-green-500/20 border-green-500 text-green-200'
                            : message.type === 'error'
                            ? 'bg-red-500/20 border-red-500 text-red-200'
                            : 'bg-blue-500/20 border-blue-500 text-blue-200'
                    } flex items-center gap-3`}
                >
                    {message.type === 'success' ? (
                        <FaCheckCircle className="text-xl flex-shrink-0" />
                    ) : (
                        <FaExclamationTriangle className="text-xl flex-shrink-0" />
                    )}
                    {message.text}
                </motion.div>
            )}

            <div className="space-y-8">
                {/* Detection Settings */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800 rounded-lg p-8 border border-slate-700"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-blue-400">🚨</span>
                        Violation Detection Settings
                    </h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Speed Limit */}
                            <div>
                                <label className="block text-sm font-semibold mb-3">Speed Limit (km/h)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="200"
                                    value={changes['speed_limit'] !== undefined ? changes['speed_limit'] : (settings?.speed_limit || 80)}
                                    onChange={(e) => updateSetting('speed_limit', parseInt(e.target.value))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition"
                                />
                                <p className="text-xs text-slate-400 mt-2">Default: 80 km/h</p>
                            </div>

                            {/* Confidence Threshold */}
                            <div>
                                <label className="block text-sm font-semibold mb-3">Detection Confidence Threshold</label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.0"
                                    step="0.05"
                                    value={changes['detection_confidence_threshold'] !== undefined ? changes['detection_confidence_threshold'] : (settings?.detection_confidence_threshold || 0.7)}
                                    onChange={(e) => updateSetting('detection_confidence_threshold', parseFloat(e.target.value))}
                                    className="w-full"
                                />
                                <p className="text-sm text-blue-400 mt-2">
                                    {((changes['detection_confidence_threshold'] !== undefined ? changes['detection_confidence_threshold'] : (settings?.detection_confidence_threshold || 0.7)) * 100).toFixed(0)}%
                                </p>
                            </div>
                        </div>

                        {/* Feature Toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { key: 'enable_helmet_detection', label: 'Helmet Detection', icon: '🪖' },
                                { key: 'enable_triple_riding_detection', label: 'Triple Riding Detection', icon: '🏍️' },
                                { key: 'enable_speed_detection', label: 'Speed Detection', icon: '⚡' }
                            ].map(feature => (
                                <div key={feature.key} className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                                    <span className="text-3xl">{feature.icon}</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{feature.label}</p>
                                        <p className="text-xs text-slate-400">
                                            {changes[feature.key] !== undefined 
                                                ? (changes[feature.key] ? 'Enabled' : 'Disabled')
                                                : (settings?.[feature.key] ? 'Enabled' : 'Disabled')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => updateSetting(feature.key, !(changes[feature.key] !== undefined ? changes[feature.key] : settings?.[feature.key]))}
                                        className="text-2xl transition transform hover:scale-110"
                                    >
                                        {(changes[feature.key] !== undefined ? changes[feature.key] : settings?.[feature.key]) ? (
                                            <FaToggleOn className="text-green-400" />
                                        ) : (
                                            <FaToggleOff className="text-slate-500" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Fine Amounts */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800 rounded-lg p-8 border border-slate-700"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-green-400">💰</span>
                        Fine Amounts (INR)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(settings?.fine_amounts || {}).map(([type, amount]) => (
                            <div key={type}>
                                <label className="block text-sm font-semibold mb-3">
                                    {type.replace(/_/g, ' ')}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={changes[`fine_amounts.${type}`] !== undefined ? changes[`fine_amounts.${type}`] : amount}
                                    onChange={(e) => updateSetting(`fine_amounts.${type}`, parseInt(e.target.value))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-slate-200 focus:outline-none focus:border-green-500 transition"
                                />
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Video Processing Settings */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800 rounded-lg p-8 border border-slate-700"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-purple-400">🎥</span>
                        Video Processing Settings
                    </h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold mb-3">Max File Size (MB)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={changes['video_processing.max_file_size_mb'] !== undefined ? changes['video_processing.max_file_size_mb'] : (settings?.video_processing?.max_file_size_mb || 500)}
                                    onChange={(e) => updateSetting('video_processing.max_file_size_mb', parseInt(e.target.value))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-3">Max Duration (minutes)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={changes['video_processing.max_duration_minutes'] !== undefined ? changes['video_processing.max_duration_minutes'] : (settings?.video_processing?.max_duration_minutes || 30)}
                                    onChange={(e) => updateSetting('video_processing.max_duration_minutes', parseInt(e.target.value))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-3">Supported Formats</label>
                                <input
                                    type="text"
                                    value={(changes['video_processing.supported_formats'] !== undefined ? changes['video_processing.supported_formats'] : (settings?.video_processing?.supported_formats || [])).join(', ')}
                                    onChange={(e) => updateSetting('video_processing.supported_formats', e.target.value.split(',').map(f => f.trim()))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition"
                                    placeholder="mp4, avi, mov, mkv"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* UI Settings */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800 rounded-lg p-8 border border-slate-700"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-cyan-400">🎨</span>
                        UI Settings
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold mb-3">Theme</label>
                            <select
                                value={changes['ui_settings.theme'] !== undefined ? changes['ui_settings.theme'] : (settings?.ui_settings?.theme || 'dark')}
                                onChange={(e) => updateSetting('ui_settings.theme', e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition"
                            >
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-3">Language</label>
                            <select
                                value={changes['ui_settings.language'] !== undefined ? changes['ui_settings.language'] : (settings?.ui_settings?.language || 'en')}
                                onChange={(e) => updateSetting('ui_settings.language', e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition"
                            >
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="ta">Tamil</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-3">Chart Type</label>
                            <select
                                value={changes['ui_settings.chart_type'] !== undefined ? changes['ui_settings.chart_type'] : (settings?.ui_settings?.chart_type || 'bar')}
                                onChange={(e) => updateSetting('ui_settings.chart_type', e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition"
                            >
                                <option value="bar">Bar Chart</option>
                                <option value="line">Line Chart</option>
                                <option value="pie">Pie Chart</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                        <div>
                            <p className="font-semibold">Enable Notifications</p>
                            <p className="text-xs text-slate-400">Receive alerts for new violations</p>
                        </div>
                        <button
                            onClick={() => updateSetting('ui_settings.enable_notifications', !(changes['ui_settings.enable_notifications'] !== undefined ? changes['ui_settings.enable_notifications'] : settings?.ui_settings?.enable_notifications))}
                            className="text-2xl transition transform hover:scale-110"
                        >
                            {(changes['ui_settings.enable_notifications'] !== undefined ? changes['ui_settings.enable_notifications'] : settings?.ui_settings?.enable_notifications) ? (
                                <FaToggleOn className="text-green-400" />
                            ) : (
                                <FaToggleOff className="text-slate-500" />
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end sticky bottom-8">
                    <button
                        onClick={() => {
                            setChanges({});
                            setMessage(null);
                        }}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition"
                    >
                        Reset
                    </button>
                    <button
                        onClick={saveSettings}
                        disabled={saving || Object.keys(changes).length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <FaSave />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
