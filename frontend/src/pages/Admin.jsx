import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaEdit, FaTrash, FaCheck, FaTimes, FaFilter, FaSearch, FaSpinner,
    FaChevronLeft, FaChevronRight, FaFilePdf, FaShieldAlt, FaUserCheck,
    FaDownload, FaFileExcel, FaChartBar, FaCar, FaMotorcycle, FaBus, FaTruck,
    FaSync, FaExclamationTriangle, FaCloudDownloadAlt, FaEye, FaMapMarkerAlt,
    FaCalendarAlt, FaClock, FaBarcode, FaChartPie, FaCheckCircle, FaTimesCircle, FaInfo
} from 'react-icons/fa';
import { API_CONFIG } from '../config/api';

// ────────────────────────────────────────────────────────────────────────────
// MOCK DATA FOR FALLBACK
// ────────────────────────────────────────────────────────────────────────────
const MOCK_VIOLATIONS = [
    {
        id: 1, video_id: 'cam_01_20240515', violation_type: 'OVERSPEEDING',
        timestamp: new Date(Date.now() - 600000).toISOString(), confidence_score: 0.97,
        speed_kmph: 88, vehicle_plate: 'TN38AB1234', vehicle_type: 'CAR',
        evidence_image_path: null, status: 'PENDING',
        created_at: new Date(Date.now() - 600000).toISOString(),
        location: 'Main Road - Sector A'
    },
    {
        id: 2, video_id: 'cam_03_20240515', violation_type: 'NO HELMET',
        timestamp: new Date(Date.now() - 3600000).toISOString(), confidence_score: 0.92,
        speed_kmph: 42, vehicle_plate: 'KA01HJ9988', vehicle_type: 'MOTORCYCLE',
        evidence_image_path: null, status: 'APPROVED',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        location: 'Junction - Sector B'
    },
    {
        id: 3, video_id: 'cam_02_20240515', violation_type: 'TRIPLE RIDING',
        timestamp: new Date(Date.now() - 7200000).toISOString(), confidence_score: 0.85,
        speed_kmph: 35, vehicle_plate: 'MH12CD5678', vehicle_type: 'MOTORCYCLE',
        evidence_image_path: null, status: 'PENDING',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        location: 'Highway - Sector C'
    },
];

const VIOLATION_COLORS = {
    'OVERSPEEDING':  { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', badge: 'bg-orange-500' },
    'NO HELMET':     { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30', badge: 'bg-red-500' },
    'TRIPLE RIDING': { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', badge: 'bg-purple-500' },
};

// Fine amounts based on Indian Motor Vehicles Act, 1988
const FINES = {
    'NO HELMET': 1000,
    'TRIPLE RIDING': 2000,
    'OVERSPEEDING': 5000,
    'RED LIGHT VIOLATION': 1500,
    'WRONG SIDE DRIVING': 3000,
    'NO LICENSE': 5000,
    'UNINSURED VEHICLE': 2000,
};

const getVehicleIcon = (type) => {
    const cls = 'text-xl';
    switch (type) {
        case 'MOTORCYCLE': return <FaMotorcycle className={`${cls} text-yellow-400`} />;
        case 'TRUCK':      return <FaTruck      className={`${cls} text-orange-400`} />;
        case 'BUS':        return <FaBus        className={`${cls} text-blue-400`} />;
        default:           return <FaCar        className={`${cls} text-cyan-400`} />;
    }
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

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ────────────────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    if (status === 'PENDING') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                PENDING
            </span>
        );
    } else if (status === 'APPROVED') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/40">
                <FaCheck className="text-[10px]" />
                APPROVED
            </span>
        );
    } else {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                <FaTimes className="text-[10px]" />
                REJECTED
            </span>
        );
    }
};

const ViolationTypeIcon = ({ type }) => {
    const colors = VIOLATION_COLORS[type] || { badge: 'bg-gray-500' };
    return (
        <div className={`w-3 h-3 rounded-full ${colors.badge}`} title={type} />
    );
};

