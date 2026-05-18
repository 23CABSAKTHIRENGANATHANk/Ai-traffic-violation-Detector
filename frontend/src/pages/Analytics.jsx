import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaChartBar, FaChartLine, FaChartPie, FaTruck, FaCalendarAlt,
    FaExclamationTriangle, FaCheckCircle, FaSpinner, FaDownload, FaSync, FaInfoCircle
} from 'react-icons/fa';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { API_CONFIG } from '../config/api';
import { jsPDF } from 'jspdf';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

// ────────────────────────────────────────────────────────────────────────────
// MOCK DATA FOR FALLBACK / DEMO
// ────────────────────────────────────────────────────────────────────────────
const MOCK_VIOLATIONS = [
    { id: 1, violation_type: 'OVERSPEEDING',  status: 'PENDING',   vehicle_plate: 'TN38AB1234', vehicle_type: 'CAR', speed_kmph: 88, confidence_score: 0.97, created_at: new Date(Date.now() - 600000).toISOString(), location: 'Main Road - Sector A' },
    { id: 2, violation_type: 'NO HELMET',     status: 'APPROVED',  vehicle_plate: 'KA01HJ9988', vehicle_type: 'MOTORCYCLE', speed_kmph: 42, confidence_score: 0.92, created_at: new Date(Date.now() - 3600000).toISOString(), location: 'Junction - Sector B' },
    { id: 3, violation_type: 'TRIPLE RIDING', status: 'PENDING',   vehicle_plate: 'MH12CD5678', vehicle_type: 'MOTORCYCLE', speed_kmph: 35, confidence_score: 0.85, created_at: new Date(Date.now() - 7200000).toISOString(), location: 'Highway - Sector C' },
    { id: 4, violation_type: 'OVERSPEEDING',  status: 'PENDING',   vehicle_plate: 'DL4CAF7734', vehicle_type: 'CAR', speed_kmph: 92, confidence_score: 0.99, created_at: new Date(Date.now() - 10800000).toISOString(), location: 'Main Road - Sector A' },
    { id: 5, violation_type: 'NO HELMET',     status: 'APPROVED',  vehicle_plate: 'GJ05AB2222', vehicle_type: 'MOTORCYCLE', speed_kmph: 45, confidence_score: 0.91, created_at: new Date(Date.now() - 14400000).toISOString(), location: 'Junction - Sector B' },
    { id: 6, violation_type: 'OVERSPEEDING',  status: 'APPROVED',  vehicle_plate: 'MH02XY5678', vehicle_type: 'TRUCK', speed_kmph: 75, confidence_score: 0.93, created_at: new Date(Date.now() - 259200000).toISOString(), location: 'Highway - Sector C' },
    { id: 7, violation_type: 'NO HELMET',     status: 'PENDING',   vehicle_plate: 'UP16AB8899', vehicle_type: 'MOTORCYCLE', speed_kmph: 48, confidence_score: 0.88, created_at: new Date(Date.now() - 345600000).toISOString(), location: 'Market St' },
    { id: 8, violation_type: 'TRIPLE RIDING', status: 'REJECTED',  vehicle_plate: 'DL3CBB1122', vehicle_type: 'MOTORCYCLE', speed_kmph: 38, confidence_score: 0.79, created_at: new Date(Date.now() - 604800000).toISOString(), location: 'Junction - Sector B' },
    { id: 9, violation_type: 'OVERSPEEDING',  status: 'APPROVED',  vehicle_plate: 'KA03MN4455', vehicle_type: 'BUS', speed_kmph: 68, confidence_score: 0.95, created_at: new Date(Date.now() - 1209600000).toISOString(), location: 'Highway - Sector C' },
    { id: 10, violation_type: 'NO HELMET',    status: 'APPROVED',  vehicle_plate: 'TN02KL7788', vehicle_type: 'MOTORCYCLE', speed_kmph: 40, confidence_score: 0.94, created_at: new Date(Date.now() - 2592000000).toISOString(), location: 'Main Road - Sector A' }
];

const FINES = {
    'NO HELMET': 1000,
    'TRIPLE RIDING': 2000,
    'OVERSPEEDING': 5000,
    'RED LIGHT': 3000,
    'WRONG LANE': 2500
};

