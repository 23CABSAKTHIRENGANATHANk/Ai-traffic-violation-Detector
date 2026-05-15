import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FaChartBar, FaChartLine, FaChartPie, FaTruck, FaCalendarAlt,
    FaExclamationTriangle, FaCheckCircle, FaSpinner, FaDownload
} from 'react-icons/fa';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { API_CONFIG } from '../config/api';
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

const Analytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(API_CONFIG.ENDPOINTS.ANALYTICS);
            if (!response.ok) throw new Error('Failed to fetch analytics');
            const data = await response.json();
            setAnalytics(data);
            setError(null);
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950">
                <div className="text-center">
                    <FaSpinner className="text-6xl text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-300">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 p-8">
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 text-red-200">
                    <h2 className="text-2xl font-bold mb-2">Error Loading Analytics</h2>
                    <p>{error}</p>
                    <button
                        onClick={fetchAnalytics}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const violationTypeData = {
        labels: Object.keys(analytics?.violations_by_type || {}),
        datasets: [{
            label: 'Violations by Type',
            data: Object.values(analytics?.violations_by_type || {}),
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
            ],
            borderColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 206, 86)',
                'rgb(75, 192, 192)',
                'rgb(153, 102, 255)',
            ],
            borderWidth: 1,
        }]
    };

    const vehicleTypeData = {
        labels: Object.keys(analytics?.violations_by_vehicle_type || {}),
        datasets: [{
            label: 'Violations by Vehicle Type',
            data: Object.values(analytics?.violations_by_vehicle_type || {}),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
        }]
    };

    const statusData = {
        labels: Object.keys(analytics?.status_breakdown || {}),
        datasets: [{
            label: 'Violation Status',
            data: Object.values(analytics?.status_breakdown || {}),
            backgroundColor: [
                'rgba(255, 193, 7, 0.8)',
                'rgba(76, 175, 80, 0.8)',
                'rgba(244, 67, 54, 0.8)',
            ],
            borderWidth: 1,
        }]
    };

    const StatCard = ({ icon: Icon, label, value, color }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-br ${color} rounded-lg p-6 text-white`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold opacity-80">{label}</p>
                    <p className="text-4xl font-bold mt-2">{value}</p>
                </div>
                <Icon className="text-6xl opacity-30" />
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center gap-3 mb-2">
                    <FaChartBar className="text-4xl text-blue-500" />
                    <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
                </div>
                <p className="text-slate-400">Real-time traffic violation statistics and insights</p>
            </motion.div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={FaExclamationTriangle}
                    label="Total Violations"
                    value={analytics?.total_violations || 0}
                    color="from-orange-600 to-orange-800"
                />
                <StatCard
                    icon={FaCalendarAlt}
                    label="Violations Today"
                    value={analytics?.violations_today || 0}
                    color="from-blue-600 to-blue-800"
                />
                <StatCard
                    icon={FaCheckCircle}
                    label="Processed"
                    value={analytics?.status_breakdown?.APPROVED || 0}
                    color="from-green-600 to-green-800"
                />
                <StatCard
                    icon={FaTruck}
                    label="Avg Speed (kmph)"
                    value={analytics?.average_speed || 0}
                    color="from-purple-600 to-purple-800"
                />
            </div>

            {/* Time Period Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800 rounded-lg p-6 border border-slate-700"
                >
                    <h3 className="text-lg font-semibold mb-4">This Week</h3>
                    <p className="text-4xl font-bold text-blue-400">{analytics?.violations_this_week || 0}</p>
                    <p className="text-slate-400 text-sm mt-2">violations detected</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800 rounded-lg p-6 border border-slate-700"
                >
                    <h3 className="text-lg font-semibold mb-4">This Month</h3>
                    <p className="text-4xl font-bold text-purple-400">{analytics?.violations_this_month || 0}</p>
                    <p className="text-slate-400 text-sm mt-2">violations detected</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800 rounded-lg p-6 border border-slate-700"
                >
                    <h3 className="text-lg font-semibold mb-4">Estimated Revenue</h3>
                    <p className="text-4xl font-bold text-green-400">₹{(analytics?.total_fine_amount || 0).toLocaleString()}</p>
                    <p className="text-slate-400 text-sm mt-2">total fines</p>
                </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800 rounded-lg p-6 border border-slate-700"
                >
                    <h3 className="text-lg font-semibold mb-4">Violations by Type</h3>
                    <div className="relative h-96">
                        <Bar data={violationTypeData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false,
                                },
                            },
                            scales: {
                                y: {
                                    ticks: { color: 'rgba(226, 232, 240, 0.7)' },
                                    grid: { color: 'rgba(71, 85, 105, 0.3)' },
                                },
                                x: {
                                    ticks: { color: 'rgba(226, 232, 240, 0.7)' },
                                    grid: { color: 'rgba(71, 85, 105, 0.3)' },
                                },
                            },
                        }} />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800 rounded-lg p-6 border border-slate-700"
                >
                    <h3 className="text-lg font-semibold mb-4">Violation Status</h3>
                    <div className="relative h-96">
                        <Doughnut data={statusData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: { color: 'rgba(226, 232, 240, 0.7)' },
                                },
                            },
                        }} />
                    </div>
                </motion.div>
            </div>

            {/* Vehicle Type Distribution */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800 rounded-lg p-6 border border-slate-700"
            >
                <h3 className="text-lg font-semibold mb-4">Vehicle Type Distribution</h3>
                <div className="relative h-96">
                    <Line data={vehicleTypeData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: { color: 'rgba(226, 232, 240, 0.7)' },
                            },
                        },
                        scales: {
                            y: {
                                ticks: { color: 'rgba(226, 232, 240, 0.7)' },
                                grid: { color: 'rgba(71, 85, 105, 0.3)' },
                            },
                            x: {
                                ticks: { color: 'rgba(226, 232, 240, 0.7)' },
                                grid: { color: 'rgba(71, 85, 105, 0.3)' },
                            },
                        },
                    }} />
                </div>
            </motion.div>

            {/* Export Button */}
            <div className="flex justify-end mt-8">
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition transform hover:scale-105">
                    <FaDownload />
                    Export Report
                </button>
            </div>
        </div>
    );
};

export default Analytics;
