import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaFilePdf, FaCar, FaMotorcycle, FaTruck, FaBus } from 'react-icons/fa';
import { API_CONFIG } from '../config/api';

const getVehicleIcon = (type) => {
    switch (type) {
        case 'MOTORCYCLE': return <FaMotorcycle />;
        case 'TRUCK': return <FaTruck />;
        case 'BUS': return <FaBus />;
        default: return <FaCar />;
    }
};

const Challans = () => {
    // We can fetch challans from the backend if we had an endpoint, 
    // or just fetch violations where status = 'APPROVED'
    const [challans, setChallans] = useState([]);

    // For now, let's fetch violations and filter, since our MockDB doesn't have a dedicated getChallans endpoint exposed yet.
    // In a real app we'd have GET /api/challans
    const fetchChallans = async () => {
        try {
            const res = await fetch(API_CONFIG.ENDPOINTS.VIOLATIONS);
            const data = await res.json();
            const approved = data.filter(v => v.status === 'APPROVED');
            setChallans(approved);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchChallans();
        const interval = setInterval(fetchChallans, 5000);
        return () => clearInterval(interval);
    }, []);

    const downloadPDF = async (id, plate) => {
        try {
            const res = await fetch(`${API_CONFIG.ENDPOINTS.VIOLATIONS}/${id}/challan`, { method: 'POST' });
            if (res.ok) {
                // Trigger Download
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Challan_${id}_${plate || 'UNKNOWN'}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Failed to download PDF. Ensure Backend is running.");
            }
        } catch (err) {
            console.error(err);
            alert("Error downloading challan");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Digital E-Challans</h1>
                    <p className="text-gray-400">Generated penalty records ready for download</p>
                </div>
                <div className="bg-neon-blue/10 border border-neon-blue/30 px-4 py-2 rounded-lg text-neon-blue font-bold">
                    Total Revenue: ₹ {challans.reduce((acc, curr) => {
                        const fines = { 'NO HELMET': 1000, 'TRIPLE RIDING': 2000, 'OVERSPEEDING': 5000 };
                        return acc + (fines[curr.violation_type] || 500);
                    }, 0).toLocaleString()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challans.map((c, idx) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        key={c.id}
                        className="glass-panel p-6 relative overflow-hidden group"
                    >
                        {/* Card Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-neon-blue/10 transition-colors" />

                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-white/5 p-3 rounded-lg text-2xl text-white">
                                {getVehicleIcon(c.vehicle_type)}
                            </div>
                            <span className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 rounded-full">
                                UNPAID
                            </span>
                        </div>

                        <div className="space-y-2 mb-6">
                            <h3 className="text-2xl font-bold text-white tracking-wider">{c.vehicle_plate}</h3>
                            <p className="text-gray-400 text-sm">Violation: <span className="text-neon-blue">{c.violation_type}</span></p>
                            <p className="text-gray-400 text-sm">Date: <span className="font-mono">{new Date(c.created_at).toLocaleDateString()}</span></p>
                            <div className="pt-2">
                                <span className="text-xl font-bold text-white">
                                    ₹ {
                                        (c.violation_type === 'OVERSPEED' ? 5000 :
                                            c.violation_type === 'TRIPLE RIDING' ? 2000 :
                                                c.violation_type === 'NO HELMET' ? 1000 : 500).toLocaleString()
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => downloadPDF(c.id, c.vehicle_plate)}
                                className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm hover:scale-105 transition-transform"
                            >
                                <FaFilePdf /> Download PDF
                            </button>
                        </div>
                    </motion.div>
                ))}

                {challans.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-gray-700 rounded-xl">
                        No released challans found. Approve violations in the Admin Panel first.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Challans;
