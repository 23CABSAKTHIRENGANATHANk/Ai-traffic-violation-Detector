import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaFilePdf, FaCar, FaMotorcycle, FaTruck, FaBus } from 'react-icons/fa';

const getVehicleIcon = (type) => {
    switch (type) {
        case 'MOTORCYCLE': return <FaMotorcycle className="text-yellow-400" />;
        case 'TRUCK': return <FaTruck className="text-orange-400" />;
        case 'BUS': return <FaBus className="text-blue-400" />;
        default: return <FaCar className="text-neon-blue" />;
    }
};

const Admin = () => {
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('ALL');

    const fetchViolations = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/violations');
            const data = await res.json();
            setViolations(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch violations", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchViolations();
        const interval = setInterval(fetchViolations, 5000); // Polling for updates
        return () => clearInterval(interval);
    }, []);

    const generateChallan = async (id) => {
        try {
            const res = await fetch(`http://localhost:3000/api/violations/${id}/challan`, { method: 'POST' });
            if (res.ok) {
                // Trigger Download
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Challan_${id}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();

                // Update UI
                fetchViolations();
            } else {
                alert("Failed to generate challan");
            }
        } catch (err) {
            console.error(err);
            alert("Error generating challan");
        }
    };

    const filteredViolations = filterType === 'ALL'
        ? violations
        : violations.filter(v => v.violation_type === filterType);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Admin Verification Panel</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400">Filter:</span>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-gray-800 text-white p-2 rounded border border-gray-700 focus:outline-none focus:border-neon-blue"
                    >
                        <option value="ALL">All Violations</option>
                        <option value="NO HELMET">No Helmet</option>
                        <option value="TRIPLE RIDING">Triple Riding</option>
                        <option value="OVERSPEEDING">Overspeeding</option>
                    </select>
                </div>
            </div>

            <div className="glass-panel p-6 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                            <th className="p-4">ID</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Vehicle</th>
                            <th className="p-4">Violation</th>
                            <th className="p-4">Speed</th>
                            <th className="p-4">Confidence</th>
                            <th className="p-4">Evidence</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-200">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center">Loading...</td></tr>
                        ) : filteredViolations.map((v) => (
                            <motion.tr
                                layout
                                key={v.id}
                                className="border-b border-gray-800 hover:bg-white/5 transition-colors"
                            >
                                <td className="p-4 font-mono text-xs text-gray-500">{v.id}</td>
                                <td className="p-4 text-xl">
                                    {getVehicleIcon(v.vehicle_type)}
                                    <span className="text-xs text-gray-400 block mt-1">{v.vehicle_type}</span>
                                </td>
                                <td className="p-4 font-bold text-white flex items-center gap-2">
                                    <FaCar className="text-neon-blue" />
                                    {v.vehicle_plate || "DETECTING..."}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${v.violation_type === 'NO_HELMET' ? 'bg-red-500/20 text-red-500' :
                                        v.violation_type === 'OVERSPEED' ? 'bg-orange-500/20 text-orange-500' :
                                            'bg-purple-500/20 text-purple-500'
                                        }`}>
                                        {v.violation_type}
                                    </span>
                                </td>
                                <td className="p-4 font-mono">{v.speed_kmph ? `${v.speed_kmph} km/h` : '-'}</td>
                                <td className="p-4 text-green-400">{(v.confidence_score * 100).toFixed(0)}%</td>
                                <td className="p-4">
                                    {v.evidence_image_path ? (
                                        <a
                                            href={`http://localhost:3000/processed/${v.evidence_image_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-16 h-10 rounded overflow-hidden border border-gray-600 hover:scale-150 transition-transform origin-left"
                                        >
                                            <img
                                                src={`http://localhost:3000/processed/${v.evidence_image_path}`}
                                                alt="Evidence"
                                                className="w-full h-full object-cover"
                                            />
                                        </a>
                                    ) : (
                                        <span className="text-gray-600 text-xs">No img</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {v.status === 'PENDING' ? (
                                        <span className="text-yellow-400 animate-pulse">Pending Review</span>
                                    ) : (
                                        <span className="text-green-400 flex items-center gap-1"><FaCheck /> Approved</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {v.status === 'PENDING' ? (
                                        <button
                                            onClick={() => generateChallan(v.id)}
                                            className="bg-neon-blue text-black px-4 py-2 rounded font-bold hover:scale-105 transition-transform"
                                        >
                                            Generate Challan
                                        </button>
                                    ) : (
                                        <button
                                            className="text-gray-400 cursor-not-allowed border border-gray-700 px-4 py-2 rounded"
                                            disabled
                                        >
                                            Challan Sent
                                        </button>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
                {violations.length === 0 && !loading && (
                    <div className="text-center p-10 text-gray-500">No violations recorded yet. Upload a video to start.</div>
                )}
            </div>
        </div>
    );
};

export default Admin;