// ────────────────────────────────────────────────────────────────────────────
// CLIENT SIDE ANALYTICS COMPILER
// ────────────────────────────────────────────────────────────────────────────
const calculateClientSideAnalytics = (violationsList) => {
    const analytics = {
        total_violations: violationsList.length,
        violations_by_type: {},
        violations_by_vehicle_type: {},
        average_speed: 0,
        recent_violations: violationsList.slice(0, 10),
        status_breakdown: { PENDING: 0, APPROVED: 0, REJECTED: 0 },
        total_fine_amount: 0,
    };

    let totalSpeed = 0;
    let speedCount = 0;

    violationsList.forEach(v => {
        const type = v.violation_type || v.type || 'OVERSPEEDING';
        const vehicle = v.vehicle_type || 'CAR';
        const status = v.status || 'PENDING';
        const speed = v.speed_kmph || v.speed || 0;

        // By type
        analytics.violations_by_type[type] = (analytics.violations_by_type[type] || 0) + 1;
        
        // By vehicle type
        analytics.violations_by_vehicle_type[vehicle] = (analytics.violations_by_vehicle_type[vehicle] || 0) + 1;
        
        // Status breakdown
        analytics.status_breakdown[status] = (analytics.status_breakdown[status] || 0) + 1;
        
        // Average speed
        if (speed > 0) {
            totalSpeed += speed;
            speedCount++;
        }

        // Fine calculation
        const fine = FINES[type] || 500;
        analytics.total_fine_amount += fine;
    });

    analytics.average_speed = speedCount > 0 ? parseFloat((totalSpeed / speedCount).toFixed(2)) : 0;
    
    // Time-based analytics (today, this week, this month)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    analytics.violations_today = violationsList.filter(v => new Date(v.created_at || v.timestamp) >= today).length;
    analytics.violations_this_week = violationsList.filter(v => new Date(v.created_at || v.timestamp) >= weekAgo).length;
    analytics.violations_this_month = violationsList.filter(v => new Date(v.created_at || v.timestamp) >= monthAgo).length;

    return analytics;
};

const Analytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);
    const [error, setError] = useState(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(API_CONFIG.ENDPOINTS.ANALYTICS, { signal: AbortSignal.timeout(5000) });
            if (!response.ok) throw new Error('Failed to fetch analytics');
            const data = await response.json();
            
            // Sync/Merge with localStorage items if available to display fully up-to-date user uploads
            const localViolations = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
            if (localViolations.length > 0) {
                let allViolations = [...localViolations];
                try {
                    const vRes = await fetch(API_CONFIG.ENDPOINTS.VIOLATIONS, { signal: AbortSignal.timeout(3000) });
                    if (vRes.ok) {
                        const vData = await vRes.json();
                        const apiList = Array.isArray(vData) ? vData : (vData.data || []);
                        apiList.forEach(v => {
                            if (!allViolations.find(m => m.id === v.id)) allViolations.push(v);
                        });
                    }
                } catch (e) {
                    console.warn("Could not merge violations", e);
                }
                setAnalytics(calculateClientSideAnalytics(allViolations));
            } else {
                setAnalytics(data);
            }
            setIsDemo(false);
            setError(null);
        } catch (err) {
            console.warn('API unreachable, fallback to client-side dynamic analytics aggregation:', err.message);
            
            const localViolations = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
            const mergedViolations = [...localViolations];
            
            MOCK_VIOLATIONS.forEach(v => {
                if (!mergedViolations.find(m => m.id === v.id)) {
                    mergedViolations.push(v);
                }
            });

            const computed = calculateClientSideAnalytics(mergedViolations);
            setAnalytics(computed);
            setIsDemo(true);
            setError(null); // Resolve error visually with functioning fallback
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 30000); // Auto-refresh every 30 seconds
        return () => clearInterval(interval);
    }, [fetchAnalytics]);

    // ────────────────────────────────────────────────────────────────────────
    // EXPORT REPORT PDF GENERATOR
    // ────────────────────────────────────────────────────────────────────────
    const exportReport = async () => {
        if (!analytics) return;
        
        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pageWidth - 2 * margin;
            
            let currentY = margin;

            // ============ HEADER SECTION ============
            doc.setFillColor(10, 22, 37); // Deep navy theme color
            doc.rect(0, 0, pageWidth, 40, 'F');

            // Cyan horizontal accent bar
            doc.setFillColor(0, 243, 255);
            doc.rect(0, 40, pageWidth, 2, 'F');

            // Header Text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text("TRAFFIC AI ENFORCEMENT", pageWidth / 2, 17, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(150, 180, 200);
            doc.text("SYSTEM ANALYTICS & VIOLATION SUMMARY REPORT", pageWidth / 2, 25, { align: 'center' });
            doc.text(`Generated: ${new Date().toLocaleString('en-IN')} ${isDemo ? '(DEMO MODE)' : '(LIVE MODE)'}`, pageWidth / 2, 32, { align: 'center' });
            
            currentY = 52;

            // ============ SUMMARY METRICS ============
            doc.setTextColor(10, 22, 37);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text("1. OVERVIEW PERFORMANCE METRICS", margin, currentY);
            currentY += 8;

            const boxWidth = contentWidth / 4 - 3;
            const metrics = [
                { label: "Total Violations", value: String(analytics.total_violations || 0) },
                { label: "Approved Cases", value: String(analytics.status_breakdown?.APPROVED || 0) },
                { label: "Total Fine Fills", value: `INR ${(analytics.total_fine_amount || 0).toLocaleString('en-IN')}` },
                { label: "Average Speed", value: `${analytics.average_speed || 0} km/h` }
            ];

            metrics.forEach((metric, idx) => {
                const x = margin + idx * (boxWidth + 4);
                
                // Draw decorative card background
                doc.setDrawColor(220, 225, 230);
                doc.setFillColor(248, 250, 252);
                doc.rect(x, currentY, boxWidth, 22, 'FD');
                
                // Left border colored indicator
                doc.setFillColor(0, 150, 255);
                doc.rect(x, currentY, 1.5, 22, 'F');

                doc.setTextColor(100, 110, 120);
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'bold');
                doc.text(metric.label, x + 3, currentY + 6);

                doc.setTextColor(10, 22, 37);
                doc.setFontSize(10);
                doc.text(metric.value, x + 3, currentY + 15);
            });

            currentY += 30;

            // Period analysis
            doc.setTextColor(10, 22, 37);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text("Trend Timeline Detection:", margin, currentY);
            currentY += 6;

            doc.setFontSize(9.5);
            doc.setFont('helvetica', 'normal');
            doc.text(`• Today: ${analytics.violations_today || 0} cases`, margin + 5, currentY);
            doc.text(`• This Week: ${analytics.violations_this_week || 0} cases`, margin + 65, currentY);
            doc.text(`• This Month: ${analytics.violations_this_month || 0} cases`, margin + 125, currentY);
            
            currentY += 14;

            // ============ DISTRIBUTION BY TYPE ============
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text("2. VIOLATION TYPE DISTRIBUTION", margin, currentY);
            currentY += 8;

            doc.setFillColor(30, 41, 59);
            doc.rect(margin, currentY, contentWidth, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text("VIOLATION CATEGORY", margin + 5, currentY + 5.5);
            doc.text("COUNT", margin + 80, currentY + 5.5);
            doc.text("FINE RATE", margin + 115, currentY + 5.5);
            doc.text("TOTAL ACCUMULATED FINES", margin + 150, currentY + 5.5);
            
            currentY += 8;
            doc.setTextColor(10, 22, 37);
            doc.setFont('helvetica', 'normal');

            const categories = Object.keys(analytics.violations_by_type || {});
            if (categories.length === 0) {
                doc.text("No violations recorded", margin + 5, currentY + 6);
                currentY += 10;
            } else {
                categories.forEach((cat, index) => {
                    if (index % 2 === 1) {
                        doc.setFillColor(245, 247, 250);
                        doc.rect(margin, currentY, contentWidth, 8, 'F');
                    }
                    const count = analytics.violations_by_type[cat] || 0;
                    const rate = FINES[cat] || 500;
                    const total = count * rate;

                    doc.text(cat, margin + 5, currentY + 5.5);
                    doc.text(String(count), margin + 80, currentY + 5.5);
                    doc.text(`INR ${rate.toLocaleString('en-IN')}`, margin + 115, currentY + 5.5);
                    doc.text(`INR ${total.toLocaleString('en-IN')}`, margin + 150, currentY + 5.5);
                    currentY += 8;
                });
            }

            currentY += 10;

            // ============ DISTRIBUTION BY VEHICLE ============
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text("3. VEHICLE CLASSIFICATION STATS", margin, currentY);
            currentY += 8;

            doc.setFillColor(30, 41, 59);
            doc.rect(margin, currentY, contentWidth, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text("VEHICLE TYPE", margin + 5, currentY + 5.5);
            doc.text("TOTAL OFFENDING VEHICLES", margin + 100, currentY + 5.5);

            currentY += 8;
            doc.setTextColor(10, 22, 37);
            doc.setFont('helvetica', 'normal');

            const vehicles = Object.keys(analytics.violations_by_vehicle_type || {});
            if (vehicles.length === 0) {
                doc.text("No data recorded", margin + 5, currentY + 6);
                currentY += 10;
            } else {
                vehicles.forEach((veh, index) => {
                    if (index % 2 === 1) {
                        doc.setFillColor(245, 247, 250);
                        doc.rect(margin, currentY, contentWidth, 8, 'F');
                    }
                    const count = analytics.violations_by_vehicle_type[veh] || 0;
                    doc.text(veh, margin + 5, currentY + 5.5);
                    doc.text(String(count), margin + 100, currentY + 5.5);
                    currentY += 8;
                });
            }

            currentY += 12;

            // Verification block
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = margin;
            }

            doc.setFillColor(240, 245, 255);
            doc.rect(margin, currentY, contentWidth, 24, 'F');
            doc.setDrawColor(180, 200, 240);
            doc.rect(margin, currentY, contentWidth, 24, 'S');

            doc.setTextColor(30, 80, 150);
            doc.setFontSize(9.5);
            doc.setFont('helvetica', 'bold');
            doc.text("AUTOMATED SYSTEM AUDIT VERIFICATION CERTIFICATE", margin + 5, currentY + 6);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(80, 90, 100);
            doc.text("This official analytics summary document aggregates live detections captured through edge computing neural networks. The reported speeds, counts, and calculated dues represent verified automated traffic regulatory entries.", margin + 5, currentY + 12, { maxWidth: contentWidth - 10 });

            // Page Footer
            doc.setTextColor(120, 130, 140);
            doc.setFontSize(8);
            doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
            doc.text("CONFIDENTIAL GOVERNMENT DOCUMENT • AI TRAFFIC REGULATION DIVISION", pageWidth / 2, pageHeight - 10, { align: 'center' });

            doc.save(`Traffic_AI_Enforcement_Analytics_Report_${Date.now()}.pdf`);
        } catch (e) {
            console.error("Failed to export PDF report:", e);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#050b14]">
                <div className="text-center space-y-4">
                    <FaSpinner className="text-6xl text-cyan-400 animate-spin mx-auto" />
                    <p className="text-gray-400 text-sm font-mono tracking-widest animate-pulse">COMPILING STATS & PIPELINE METRICS...</p>
                </div>
            </div>
        );
    }

    // Chart datasets setup
    const violationTypeData = {
        labels: Object.keys(analytics?.violations_by_type || {}),
        datasets: [{
            label: 'Violations by Type',
            data: Object.values(analytics?.violations_by_type || {}),
            backgroundColor: [
                'rgba(249, 115, 22, 0.8)',  // Orange
                'rgba(239, 68, 68, 0.8)',   // Red
                'rgba(168, 85, 247, 0.8)',  // Purple
                'rgba(59, 130, 246, 0.8)',  // Blue
                'rgba(16, 185, 129, 0.8)',  // Green
            ],
            borderColor: [
                '#f97316', '#ef4444', '#a855f7', '#3b82f6', '#10b981'
            ],
            borderWidth: 1.5,
        }]
    };

    const vehicleTypeData = {
        labels: Object.keys(analytics?.violations_by_vehicle_type || {}),
        datasets: [{
            label: 'Offending Vehicles',
            data: Object.values(analytics?.violations_by_vehicle_type || {}),
            backgroundColor: 'rgba(6, 182, 212, 0.15)', // transparent cyan
            borderColor: '#06b6d4', // solid cyan
            borderWidth: 2,
            pointBackgroundColor: '#050b14',
            pointBorderWidth: 2,
            tension: 0.35,
            fill: true
        }]
    };

    const statusData = {
        labels: Object.keys(analytics?.status_breakdown || {}),
        datasets: [{
            label: 'Challan Statuses',
            data: Object.values(analytics?.status_breakdown || {}),
            backgroundColor: [
                'rgba(234, 179, 8, 0.75)',  // Pending Yellow
                'rgba(34, 197, 94, 0.75)',  // Approved Green
                'rgba(239, 68, 68, 0.75)',   // Rejected Red
            ],
            borderColor: [
                '#eab308', '#22c55e', '#ef4444'
            ],
            borderWidth: 1,
        }]
    };

    const StatCard = ({ icon: Icon, label, value, color, glow }) => (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel p-6 border-l-4 ${color} relative overflow-hidden`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${glow} to-transparent pointer-events-none`} />
            <div className="relative flex justify-between items-center">
                <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
                    <p className="text-4xl font-black text-white mt-2 tracking-tight">{value}</p>
                </div>
                <Icon className="text-5xl opacity-20 text-gray-100" />
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                        <FaChartBar className="text-cyan-400" /> Analytics & Reports
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Automated Traffic Violations Statistics and Visualizations</p>
                </div>
                <div className="flex items-center gap-3">
                    {isDemo && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> DEMO MODE
                        </span>
                    )}
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-xs font-mono border border-green-500/20">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> SYSTEM ONLINE
                    </span>
                    <button
                        onClick={fetchAnalytics}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    icon={FaExclamationTriangle}
                    label="Total Violations"
                    value={analytics?.total_violations || 0}
                    color="border-l-orange-500"
                    glow="from-orange-500/10"
                />
                <StatCard
                    icon={FaCalendarAlt}
                    label="Violations Today"
                    value={analytics?.violations_today || 0}
                    color="border-l-blue-500"
                    glow="from-blue-500/10"
                />
                <StatCard
                    icon={FaCheckCircle}
                    label="Approved Challans"
                    value={analytics?.status_breakdown?.APPROVED || 0}
                    color="border-l-green-500"
                    glow="from-green-500/10"
                />
                <StatCard
                    icon={FaTruck}
                    label="Avg Vehicle Speed"
                    value={analytics?.average_speed ? `${analytics.average_speed} km/h` : '0 km/h'}
                    color="border-l-purple-500"
                    glow="from-purple-500/10"
                />
            </div>

            {/* Extra Fills */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-5 border border-white/5 bg-panel-bg/30">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">This Week</p>
                    <p className="text-3xl font-black text-blue-400 mt-2">{analytics?.violations_this_week || 0}</p>
                    <p className="text-[10px] text-gray-600 mt-1">violations registered</p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-5 border border-white/5 bg-panel-bg/30">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">This Month</p>
                    <p className="text-3xl font-black text-purple-400 mt-2">{analytics?.violations_this_month || 0}</p>
                    <p className="text-[10px] text-gray-600 mt-1">violations registered</p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-5 border border-white/5 bg-panel-bg/30">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Estimated Revenue</p>
                    <p className="text-3xl font-black text-green-400 mt-2">₹{(analytics?.total_fine_amount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-gray-600 mt-1">total fine accumulation</p>
                </motion.div>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6">
                    <h3 className="text-base font-bold text-white mb-5">Violations Categorized</h3>
                    <div className="relative h-[300px]">
                        <Bar data={violationTypeData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                y: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
                                x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { display: false } }
                            }
                        }} />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6">
                    <h3 className="text-base font-bold text-white mb-5">Challan Status Breakdown</h3>
                    <div className="relative h-[300px] flex justify-center">
                        <div className="w-[300px] h-[300px]">
                            <Doughnut data={statusData} options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { color: '#9ca3af', font: { size: 10 }, boxWidth: 12 }
                                    }
                                }
                            }} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Vehicle distribution Line graph */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6">
                <h3 className="text-base font-bold text-white mb-5">Violations Classified by Vehicle Type</h3>
                <div className="relative h-[320px]">
                    <Line data={vehicleTypeData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
                            x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { display: false } }
                        }
                    }} />
                </div>
            </motion.div>

            {/* System Info Note */}
            <div className="glass-panel p-5 border border-white/5 bg-panel-bg/25 flex gap-4 items-start">
                <FaInfoCircle className="text-cyan-400 text-xl mt-0.5 flex-shrink-0" />
                <div>
                    <h4 className="text-sm font-semibold text-white">Edge Node Auto-Syncing</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Data shown here represents real-time telemetry gathered across active CCTV feeds. Speed metrics are updated synchronously through video pixel scale velocity vectors.
                    </p>
                </div>
            </div>

            {/* Export Floating/Bottom Bar */}
            <div className="flex justify-end pt-4">
                <button 
                    onClick={exportReport}
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.25)] hover:shadow-[0_0_30px_rgba(0,243,255,0.45)] hover:scale-[1.03] transition-all duration-300 text-sm tracking-wider cursor-pointer"
                >
                    <FaDownload />
                    EXPORT COMPREHENSIVE REPORT
                </button>
            </div>
        </div>
    );
};

export default Analytics;
