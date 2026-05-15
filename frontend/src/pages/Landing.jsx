import React, { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import TrafficJunction from '../scenes/TrafficJunction';
import Car from '../models/Car';
import Bike from '../models/Bike';
import Bus from '../models/Bus';
import Truck from '../models/Truck';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaVideo, FaShieldAlt, FaChartBar, FaArrowRight } from 'react-icons/fa';

const TrafficController = () => {
    const groupRef = useRef();

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.children.forEach((child, i) => {
                child.position.z += delta * (20 + i % 2);
                if (child.position.z > 100) child.position.z = -300;
            });
        }
    });

    return (
        <group ref={groupRef}>
            {/* Right Lane (Forward) */}
            <Car position={[6, 0, 20]} color="#ffffff" /> {/* Hero Car - White */}
            <Bus position={[6, 0, -50]} color="#0ea5e9" /> {/* City Bus */}
            <Car position={[6, 0, -120]} color="#111827" /> {/* Dark Grey */}

            {/* Left Lane (Oncoming - Simulate by rotating 180) */}
            <group position={[-6, 0, -80]} rotation={[0, Math.PI, 0]}>
                <Truck position={[0, 0, 0]} cabColor="#ef4444" /> {/* Red Truck */}
            </group>
            <group position={[-6, 0, -180]} rotation={[0, Math.PI, 0]}>
                <Bike position={[0, 0, 0]} helmetColor="#fcd34d" />
            </group>
        </group>
    );
};

const Landing = () => {
    return (
        <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans text-white">
            {/* 3D Background */}
            <div className="absolute inset-0 z-0">
                <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-500 bg-slate-200">Initializing Smart City Grid...</div>}>
                    <TrafficJunction>
                        <TrafficController />
                    </TrafficJunction>
                </Suspense>
            </div>

            {/* Professional Overlay - Gradient only at bottom for readable text */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent pointer-events-none"></div>

            <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 text-center pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-widest text-cyan-400 uppercase border border-cyan-500/30 bg-cyan-900/20 rounded">
                        Government & Enterprise Solution
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 text-white">
                        Smart Traffic <span className="text-cyan-400">Intelligence</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-light">
                        Real-time AI violation detection, automated e-challan generation, and city-wide traffic analytics.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="flex flex-wrap justify-center gap-4 pointer-events-auto"
                >
                    <Link to="/live" className="px-8 py-3 bg-cyan-600 text-white font-semibold rounded hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/50 flex items-center gap-2">
                        View Live Feed <FaArrowRight />
                    </Link>

                    <Link to="/admin" className="px-8 py-3 bg-slate-800 border border-slate-600 text-slate-200 font-semibold rounded hover:bg-slate-700 transition-all">
                        Admin Dashboard
                    </Link>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="absolute bottom-12 grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <StatCard icon={<FaVideo />} label="Active Cameras" value="12" />
                    <StatCard icon={<FaShieldAlt />} label="Violations Detected" value="843" />
                    <StatCard icon={<FaChartBar />} label="Accuracy Rate" value="98.5%" />
                </motion.div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="w-64 p-5 bg-slate-900/80 border border-slate-700 backdrop-blur-sm rounded-lg flex items-center gap-4">
        <div className="text-2xl text-cyan-500">{icon}</div>
        <div className="text-left">
            <h4 className="text-2xl font-bold text-white">{value}</h4>
            <p className="text-slate-400 text-xs uppercase tracking-wide">{label}</p>
        </div>
    </div>
);

export default Landing;
