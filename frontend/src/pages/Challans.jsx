import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilePdf, FaCar, FaMotorcycle, FaTruck, FaBus, FaSync, FaRupeeSign, FaCheckCircle, FaTimes, FaEdit, FaDownload } from 'react-icons/fa';
import { API_CONFIG } from '../config/api';

const MOCK_APPROVED = [
    {
        id: 2, video_id: 'cam_03_20240515', violation_type: 'NO HELMET',
        confidence_score: 0.92, speed_kmph: 42, vehicle_plate: 'KA01HJ9988',
        vehicle_type: 'MOTORCYCLE', status: 'APPROVED',
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 5, video_id: 'cam_05_20240515', violation_type: 'NO HELMET',
        confidence_score: 0.91, speed_kmph: 60, vehicle_plate: 'GJ05AB2222',
        vehicle_type: 'MOTORCYCLE', status: 'APPROVED',
        created_at: new Date(Date.now() - 14400000).toISOString(),
    },
];

const FINES = { 'NO HELMET': 1000, 'TRIPLE RIDING': 2000, 'OVERSPEEDING': 5000 };

const VIOLATION_COLORS = {
    'OVERSPEEDING':  { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    'NO HELMET':     { text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
    'TRIPLE RIDING': { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

const VehicleIcon = ({ type }) => {
    const cls = 'text-2xl';
    switch (type) {
        case 'MOTORCYCLE': return <FaMotorcycle className={`${cls} text-yellow-400`} />;
        case 'TRUCK':      return <FaTruck      className={`${cls} text-orange-400`} />;
        case 'BUS':        return <FaBus        className={`${cls} text-blue-400`} />;
        default:           return <FaCar        className={`${cls} text-cyan-400`} />;
    }
};

// Challan Details Modal Component
const ChallanDetailsModal = ({ challan, FINES, isOpen, onClose, onDownload }) => {
    const [editedChallan, setEditedChallan] = useState(challan);
    const [errors, setErrors] = useState({});
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setEditedChallan(challan);
        setErrors({});
    }, [challan, isOpen]);

    const validateForm = () => {
        const newErrors = {};
        if (!editedChallan.vehicle_plate?.trim()) newErrors.vehicle_plate = 'Vehicle number required';
        if (!editedChallan.violation_type) newErrors.violation_type = 'Violation type required';
        if (!editedChallan.vehicle_type) newErrors.vehicle_type = 'Vehicle type required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGeneratePDF = async () => {
        if (!validateForm()) return;
        setIsGenerating(true);
        try {
            await onDownload(editedChallan);
        } finally {
            setIsGenerating(false);
            onClose();
        }
    };

    if (!isOpen) return null;

    const fine = FINES[editedChallan.violation_type] || 500;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between border-b border-white/10">
                        <h2 className="text-xl font-bold text-white">Challan Details & Preview</h2>
                        <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                            <FaTimes />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Vehicle Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <VehicleIcon type={editedChallan.vehicle_type} />
                                Vehicle Information
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Vehicle Number</label>
                                    <input
                                        type="text"
                                        value={editedChallan.vehicle_plate || ''}
                                        onChange={(e) => setEditedChallan({ ...editedChallan, vehicle_plate: e.target.value.toUpperCase() })}
                                        className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
                                            errors.vehicle_plate ? 'border-red-500' : 'border-white/20'
                                        } text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition`}
                                        placeholder="e.g., TN01AB1234"
                                    />
                                    {errors.vehicle_plate && <p className="text-red-400 text-xs mt-1">{errors.vehicle_plate}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Vehicle Type</label>
                                    <select
                                        value={editedChallan.vehicle_type || ''}
                                        onChange={(e) => setEditedChallan({ ...editedChallan, vehicle_type: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
                                            errors.vehicle_type ? 'border-red-500' : 'border-white/20'
                                        } text-white focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition`}
                                    >
                                        <option value="">Select type...</option>
                                        <option value="CAR">Car</option>
                                        <option value="MOTORCYCLE">Motorcycle</option>
                                        <option value="TRUCK">Truck</option>
                                        <option value="BUS">Bus</option>
                                        <option value="AUTORICKSHAW">Auto Rickshaw</option>
                                    </select>
                                    {errors.vehicle_type && <p className="text-red-400 text-xs mt-1">{errors.vehicle_type}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Violation Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white">Violation Details</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Violation Type</label>
                                    <select
                                        value={editedChallan.violation_type || ''}
                                        onChange={(e) => setEditedChallan({ ...editedChallan, violation_type: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
                                            errors.violation_type ? 'border-red-500' : 'border-white/20'
                                        } text-white focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition`}
                                    >
                                        <option value="">Select violation...</option>
                                        <option value="OVERSPEEDING">Over-speeding</option>
                                        <option value="NO HELMET">No Helmet</option>
                                        <option value="TRIPLE RIDING">Triple Riding</option>
                                        <option value="RED SIGNAL">Red Signal Violation</option>
                                        <option value="PARKING VIOLATION">Parking Violation</option>
                                    </select>
                                    {errors.violation_type && <p className="text-red-400 text-xs mt-1">{errors.violation_type}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Speed (km/h)</label>
                                    <input
                                        type="number"
                                        value={editedChallan.speed_kmph || ''}
                                        onChange={(e) => setEditedChallan({ ...editedChallan, speed_kmph: Number(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">AI Confidence</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={(editedChallan.confidence_score || 0.9) * 100}
                                            onChange={(e) => setEditedChallan({ ...editedChallan, confidence_score: Number(e.target.value) / 100 })}
                                            className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-cyan-400 font-bold min-w-fit">{((editedChallan.confidence_score || 0.9) * 100).toFixed(0)}%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Issue Date</label>
                                    <input
                                        type="datetime-local"
                                        value={new Date(editedChallan.created_at || new Date()).toISOString().slice(0, 16)}
                                        onChange={(e) => setEditedChallan({ ...editedChallan, created_at: new Date(e.target.value).toISOString() })}
                                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fine Amount Preview */}
                        <div className="p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl border border-red-500/30">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 font-semibold">Fine Amount:</span>
                                <span className="text-3xl font-black text-red-400">₹{fine.toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Due date: {new Date(new Date(editedChallan.created_at || new Date()).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}</p>
                        </div>

                        {/* Additional Info */}
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <h4 className="text-sm font-bold text-gray-300 mb-2">Additional Information</h4>
                            <div className="space-y-2 text-xs text-gray-400">
                                <p><span className="font-semibold">Challan ID:</span> CH-{editedChallan.id}-{Date.now().toString().slice(-6)}</p>
                                <p><span className="font-semibold">Video ID:</span> {editedChallan.video_id || 'Not specified'}</p>
                                <p><span className="font-semibold">Generated at:</span> {new Date().toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/10 transition font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGeneratePDF}
                                disabled={isGenerating}
                                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 transition font-semibold flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <><FaSync className="animate-spin" /> Generating...</>
                                ) : (
                                    <><FaDownload /> Generate & Download PDF</>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const normalizeViolation = (v) => {
    const violation_type = v.violation_type || v.type || 'OVERSPEEDING';
    const confidence_score = v.confidence_score !== undefined ? v.confidence_score : (v.confidence !== undefined ? v.confidence : 0.90);
    const speed_kmph = v.speed_kmph !== undefined ? v.speed_kmph : (v.speed !== undefined ? v.speed : 0);
    
    let vehicle_type = v.vehicle_type || v.vehicle || 'CAR';
    if (!v.vehicle_type && !v.vehicle) {
        if (violation_type === 'NO HELMET' || violation_type === 'TRIPLE RIDING') {
            vehicle_type = 'MOTORCYCLE';
        }
    }

    return {
        ...v,
        violation_type,
        confidence_score,
        speed_kmph,
        vehicle_type,
        vehicle_plate: v.vehicle_plate || '—',
        status: v.status || 'PENDING',
        created_at: v.created_at || v.timestamp || new Date().toISOString(),
        location: v.location || 'N/A'
    };
};

const Challans = () => {
    const [challans, setChallans]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [isDemo, setIsDemo]       = useState(false);
    const [downloading, setDownloading] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedChallan, setSelectedChallan] = useState(null);
    const [notification, setNotification] = useState(null);

    const fetchChallans = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(API_CONFIG.ENDPOINTS.VIOLATIONS, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            const localViolations = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
            const merged = [...localViolations];
            (Array.isArray(data) ? data : []).forEach(v => {
                if (!merged.find(m => m.id === v.id)) merged.push(v);
            });
            
            const normalized = merged.map(v => normalizeViolation(v));
            setChallans(normalized.filter(v => v.status === 'APPROVED').sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)));
            setIsDemo(false);
        } catch {
            const localViolations = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
            const isCleared = localStorage.getItem('traffic_violations_cleared') === 'true';
            const merged = [...localViolations];
            if (!isCleared) {
                MOCK_APPROVED.forEach(v => {
                    if (!merged.find(m => m.id === v.id)) merged.push(v);
                });
            }
            const normalized = merged.map(v => normalizeViolation(v));
            setChallans(normalized.filter(v => v.status === 'APPROVED').sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)));
            setIsDemo(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChallans();
        const interval = setInterval(() => fetchChallans(true), 10000);
        return () => clearInterval(interval);
    }, [fetchChallans]);

    const downloadPDF = async (challan) => {
        setDownloading(challan.id);
        try {
            if (isDemo) {
                await new Promise(r => setTimeout(r, 600));
                const module = await import('../utils/pdfGenerator');
                await module.generateClientSidePDF(challan, FINES);
                showNotification('PDF generated successfully!', 'success');
            } else {
                const res = await fetch(`${API_CONFIG.ENDPOINTS.VIOLATIONS}/${challan.id}/challan`, { method: 'POST' });
                if (res.ok) {
                    const blob = await res.blob();
                    const url  = window.URL.createObjectURL(blob);
                    const a    = document.createElement('a');
                    a.href     = url;
                    a.download = `Challan_${challan.id}_${challan.vehicle_plate || 'UNKNOWN'}_${Date.now()}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    showNotification('Challan downloaded successfully!', 'success');
                } else {
                    showNotification('Failed to download PDF', 'error');
                }
            }
        } catch (error) {
            console.error('PDF download error:', error);
            showNotification('Error generating PDF', 'error');
        } finally {
            setDownloading(null);
        }
    };

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const totalRevenue = challans.reduce((acc, c) => acc + (FINES[c.violation_type] || 500), 0);

    return (
        <div className="space-y-6 pb-10">
            {/* Notification */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 left-4 right-4 z-40 px-4 py-3 rounded-lg flex items-center gap-3 ${
                            notification.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-300' :
                            notification.type === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-300' :
                            'bg-blue-500/20 border border-blue-500/30 text-blue-300'
                        }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${
                            notification.type === 'success' ? 'bg-green-400' :
                            notification.type === 'error' ? 'bg-red-400' :
                            'bg-blue-400'
                        }`} />
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Digital E-Challans</h1>
                    <p className="text-gray-500 text-sm mt-1">Approved penalty records ready for download</p>
                </div>
                <div className="flex items-center gap-3">
                    {isDemo && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            DEMO MODE
                        </span>
                    )}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-sm">
                        <FaRupeeSign className="text-xs" />
                        Total: ₹{totalRevenue.toLocaleString('en-IN')}
                    </div>
                    <button
                        onClick={() => fetchChallans()}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-panel p-6 animate-pulse space-y-4">
                            <div className="h-10 w-10 bg-white/5 rounded-lg" />
                            <div className="h-6 w-3/4 bg-white/5 rounded" />
                            <div className="h-4 w-1/2 bg-white/5 rounded" />
                            <div className="h-10 bg-white/5 rounded-lg" />
                        </div>
                    ))}
                </div>
            ) : challans.length === 0 ? (
                <div className="glass-panel flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-600 text-3xl">
                        <FaFilePdf />
                    </div>
                    <p className="text-gray-400 font-semibold text-lg">No challans generated yet</p>
                    <p className="text-gray-600 text-sm mt-2">Approve violations in the Admin Panel first.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence>
                        {challans.map((c, idx) => {
                            const colors = VIOLATION_COLORS[c.violation_type] || { text: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' };
                            const fine   = FINES[c.violation_type] || 500;
                            return (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, scale: 0.93, y: 12 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.93 }}
                                    transition={{ delay: idx * 0.07 }}
                                    className="glass-panel p-6 relative overflow-hidden group hover:border-white/20 transition-all"
                                >
                                    {/* Background glow */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

                                    {/* Challan watermark */}
                                    <div className="absolute bottom-2 right-3 text-[80px] font-black text-white/[0.02] select-none leading-none">
                                        E-CHL
                                    </div>

                                    {/* Top row */}
                                    <div className="flex justify-between items-start mb-5 relative">
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                            <VehicleIcon type={c.vehicle_type} />
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                            UNPAID
                                        </span>
                                    </div>

                                    {/* Plate */}
                                    <div className="relative mb-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Vehicle Number</p>
                                        <h3 className="text-2xl font-black text-white tracking-[0.15em] font-mono">
                                            {c.vehicle_plate || 'UNKNOWN'}
                                        </h3>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-2 mb-5 relative">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Violation</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                {c.violation_type}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Date</span>
                                            <span className="text-xs font-mono text-gray-300">{new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Confidence</span>
                                            <span className="text-xs font-mono text-green-400">{(c.confidence_score * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Fine Amount</span>
                                            <span className="text-xl font-black text-white">₹{fine.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="space-y-2 relative">
                                        <button
                                            onClick={() => {
                                                setSelectedChallan(c);
                                                setModalOpen(true);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 hover:text-blue-200 transition-all text-sm font-bold"
                                        >
                                            <FaEdit /> Edit & Preview
                                        </button>
                                        <button
                                            onClick={() => downloadPDF(c)}
                                            disabled={downloading === c.id}
                                            className="relative w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:text-cyan-200 transition-all text-sm font-bold disabled:opacity-60"
                                        >
                                            {downloading === c.id ? (
                                                <><FaSync className="animate-spin" /> Generating PDF…</>
                                            ) : (
                                                <><FaFilePdf /> Download PDF</>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Summary footer */}
            {!loading && challans.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-panel p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-3 text-green-400">
                        <FaCheckCircle />
                        <span className="text-sm font-semibold">
                            {challans.length} challan{challans.length !== 1 ? 's' : ''} issued
                        </span>
                    </div>
                    <div className="text-sm text-gray-500">
                        Total recoverable revenue:{' '}
                        <span className="text-cyan-400 font-bold">₹{totalRevenue.toLocaleString('en-IN')}</span>
                    </div>
                    {isDemo && (
                        <p className="text-xs text-amber-500/70 italic">⚠ Demo data — connect backend for live challans</p>
                    )}
                </motion.div>
            )}

            {/* Modal */}
            {selectedChallan && (
                <ChallanDetailsModal
                    challan={selectedChallan}
                    FINES={FINES}
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onDownload={downloadPDF}
                />
            )}
        </div>
    );
};

export default Challans;
