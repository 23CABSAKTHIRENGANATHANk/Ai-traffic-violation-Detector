import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { FaExclamationTriangle, FaRupeeSign, FaClock, FaSync, FaShieldAlt } from 'react-icons/fa';
import { API_CONFIG } from '../config/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const MOCK_VIOLATIONS = [
    { id: 1, violation_type: 'OVERSPEEDING',  status: 'PENDING',   vehicle_plate: 'TN38AB1234', confidence_score: 0.97, created_at: new Date(Date.now() - 600000).toISOString() },
    { id: 2, violation_type: 'NO HELMET',     status: 'APPROVED',  vehicle_plate: 'KA01HJ9988', confidence_score: 0.92, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, violation_type: 'TRIPLE RIDING', status: 'PENDING',   vehicle_plate: 'MH12CD5678', confidence_score: 0.85, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 4, violation_type: 'OVERSPEEDING',  status: 'PENDING',   vehicle_plate: 'DL4CAF7734', confidence_score: 0.99, created_at: new Date(Date.now() - 10800000).toISOString() },
    { id: 5, violation_type: 'NO HELMET',     status: 'APPROVED',  vehicle_plate: 'GJ05AB2222', confidence_score: 0.91, created_at: new Date(Date.now() - 14400000).toISOString() },
];

const FINES = { 'NO HELMET': 1000, 'TRIPLE RIDING': 2000, 'OVERSPEEDING': 5000 };

const VIOLATION_DOT = {
    'OVERSPEEDING':  'bg-orange-400',
    'NO HELMET':     'bg-red-400',
    'TRIPLE RIDING': 'bg-purple-400',
};

const Dashboard = () => {
    const [stats, setStats] = useState({ total: 0, pending: 0, revenue: 0, recent: [] });
    const [isDemo, setIsDemo] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(API_CONFIG.ENDPOINTS.VIOLATIONS, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const violations = Array.isArray(data) ? data : [];
            computeStats(violations);
            setIsDemo(false);
        } catch {
            computeStats(MOCK_VIOLATIONS);
            setIsDemo(true);
        } finally {
            setLoading(false);
        }
    }, []);

    const computeStats = (data) => {
        const total   = data.length;
        const pending = data.filter(v => v.status === 'PENDING').length;
        const revenue = data.reduce((acc, v) => acc + (FINES[v.violation_type] || 500), 0);
        const recent  = data.slice(0, 5);
        setStats({ total, pending, revenue, recent });
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(() => fetchStats(true), 10000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const chartData = {
        labels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'],
        datasets: [{
            label: 'Violations Detected',
            data: [12, 19, 3, 25, 22, 30, 15],
            borderColor: '#00f3ff',
            backgroundColor: 'rgba(0, 243, 255, 0.07)',
            tension: 0.4, fill: true,
            pointBackgroundColor: '#050b14',
            pointBorderColor: '#00f3ff',
            pointBorderWidth: 2,
            pointRadius: 4,
        }],
    };

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(10,22,37,0.95)', titleColor: '#fff',
                bodyColor: '#bbb', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
            },
        },
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4b5563' } },
            x: { grid: { display: false }, ticks: { color: '#4b5563' } },
        },
    };

    const statCards = [
        { title: 'Total Violations Today', value: loading ? '—' : stats.total, icon: <FaExclamationTriangle />, color: 'text-red-400', glow: 'from-red-500/10', border: 'border-l-red-500' },
        { title: 'Pending Approval',       value: loading ? '—' : stats.pending, icon: <FaClock />,            color: 'text-orange-400', glow: 'from-orange-500/10', border: 'border-l-orange-400' },
        { title: 'Potential Revenue',      value: loading ? '—' : `₹${stats.revenue.toLocaleString()}`, icon: <FaRupeeSign />, color: 'text-cyan-400', glow: 'from-cyan-500/10', border: 'border-l-cyan-400' },
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Live Monitoring</h2>
                    <p className="text-gray-500 text-sm mt-1">Traffic Enforcement Dashboard • HSR Layout, Sector 2</p>
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
                        onClick={() => fetchStats()}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {statCards.map((stat, idx) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className={`glass-panel p-6 border-l-4 ${stat.border} relative overflow-hidden`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.glow} to-transparent pointer-events-none`} />
                        <div className="relative flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{stat.title}</p>
                                <h3 className="text-4xl font-bold text-white mt-2">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl bg-white/5 ${stat.color} text-xl`}>{stat.icon}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Chart + Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 glass-panel p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold text-white">Violation Trends (Hourly)</h3>
                        <span className="text-xs text-gray-600 font-mono">TODAY</span>
                    </div>
                    <div className="h-[260px]">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </motion.div>

                {/* Recent Feed */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-panel p-6"
                >
                    <h3 className="text-base font-semibold text-white mb-5">Recent Detections</h3>
                    <div className="space-y-3">
                        {stats.recent.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-600">
                                <FaShieldAlt className="text-3xl mb-3 opacity-30" />
                                <p className="text-sm">No recent detections</p>
                            </div>
                        ) : stats.recent.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="flex gap-3 items-center p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 cursor-pointer group"
                            >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${VIOLATION_DOT[item.violation_type] || 'bg-gray-500'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-semibold truncate">{item.violation_type}</p>
                                    <p className="text-cyan-400 text-xs font-mono mt-0.5">{item.vehicle_plate || 'UNKNOWN'}</p>
                                </div>
                                <span className="text-[10px] text-gray-600 font-mono flex-shrink-0">
                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Violation breakdown quick-stats */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel p-6"
            >
                <h3 className="text-base font-semibold text-white mb-5">Violation Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {Object.entries(FINES).map(([type, fine]) => {
                        const count = stats.recent.filter(v => v.violation_type === type).length;
                        const total = stats.recent.length || 1;
                        const pct   = Math.round((count / total) * 100);
                        return (
                            <div key={type}>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-gray-400 font-medium">{type}</span>
                                    <span className="text-gray-500">{count} cases</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, delay: 0.4 }}
                                        className={`h-full rounded-full ${
                                            type === 'OVERSPEEDING'  ? 'bg-orange-400' :
                                            type === 'NO HELMET'     ? 'bg-red-400' :
                                            'bg-purple-400'
                                        }`}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-600 mt-1">Fine: ₹{fine.toLocaleString()}</p>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