// ────────────────────────────────────────────────────────────────────────────
// MAIN ADMIN COMPONENT
// ────────────────────────────────────────────────────────────────────────────

const Admin = () => {
    // State Management
    const [violations, setViolations]        = useState([]);
    const [loading, setLoading]              = useState(true);
    const [isDemo, setIsDemo]                = useState(false);
    const [filterType, setFilterType]        = useState('ALL');
    const [filterStatus, setFilterStatus]    = useState('ALL');
    const [filterVehicle, setFilterVehicle]  = useState('ALL');
    const [searchQuery, setSearchQuery]      = useState('');
    const [actionLoading, setActionLoading]  = useState(null);
    const [notification, setNotification]    = useState(null);
    const [lastRefresh, setLastRefresh]      = useState(null);
    const [selectedViolations, setSelectedViolations] = useState(new Set());
    const [exporting, setExporting]          = useState(false);
    const [sortBy, setSortBy]                = useState('created_at');
    const [sortOrder, setSortOrder]          = useState('DESC');
    const [currentPage, setCurrentPage]      = useState(1);
    const itemsPerPage = 10;

    const updateViolationsState = (newViolations) => {
        setViolations(newViolations);
        const localOnly = newViolations.filter(v => v.id !== 1 && v.id !== 2 && v.id !== 3);
        localStorage.setItem('traffic_violations', JSON.stringify(localOnly));
    };

    // Utilities
    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    // ────────────────────────────────────────────────────────────────────────
    // FETCH VIOLATIONS
    // ────────────────────────────────────────────────────────────────────────
    const fetchViolations = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStatus && filterStatus !== 'ALL') params.append('status', filterStatus);
            if (filterType && filterType !== 'ALL') params.append('violation_type', filterType);
            if (filterVehicle && filterVehicle !== 'ALL') params.append('vehicle_type', filterVehicle);
            if (searchQuery) params.append('search', searchQuery);
            params.append('limit', '100');
            params.append('sort_by', sortBy);
            params.append('order', sortOrder);

            const url = `${API_CONFIG.ENDPOINTS.VIOLATIONS}?${params.toString()}`;
            
            const res = await fetch(url, {
                signal: AbortSignal.timeout(8000),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const response = await res.json();
            
            const apiData = Array.isArray(response) ? response : (response.data || response);
            const localViolations = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
            
            const merged = [...(Array.isArray(apiData) ? apiData : [])];
            localViolations.forEach(v => {
                if (!merged.find(m => m.id === v.id)) merged.push(v);
            });

            const isCleared = localStorage.getItem('traffic_violations_cleared') === 'true';
            if (merged.length === 0 && !isCleared) {
                MOCK_VIOLATIONS.forEach(mock => {
                    if (!merged.find(m => m.id === mock.id)) merged.push(mock);
                });
            }

            const normalized = merged.map(v => normalizeViolation(v));

            // Automatic local storage self-healing/migration logic
            const localOnly = normalized.filter(v => v.id !== 1 && v.id !== 2 && v.id !== 3);
            localStorage.setItem('traffic_violations', JSON.stringify(localOnly));

            const sorted = normalized.sort((a, b) => {
                const aVal = a[sortBy] || 0;
                const bVal = b[sortBy] || 0;
                if (sortOrder === 'DESC') return bVal > aVal ? 1 : -1;
                return aVal > bVal ? 1 : -1;
            });

            setViolations(sorted);
            setIsDemo(merged.length === 0);
            setLastRefresh(new Date());
            setCurrentPage(1);
        } catch (err) {
            console.warn('API unreachable, using fallback:', err.message);
            const localViolations = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
            const isCleared = localStorage.getItem('traffic_violations_cleared') === 'true';
            const merged = isCleared ? localViolations : [...localViolations, ...MOCK_VIOLATIONS];
            const normalized = merged.map(v => normalizeViolation(v));
            
            // Automatic local storage self-healing/migration logic
            const localOnly = normalized.filter(v => v.id !== 1 && v.id !== 2 && v.id !== 3);
            localStorage.setItem('traffic_violations', JSON.stringify(localOnly));
            
            setViolations(normalized);
            setIsDemo(true);
            setLastRefresh(new Date());
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterType, filterVehicle, searchQuery, sortBy, sortOrder]);

    useEffect(() => {
        fetchViolations();
        const interval = setInterval(() => fetchViolations(true), 15000);
        return () => clearInterval(interval);
    }, [fetchViolations]);

    // ────────────────────────────────────────────────────────────────────────
    // GENERATE CHALLAN
    // ────────────────────────────────────────────────────────────────────────
    const generateChallan = async (violation) => {
        setActionLoading(violation.id);
        try {
            // Try backend first
            if (!isDemo) {
                try {
                    const res = await fetch(`${API_CONFIG.ENDPOINTS.VIOLATIONS}/${violation.id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (res.ok) {
                        const contentType = res.headers.get('content-type');
                        if (contentType && contentType.includes('application/pdf')) {
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `Challan_${violation.vehicle_plate}_${violation.id}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            window.URL.revokeObjectURL(url);

                            // Update local state
                            const updated = violations.map(x => x.id === violation.id ? { ...x, status: 'APPROVED' } : x);
                            updateViolationsState(updated);
                            showNotification(`✓ Challan generated for ${violation.vehicle_plate}`, 'success');
                            setActionLoading(null);
                            return;
                        }
                    }
                } catch (e) {
                    console.warn('Backend PDF unavailable, using client-side:', e.message);
                }
            }

            // Client-side PDF generation
            try {
                const module = await import('../utils/pdfGenerator');
                await module.generateClientSidePDF(violation, FINES);

                // Update status via API
                if (!isDemo) {
                    try {
                        await fetch(`${API_CONFIG.ENDPOINTS.VIOLATIONS}/${violation.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'APPROVED', reviewed_by: 'admin' })
                        });
                    } catch (e) {
                        console.warn('Could not update status:', e);
                    }
                }

                // Update local state
                const updated = violations.map(x => x.id === violation.id ? { ...x, status: 'APPROVED' } : x);
                updateViolationsState(updated);
                showNotification(`✓ Challan PDF generated for ${violation.vehicle_plate}`, 'success');
            } catch (err) {
                console.error('PDF generation failed:', err);
                showNotification('✗ Failed to generate challan', 'error');
            }
        } finally {
            setActionLoading(null);
        }
    };

    // ────────────────────────────────────────────────────────────────────────
    // BULK OPERATIONS
    // ────────────────────────────────────────────────────────────────────────
    const generateBulkChallans = async () => {
        const selected = Array.from(selectedViolations)
            .map(id => violations.find(v => v.id == id))
            .filter(Boolean);

        if (selected.length === 0) {
            showNotification('Please select violations first', 'error');
            return;
        }

        setActionLoading('bulk');
        let generated = 0;
        try {
            for (const v of selected) {
                try {
                    await generateChallan(v);
                    generated++;
                    await new Promise(r => setTimeout(r, 300));
                } catch (e) {
                    console.error(`Failed to generate for ${v.id}:`, e);
                }
            }
            setSelectedViolations(new Set());
            showNotification(`✓ Generated ${generated} of ${selected.length} challans`, 'success');
        } finally {
            setActionLoading(null);
        }
    };

    const deleteViolation = async (id) => {
        if (!window.confirm('Delete this violation? This cannot be undone.')) return;

        try {
            if (!isDemo) {
                const res = await fetch(`${API_CONFIG.ENDPOINTS.VIOLATIONS}/${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!res.ok) throw new Error('Failed to delete');
            }

            const updated = violations.filter(x => x.id !== id);
            updateViolationsState(updated);
            setSelectedViolations(s => new Set([...s].filter(x => x !== id)));
            showNotification('✓ Violation deleted', 'success');
        } catch (err) {
            showNotification('✗ Failed to delete', 'error');
        }
    };

    // ────────────────────────────────────────────────────────────────────────
    // EXPORT FUNCTIONS
    // ────────────────────────────────────────────────────────────────────────
    const exportToCSV = (data, filename = 'violations.csv') => {
        const headers = ['ID', 'Vehicle Plate', 'Vehicle Type', 'Violation', 'Speed', 'Confidence', 'Location', 'Status', 'Date'];
        const rows = data.map(v => [
            v.id,
            v.vehicle_plate || 'N/A',
            v.vehicle_type || 'N/A',
            v.violation_type,
            v.speed_kmph || 'N/A',
            `${(v.confidence_score * 100).toFixed(1)}%`,
            v.location || 'N/A',
            v.status,
            new Date(v.created_at).toLocaleString('en-IN')
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportToJSON = (data, filename = 'violations.json') => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExport = async (format) => {
        setExporting(true);
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            if (format === 'csv') {
                exportToCSV(filtered, `violations_${timestamp}.csv`);
                showNotification('✓ Exported to CSV', 'success');
            } else if (format === 'json') {
                exportToJSON(filtered, `violations_${timestamp}.json`);
                showNotification('✓ Exported to JSON', 'success');
            }
        } catch (err) {
            showNotification('✗ Export failed', 'error');
        } finally {
            setExporting(false);
        }
    };

    // ────────────────────────────────────────────────────────────────────────
    // FILTERING & PAGINATION
    // ────────────────────────────────────────────────────────────────────────
    const filtered = violations.filter(v => {
        const matchesType = filterType === 'ALL' || v.violation_type === filterType;
        const matchesStatus = filterStatus === 'ALL' || v.status === filterStatus;
        const matchesVehicle = filterVehicle === 'ALL' || v.vehicle_type === filterVehicle;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || (v.vehicle_plate || '').toLowerCase().includes(q) ||
                             (v.violation_type || '').toLowerCase().includes(q);
        return matchesType && matchesStatus && matchesVehicle && matchesSearch;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedData = filtered.slice(startIdx, startIdx + itemsPerPage);

    // ────────────────────────────────────────────────────────────────────────
    // STATS
    // ────────────────────────────────────────────────────────────────────────
    const stats = {
        total: violations.length,
        pending: violations.filter(v => v.status === 'PENDING').length,
        approved: violations.filter(v => v.status === 'APPROVED').length,
        rejected: violations.filter(v => v.status === 'REJECTED').length,
        totalFine: violations.reduce((a, v) => a + (FINES[v.violation_type] || 500), 0),
        avgConfidence: violations.length > 0 
            ? (violations.reduce((a, v) => a + (v.confidence_score || 0), 0) / violations.length * 100).toFixed(1)
            : 0
    };

    const selectedCount = selectedViolations.size;
    const toggleSelectViolation = (id) => {
        const newSet = new Set(selectedViolations);
        newSet.has(id) ? newSet.delete(id) : newSet.add(id);
        setSelectedViolations(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedCount === paginatedData.length && paginatedData.length > 0) {
            setSelectedViolations(new Set());
        } else {
            setSelectedViolations(new Set(paginatedData.map(v => v.id)));
        }
    };

    // ────────────────────────────────────────────────────────────────────────
    // RENDER
    // ────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 pb-10">
            {/* Toast Notifications */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold backdrop-blur-md
                            ${notification.type === 'success' ? 'bg-green-900/80 border-green-500/40 text-green-300' :
                              notification.type === 'error' ? 'bg-red-900/80 border-red-500/40 text-red-300' :
                              'bg-blue-900/80 border-blue-500/40 text-blue-300'}`}
                    >
                        {notification.type === 'success' ? <FaCheckCircle /> : 
                         notification.type === 'error' ? <FaTimesCircle /> : 
                         <FaInfo />}
                        {notification.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-cyan-500/40 flex items-center justify-center shadow-lg">
                        <FaShieldAlt className="text-cyan-400 text-lg" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                        <p className="text-xs text-gray-400 mt-1">
                            {lastRefresh 
                                ? `Last updated: ${lastRefresh.toLocaleTimeString()}` 
                                : 'Loading…'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {isDemo && (
                        <motion.span 
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        >
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            DEMO MODE
                        </motion.span>
                    )}
                    <button
                        onClick={() => fetchViolations()}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20 hover:text-white transition-all text-sm font-medium disabled:opacity-50"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                    { label: 'Total', value: stats.total, color: 'text-white', icon: FaShieldAlt },
                    { label: 'Pending', value: stats.pending, color: 'text-yellow-400', icon: FaClock },
                    { label: 'Approved', value: stats.approved, color: 'text-green-400', icon: FaCheckCircle },
                    { label: 'Rejected', value: stats.rejected, color: 'text-red-400', icon: FaTimesCircle },
                    { label: 'Revenue', value: `₹${(stats.totalFine / 100000).toFixed(1)}L`, color: 'text-cyan-400', icon: FaChartBar },
                    { label: 'Accuracy', value: `${stats.avgConfidence}%`, color: 'text-purple-400', icon: FaChartPie },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-panel p-3 rounded-lg"
                    >
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
                        <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    {/* Search */}
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                        <input
                            type="text"
                            placeholder="Search plate, violation…"
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-8 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                    </div>

                    {/* Filters */}
                    <select
                        value={filterType}
                        onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    >
                        <option value="ALL">All Violations</option>
                        <option value="OVERSPEEDING">Overspeeding</option>
                        <option value="NO HELMET">No Helmet</option>
                        <option value="TRIPLE RIDING">Triple Riding</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    >
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>

                    <select
                        value={filterVehicle}
                        onChange={e => { setFilterVehicle(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    >
                        <option value="ALL">All Vehicles</option>
                        <option value="CAR">Car</option>
                        <option value="MOTORCYCLE">Motorcycle</option>
                        <option value="TRUCK">Truck</option>
                        <option value="BUS">Bus</option>
                    </select>
                </div>

                {/* Bulk Actions */}
                {selectedCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-panel p-3 flex flex-col sm:flex-row items-center justify-between gap-3"
                    >
                        <span className="text-sm text-gray-300">{selectedCount} selected</span>
                        <div className="flex gap-2">
                            <button
                                onClick={generateBulkChallans}
                                disabled={actionLoading === 'bulk'}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all text-sm font-bold disabled:opacity-50"
                            >
                                {actionLoading === 'bulk' ? <FaSync className="animate-spin" /> : <FaFilePdf />}
                                Generate Bulk Challans
                            </button>
                            <button
                                onClick={() => setSelectedViolations(new Set())}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all text-sm font-bold"
                            >
                                <FaTimes /> Clear
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Export */}
                {violations.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => handleExport('csv')}
                            disabled={exporting}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30 transition-all text-sm font-bold disabled:opacity-50"
                        >
                            <FaFileExcel /> CSV
                        </button>
                        <button
                            onClick={() => handleExport('json')}
                            disabled={exporting}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 transition-all text-sm font-bold disabled:opacity-50"
                        >
                            <FaDownload /> JSON
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="glass-panel rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex gap-4 p-3 bg-white/5 rounded animate-pulse">
                                <div className="h-4 w-4 bg-white/10 rounded" />
                                <div className="h-4 flex-1 bg-white/10 rounded" />
                                <div className="h-4 w-20 bg-white/10 rounded" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <FaShieldAlt className="text-4xl mb-3 opacity-30" />
                        <p className="text-lg font-semibold">No violations found</p>
                        <p className="text-sm mt-1 mb-5">Adjust filters or check back soon</p>
                        {localStorage.getItem('traffic_violations_cleared') === 'true' && (
                            <button
                                onClick={() => {
                                    localStorage.removeItem('traffic_violations_cleared');
                                    window.location.reload();
                                }}
                                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(0,243,255,0.25)] flex items-center gap-2 border border-cyan-500/30"
                            >
                                Populate Sample Violation Records
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[1200px]">
                                <thead className="border-b border-white/10 bg-white/5">
                                    <tr>
                                        <th className="px-4 py-3 w-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedCount > 0 && selectedCount === paginatedData.length}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 accent-cyan-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-3 py-3 text-xs text-gray-500 font-semibold uppercase">ID</th>
                                        <th className="px-3 py-3 text-xs text-gray-500 font-semibold uppercase">Plate</th>
                                        <th className="px-3 py-3 text-xs text-gray-500 font-semibold uppercase">Vehicle</th>
                                        <th className="px-3 py-3 text-xs text-gray-500 font-semibold uppercase">Violation</th>
                                        <th className="px-3 py-3 text-xs text-gray-500 font-semibold uppercase">Speed</th>
                                        <th className="px-3 py-3 text-xs text-gray-500 font-semibold uppercase">Confidence</th>
                                        <th className="px-3 py-3 text-xs text-gray-500 font-semibold uppercase">Location</th>
                                        <th className="px-3 py-3 text-xs text-gray-500 font-semibold uppercase">Status</th>
                                        <th className="px-3 py-3 text-xs text-gray-500 font-semibold uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {paginatedData.map((v, idx) => {
                                            const colors = VIOLATION_COLORS[v.violation_type] || {};
                                            const isSelected = selectedViolations.has(v.id);
                                            return (
                                                <motion.tr
                                                    key={v.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isSelected ? 'bg-cyan-500/10' : ''}`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSelectViolation(v.id)}
                                                            className="w-4 h-4 accent-cyan-500 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3 font-mono text-xs text-gray-500">#{v.id}</td>
                                                    <td className="px-3 py-3 font-bold text-white">{v.vehicle_plate || '—'}</td>
                                                    <td className="px-3 py-3 flex items-center gap-2">
                                                        {getVehicleIcon(v.vehicle_type)}
                                                        <span className="text-xs text-gray-400">{v.vehicle_type || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${colors.bg} ${colors.text} ${colors.border} border`}>
                                                            {v.violation_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 font-mono text-xs">
                                                        {v.speed_kmph ? <span className={v.speed_kmph > 80 ? 'text-red-400 font-bold' : 'text-gray-300'}>{v.speed_kmph} km/h</span> : '—'}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-cyan-500 to-green-400"
                                                                    style={{ width: `${(v.confidence_score * 100).toFixed(0)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-green-400 font-mono">{(v.confidence_score * 100).toFixed(0)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-xs text-gray-400">{v.location || 'N/A'}</td>
                                                    <td className="px-3 py-3"><StatusBadge status={v.status} /></td>
                                                    <td className="px-3 py-3 flex gap-1">
                                                        {v.status === 'PENDING' ? (
                                                            <button
                                                                onClick={() => generateChallan(v)}
                                                                disabled={actionLoading === v.id}
                                                                className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-50 whitespace-nowrap font-semibold"
                                                            >
                                                                {actionLoading === v.id ? <FaSync className="animate-spin" /> : <FaFilePdf />}
                                                                Generate
                                                            </button>
                                                        ) : (
                                                            <button disabled className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/5 text-gray-600 border border-white/10 cursor-not-allowed whitespace-nowrap">
                                                                <FaCheck /> Done
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteViolation(v.id)}
                                                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 whitespace-nowrap"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, filtered.length)} of {filtered.length}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded border border-white/10 hover:border-white/20 disabled:opacity-50"
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                                                currentPage === i + 1
                                                    ? 'bg-cyan-500/30 border border-cyan-500/50 text-cyan-300'
                                                    : 'border border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded border border-white/10 hover:border-white/20 disabled:opacity-50"
                                    >
                                        <FaChevronRight />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Admin;
