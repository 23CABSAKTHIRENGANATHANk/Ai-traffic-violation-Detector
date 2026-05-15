import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaFilePdf, FaCar, FaMotorcycle, FaTruck, FaBus, FaSync, FaExclamationTriangle, FaShieldAlt, FaFilter, FaSearch, FaTimes, FaDownload, FaFileExcel, FaBarChart } from 'react-icons/fa';
import { API_CONFIG } from '../config/api';

// ── Mock data used when the backend is unreachable ───────────────────────────
const MOCK_VIOLATIONS = [
    {
        id: 1, video_id: 'cam_01_20240515', violation_type: 'OVERSPEEDING',
        timestamp: new Date(Date.now() - 600000).toISOString(), confidence_score: 0.97,
        speed_kmph: 88, vehicle_plate: 'TN38AB1234',
        evidence_image_path: null, vehicle_type: 'CAR', status: 'PENDING',
        created_at: new Date(Date.now() - 600000).toISOString(),
    },
    {
        id: 2, video_id: 'cam_03_20240515', violation_type: 'NO HELMET',
        timestamp: new Date(Date.now() - 3600000).toISOString(), confidence_score: 0.92,
        speed_kmph: 42, vehicle_plate: 'KA01HJ9988',
        evidence_image_path: null, vehicle_type: 'MOTORCYCLE', status: 'APPROVED',
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 3, video_id: 'cam_02_20240515', violation_type: 'TRIPLE RIDING',
        timestamp: new Date(Date.now() - 7200000).toISOString(), confidence_score: 0.85,
        speed_kmph: 35, vehicle_plate: 'MH12CD5678',
        evidence_image_path: null, vehicle_type: 'MOTORCYCLE', status: 'PENDING',
        created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
        id: 4, video_id: 'cam_01_20240515', violation_type: 'OVERSPEEDING',
        timestamp: new Date(Date.now() - 10800000).toISOString(), confidence_score: 0.99,
        speed_kmph: 105, vehicle_plate: 'DL4CAF7734',
        evidence_image_path: null, vehicle_type: 'TRUCK', status: 'PENDING',
        created_at: new Date(Date.now() - 10800000).toISOString(),
    },
    {
        id: 5, video_id: 'cam_05_20240515', violation_type: 'NO HELMET',
        timestamp: new Date(Date.now() - 14400000).toISOString(), confidence_score: 0.91,
        speed_kmph: 60, vehicle_plate: 'GJ05AB2222',
        evidence_image_path: null, vehicle_type: 'MOTORCYCLE', status: 'APPROVED',
        created_at: new Date(Date.now() - 14400000).toISOString(),
    },
];

