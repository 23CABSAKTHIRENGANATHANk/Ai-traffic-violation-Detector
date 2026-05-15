import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaChartPie, FaVideo, FaFileInvoice, FaUserShield, FaSignOutAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Sidebar = () => {
    const menuItems = [
        { path: '/', name: 'Dashboard', icon: <FaChartPie /> },
        { path: '/live', name: 'Violation Detection', icon: <FaVideo /> },
        { path: '/challans', name: 'E-Challans', icon: <FaFileInvoice /> },
        { path: '/admin', name: 'Admin Panel', icon: <FaUserShield /> },
    ];

    return (
        <div className="h-screen w-64 bg-panel-bg border-r border-white/10 flex flex-col p-4 fixed left-0 top-0 z-50">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-blue to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                    <span className="text-white font-bold text-xl">AI</span>
                </div>
                <div>
                    <h1 className="text-white font-bold text-lg tracking-wider">TRAFFIC<span className="text-neon-blue">AI</span></h1>
                    <p className="text-gray-500 text-xs tracking-widest">GOV SYSTEM</p>
                </div>
            </div>

            <nav className="flex-1 flex flex-col gap-2">
                {menuItems.map((item) => (
                    <NavLink
                        to={item.path}
                        key={item.name}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group ${isActive
                                ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20 shadow-[0_0_10px_rgba(0,243,255,0.1)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/0 via-neon-blue/5 to-neon-blue/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </NavLink>
                ))}
            </nav>

            <button className="flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-neon-red/10 hover:text-neon-red rounded-xl transition-all duration-300 mt-auto border border-transparent hover:border-neon-red/20">
                <FaSignOutAlt />
                <span className="font-medium">Logout</span>
            </button>
        </div>
    );
};

export default Sidebar;
