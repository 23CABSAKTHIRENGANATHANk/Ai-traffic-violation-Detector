import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-deep-bg text-gray-100 font-sans">
            <Sidebar />
            <div className="ml-64 p-8 min-h-screen relative overflow-hidden">
                {/* Background Ambient Glows */}
                <div className="fixed top-0 left-64 w-96 h-96 bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none" />

                <div className="relative z-10">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
