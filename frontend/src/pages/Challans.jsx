import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilePdf, FaCar, FaMotorcycle, FaTruck, FaBus, FaSync, FaRupeeSign, FaCheckCircle } from 'react-icons/fa';
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

const Challans = () => {
    const [challans, setChallans]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [isDemo, setIsDemo]       = useState(false);
    const [downloading, setDownloading] = useState(null);

    const fetchChallans = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(API_CONFIG.ENDPOINTS.VIOLATIONS, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            // Merge backend data with localStorage
            const localViolations = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
            const merged = [...localViolations];
            (Array.isArray(data) ? data : []).forEach(v => {
                if (!merged.find(m => m.id === v.id)) merged.push(v);
            });
            
            setChallans(merged.filter(v => v.status === 'APPROVED').sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)));
            setIsDemo(false);
        } catch {
            const localViolations = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
            const merged = [...localViolations];
            MOCK_APPROVED.forEach(v => {
                if (!merged.find(m => m.id === v.id)) merged.push(v);
            });
            setChallans(merged.filter(v => v.status === 'APPROVED').sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)));
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
        if (isDemo) {
            // Client-side PDF generation for Demo Mode
            setDownloading(challan.id);
            await new Promise(r => setTimeout(r, 600)); // Simulate slight delay
            
            import('../utils/pdfGenerator').then(module => {
                module.generateClientSidePDF(challan, FINES);
                setDownloading(null);
            }).catch(err => {
                console.error("Error loading PDF generator", err);
                setDownloading(null);
                alert("Failed to generate PDF in Demo Mode.");
            });
            return;
        }
        setDownloading(challan.id);
        try {
            const res = await fetch(`${API_CONFIG.ENDPOINTS.VIOLATIONS}/${challan.id}/challan`, { method: 'POST' });
            if (res.ok) {
                const blob = await res.blob();
                const url  = window.URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href     = url;
                a.download = `Challan_${challan.id}_${challan.vehicle_plate || 'UNKNOWN'}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert('Failed to download PDF. Ensure backend is running.');
            }
        } catch {
            alert('Error downloading challan.');
        } finally {
            setDownloading(null);
        }
    };

    const totalRevenue = challans.reduce((acc, c) => acc + (FINES[c.violation_type] || 500), 0);

    return (
        <div className="space-y-6 pb-10">
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
                        Total: ₹{totalRevenue.toLocaleString()}
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
                                            <span className="text-xl font-black text-white">₹{fine.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <button
                                        onClick={() => downloadPDF(c)}
                                        disabled={downloading === c.id}
                                        className="relative w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:text-cyan-200 transition-all text-sm font-bold disabled:opacity-60"
                                    >
                                        {downloading === c.id ? (
                                            <><FaSync className="animate-spin" /> Generating PDF…</>
                                        ) : (
                                            <><FaFilePdf /> Download PDF Challan</>
                                        )}
                                    </button>
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
                        <span className="text-cyan-400 font-bold">₹{totalRevenue.toLocaleString()}</span>
                    </div>
                    {isDemo && (
                        <p className="text-xs text-amber-500/70 italic">⚠ Demo data — connect backend for live challans</p>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default Challans;