const VIOLATION_COLORS = {
    'OVERSPEEDING':  { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    'NO HELMET':     { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30' },
    'TRIPLE RIDING': { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
};

const FINES = { 'NO HELMET': 1000, 'TRIPLE RIDING': 2000, 'OVERSPEEDING': 5000 };

const getVehicleIcon = (type) => {
    const cls = 'text-xl';
    switch (type) {
        case 'MOTORCYCLE': return <FaMotorcycle className={`${cls} text-yellow-400`} />;
        case 'TRUCK':      return <FaTruck      className={`${cls} text-orange-400`} />;
        case 'BUS':        return <FaBus        className={`${cls} text-blue-400`} />;
        default:           return <FaCar        className={`${cls} text-cyan-400`} />;
    }
};

const StatusBadge = ({ status }) =>
    status === 'PENDING' ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            PENDING
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/30">
            <FaCheck className="text-[10px]" />
            APPROVED
        </span>
    );

// Export utilities
const exportToCSV = (data, filename = 'violations.csv') => {
    const headers = ['ID', 'Vehicle Plate', 'Vehicle Type', 'Violation Type', 'Speed (km/h)', 'Confidence', 'Status', 'Date'];
    const rows = data.map(v => [
        v.id,
        v.vehicle_plate || 'N/A',
        v.vehicle_type || 'N/A',
        v.violation_type,
        v.speed_kmph || 'N/A',
        `${(v.confidence_score * 100).toFixed(1)}%`,
        v.status,
        new Date(v.created_at).toLocaleString('en-IN')
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const exportToJSON = (data, filename = 'violations.json') => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// ── Main Component ────────────────────────────────────────────────────────────
const Admin = () => {
    const [violations, setViolations]   = useState([]);
    const [loading, setLoading]         = useState(true);
    const [isDemo, setIsDemo]           = useState(false);
    const [filterType, setFilterType]   = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [notification, setNotification]   = useState(null);
    const [lastRefresh, setLastRefresh]     = useState(null);
    const [selectedViolations, setSelectedViolations] = useState(new Set());
    const [exporting, setExporting] = useState(false);

    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchViolations = useCallback(async (silent = false) => {
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
            
            setViolations(merged.sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)));
            setIsDemo(false);
            setLastRefresh(new Date());
        } catch (err) {
            console.warn('API unreachable, using demo data:', err.message);
            const localViolations = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
            const merged = [...localViolations];
            MOCK_VIOLATIONS.forEach(mock => {
                if (!merged.find(m => m.id === mock.id)) {
                    merged.push(mock);
                }
            });
            setViolations(merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setIsDemo(true);
            setLastRefresh(new Date());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchViolations();
        const interval = setInterval(() => fetchViolations(true), 10000);
        return () => clearInterval(interval);
    }, [fetchViolations]);

    const generateChallan = async (violation) => {
        setActionLoading(violation.id);
        try {
            const updatedViolations = violations.map(v => v.id === violation.id ? { ...v, status: 'APPROVED' } : v);
            setViolations(updatedViolations);
            
            const localViolations = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
            const updatedLocal = localViolations.map(v => v.id === violation.id ? { ...v, status: 'APPROVED' } : v);
            localStorage.setItem('traffic_violations', JSON.stringify(updatedLocal));

            if (!isDemo) {
                try {
                    const res = await fetch(`${API_CONFIG.ENDPOINTS.VIOLATIONS}/${violation.id}/challan`, { method: 'POST' });
                    if (res.ok) {
                        const blob = await res.blob();
                        const url  = window.URL.createObjectURL(blob);
                        const a    = document.createElement('a');
                        a.href     = url;
                        a.download = `Challan_${violation.id}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        showNotification(`Challan PDF generated for ${violation.vehicle_plate}!`, 'success');
                        setActionLoading(null);
                        return;
                    }
                } catch (e) {
                    console.warn("Backend PDF generation failed, falling back to client-side", e);
                }
            }
            
            const module = await import('../utils/pdfGenerator');
            await module.generateClientSidePDF(violation, FINES);
            showNotification(`Challan PDF generated for ${violation.vehicle_plate || 'vehicle'}!`, 'success');
        } catch (err) {
            console.error("Error generating challan", err);
            showNotification("Failed to generate PDF.", 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const generateBulkChallans = async () => {
        const selected = Array.from(selectedViolations).map(id => violations.find(v => v.id == id)).filter(Boolean);
        if (selected.length === 0) {
            showNotification('Please select violations first.', 'error');
            return;
        }

        setActionLoading('bulk');
        try {
            for (const v of selected) {
                await generateChallan(v);
                await new Promise(r => setTimeout(r, 500)); // Delay between PDFs
            }
            setSelectedViolations(new Set());
            showNotification(`Generated ${selected.length} challan(s)!`, 'success');
        } catch (err) {
            showNotification('Error generating bulk challans.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleExport = async (format) => {
        setExporting(true);
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            if (format === 'csv') {
                exportToCSV(filtered, `violations_${timestamp}.csv`);
                showNotification('Exported to CSV', 'success');
            } else if (format === 'json') {
                exportToJSON(filtered, `violations_${timestamp}.json`);
                showNotification('Exported to JSON', 'success');
            }
        } finally {
            setExporting(false);
        }
    };

    // Filtering & searching
    const filtered = violations.filter(v => {
        const matchesType   = filterType === 'ALL' || v.violation_type === filterType;
        const matchesStatus = filterStatus === 'ALL' || v.status === filterStatus;
        const q             = searchQuery.toLowerCase();
        const matchesSearch = !q
            || (v.vehicle_plate || '').toLowerCase().includes(q)
            || (v.violation_type || '').toLowerCase().includes(q);
        return matchesType && matchesStatus && matchesSearch;
    });

    const pending  = violations.filter(v => v.status === 'PENDING').length;
    const approved = violations.filter(v => v.status === 'APPROVED').length;
    const totalFine = violations.reduce((a, v) => a + (FINES[v.violation_type] || 500), 0);
    const selectedCount = selectedViolations.size;

    const toggleSelectViolation = (id) => {
        const newSelected = new Set(selectedViolations);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedViolations(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedCount === filtered.length) {
            setSelectedViolations(new Set());
        } else {
            setSelectedViolations(new Set(filtered.map(v => v.id)));
        }
    };

    return (
        <div className="space-y-6 pb-10">

            {/* ── Notification Toast ── */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold backdrop-blur-md
                            ${notification.type === 'success'
                                ? 'bg-green-900/80 border-green-500/40 text-green-300'
                                : notification.type === 'error'
                                ? 'bg-red-900/80 border-red-500/40 text-red-300'
                                : 'bg-blue-900/80 border-blue-500/40 text-blue-300'
                            }`}
                    >
                        {notification.type === 'success' ? <FaCheck /> : notification.type === 'error' ? <FaExclamationTriangle /> : <FaDownload />}
                        {notification.msg}
                        <button onClick={() => setNotification(null)} className="ml-2 opacity-60 hover:opacity-100"><FaTimes /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center">
                        <FaShieldAlt className="text-cyan-400 text-lg" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Verification Panel</h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {lastRefresh
                                ? `Last updated ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                                : 'Loading…'
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {isDemo && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            DEMO MODE
                        </span>
                    )}
                    {selectedCount > 0 && (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {selectedCount} selected
                        </span>
                    )}
                    <button
                        onClick={() => fetchViolations()}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium disabled:opacity-50"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total Violations', value: violations.length, color: 'text-white', icon: FaShieldAlt },
                    { label: 'Pending Review',   value: pending,           color: 'text-yellow-400', icon: FaBarChart },
                    { label: 'Approved',         value: approved,          color: 'text-green-400', icon: FaCheck },
                    { label: 'Potential Revenue', value: `₹${(totalFine / 100000).toFixed(1)}L`, color: 'text-cyan-400', icon: FaDownload },
                    { label: 'Success Rate', value: `${violations.length > 0 ? Math.round((approved / violations.length) * 100) : 0}%`, color: 'text-purple-400', icon: FaBarChart },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-panel p-4"
                    >
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Filters & Actions ── */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    {/* Search */}
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                        <input
                            type="text"
                            placeholder="Search plate or violation…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                    </div>

                    {/* Type filter */}
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                    >
                        <option value="ALL">All Violations</option>
                        <option value="OVERSPEEDING">Over-speeding</option>
                        <option value="NO HELMET">No Helmet</option>
                        <option value="TRIPLE RIDING">Triple Riding</option>
                    </select>

                    {/* Status filter */}
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                    >
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                    </select>
                </div>

                {/* Bulk Actions */}
                {selectedCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3"
                    >
                        <p className="text-sm text-gray-300">{selectedCount} violation{selectedCount !== 1 ? 's' : ''} selected</p>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={generateBulkChallans}
                                disabled={actionLoading === 'bulk'}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all text-sm font-bold disabled:opacity-50"
                            >
                                {actionLoading === 'bulk' ? <><FaSync className="animate-spin" /> Processing…</> : <><FaFilePdf /> Generate Bulk Challans</>}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Export Options */}
                {violations.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => handleExport('csv')}
                            disabled={exporting}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-300 border border-green-500/30 hover:bg-green-500/20 transition-all text-sm font-bold disabled:opacity-50"
                        >
                            <FaFileExcel /> Export CSV
                        </button>
                        <button
                            onClick={() => handleExport('json')}
                            disabled={exporting}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 transition-all text-sm font-bold disabled:opacity-50"
                        >
                            <FaDownload /> Export JSON
                        </button>
                    </div>
                )}
            </div>

            {/* ── Table ── */}
            <div className="glass-panel overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="h-8 w-6 bg-white/5 rounded" />
                                <div className="h-8 w-16 bg-white/5 rounded" />
                                <div className="h-8 flex-1 bg-white/5 rounded" />
                                <div className="h-8 w-24 bg-white/5 rounded" />
                                <div className="h-8 w-28 bg-white/5 rounded" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-600">
                        <FaShieldAlt className="text-5xl mb-4 opacity-30" />
                        <p className="text-lg font-semibold">No violations found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or refresh the data.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-4 py-3.5 w-6">
                                        <input
                                            type="checkbox"
                                            checked={selectedCount === filtered.length && filtered.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 accent-cyan-500 cursor-pointer"
                                        />
                                    </th>
                                    {['ID', 'Vehicle', 'Plate Number', 'Violation', 'Speed', 'Confidence', 'Status', 'Action'].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filtered.map((v, idx) => {
                                        const colors = VIOLATION_COLORS[v.violation_type] || { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' };
                                        const isSelected = selectedViolations.has(v.id);
                                        return (
                                            <motion.tr
                                                key={v.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                className={`border-b border-white/[0.04] hover:bg-white/[0.03] group transition-colors ${isSelected ? 'bg-cyan-500/5' : ''}`}
                                            >
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectViolation(v.id)}
                                                        className="w-4 h-4 accent-cyan-500 cursor-pointer"
                                                    />
                                                </td>

                                                {/* ID */}
                                                <td className="px-5 py-4 font-mono text-xs text-gray-600">#{v.id}</td>

                                                {/* Vehicle type */}
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        {getVehicleIcon(v.vehicle_type)}
                                                        <span className="text-[10px] text-gray-600 uppercase tracking-wide">{v.vehicle_type || 'UNKNOWN'}</span>
                                                    </div>
                                                </td>

                                                {/* Plate */}
                                                <td className="px-5 py-4">
                                                    <span className="font-bold text-white text-sm tracking-widest font-mono bg-white/5 px-2 py-1 rounded border border-white/10">
                                                        {v.vehicle_plate || '—'}
                                                    </span>
                                                </td>

                                                {/* Violation badge */}
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                                                        {v.violation_type}
                                                    </span>
                                                    <div className="text-[10px] text-gray-600 mt-0.5">
                                                        Fine: ₹{(FINES[v.violation_type] || 500).toLocaleString('en-IN')}
                                                    </div>
                                                </td>

                                                {/* Speed */}
                                                <td className="px-5 py-4 font-mono text-sm">
                                                    {v.speed_kmph ? (
                                                        <span className={v.speed_kmph > 80 ? 'text-red-400 font-bold' : 'text-gray-300'}>
                                                            {v.speed_kmph} <span className="text-xs text-gray-600">km/h</span>
                                                        </span>
                                                    ) : <span className="text-gray-700">—</span>}
                                                </td>

                                                {/* Confidence */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-cyan-500 to-green-400 rounded-full"
                                                                style={{ width: `${(v.confidence_score * 100).toFixed(0)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-mono text-green-400">{(v.confidence_score * 100).toFixed(0)}%</span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4"><StatusBadge status={v.status} /></td>

                                                {/* Action */}
                                                <td className="px-5 py-4">
                                                    {v.status === 'PENDING' ? (
                                                        <button
                                                            onClick={() => generateChallan(v)}
                                                            disabled={actionLoading === v.id}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:text-cyan-200 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
                                                        >
                                                            {actionLoading === v.id ? (
                                                                <><FaSync className="animate-spin" /> Processing…</>
                                                            ) : (
                                                                <><FaFilePdf /> Generate</>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button disabled className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-600 border border-white/10 text-xs font-bold cursor-not-allowed whitespace-nowrap">
                                                            <FaCheck /> Done
                                                        </button>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer row */}
                {!loading && filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-xs text-gray-600">
                            Showing <span className="text-gray-400 font-semibold">{filtered.length}</span> of{' '}
                            <span className="text-gray-400 font-semibold">{violations.length}</span> violations
                        </p>
                        {isDemo && (
                            <p className="text-xs text-amber-500/70 italic">
                                ⚠ Live data unavailable — displaying demo records
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
            </div>

            {/* ── Table ── */}
            <div className="glass-panel overflow-hidden">
                {loading ? (
                    /* Skeleton loader */
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="h-8 w-16 bg-white/5 rounded" />
                                <div className="h-8 flex-1 bg-white/5 rounded" />
                                <div className="h-8 w-24 bg-white/5 rounded" />
                                <div className="h-8 w-28 bg-white/5 rounded" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-600">
                        <FaShieldAlt className="text-5xl mb-4 opacity-30" />
                        <p className="text-lg font-semibold">No violations found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or refresh the data.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['ID', 'Vehicle', 'Plate Number', 'Violation', 'Speed', 'Confidence', 'Status', 'Action'].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filtered.map((v, idx) => {
                                        const colors = VIOLATION_COLORS[v.violation_type] || { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' };
                                        return (
                                            <motion.tr
                                                key={v.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                className="border-b border-white/[0.04] hover:bg-white/[0.03] group transition-colors"
                                            >
                                                {/* ID */}
                                                <td className="px-5 py-4 font-mono text-xs text-gray-600">#{v.id}</td>

                                                {/* Vehicle type */}
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        {getVehicleIcon(v.vehicle_type)}
                                                        <span className="text-[10px] text-gray-600 uppercase tracking-wide">{v.vehicle_type || 'UNKNOWN'}</span>
                                                    </div>
                                                </td>

                                                {/* Plate */}
                                                <td className="px-5 py-4">
                                                    <span className="font-bold text-white text-sm tracking-widest font-mono bg-white/5 px-2 py-1 rounded border border-white/10">
                                                        {v.vehicle_plate || '—'}
                                                    </span>
                                                </td>

                                                {/* Violation badge */}
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                                                        {v.violation_type}
                                                    </span>
                                                    <div className="text-[10px] text-gray-600 mt-0.5">
                                                        Fine: ₹{(FINES[v.violation_type] || 500).toLocaleString()}
                                                    </div>
                                                </td>

                                                {/* Speed */}
                                                <td className="px-5 py-4 font-mono text-sm">
                                                    {v.speed_kmph ? (
                                                        <span className={v.speed_kmph > 80 ? 'text-red-400 font-bold' : 'text-gray-300'}>
                                                            {v.speed_kmph} <span className="text-xs text-gray-600">km/h</span>
                                                        </span>
                                                    ) : <span className="text-gray-700">—</span>}
                                                </td>

                                                {/* Confidence */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-cyan-500 to-green-400 rounded-full"
                                                                style={{ width: `${(v.confidence_score * 100).toFixed(0)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-mono text-green-400">{(v.confidence_score * 100).toFixed(0)}%</span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4"><StatusBadge status={v.status} /></td>

                                                {/* Action */}
                                                <td className="px-5 py-4">
                                                    {v.status === 'PENDING' ? (
                                                        <button
                                                            onClick={() => generateChallan(v)}
                                                            disabled={actionLoading === v.id}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:text-cyan-200 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
                                                        >
                                                            {actionLoading === v.id ? (
                                                                <><FaSync className="animate-spin" /> Processing…</>
                                                            ) : (
                                                                <><FaFilePdf /> Generate Challan</>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button disabled className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-600 border border-white/10 text-xs font-bold cursor-not-allowed whitespace-nowrap">
                                                            <FaCheck /> Challan Sent
                                                        </button>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer row */}
                {!loading && filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                            Showing <span className="text-gray-400 font-semibold">{filtered.length}</span> of{' '}
                            <span className="text-gray-400 font-semibold">{violations.length}</span> violations
                        </p>
                        {isDemo && (
                            <p className="text-xs text-amber-500/70 italic">
                                ⚠ Live data unavailable — displaying demo records
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
