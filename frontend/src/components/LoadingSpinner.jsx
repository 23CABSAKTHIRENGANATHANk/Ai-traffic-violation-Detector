import React from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaCheckCircle } from 'react-icons/fa';

const LoadingSpinner = ({ size = 'md', message = null }) => {
    const sizeClasses = {
        sm: 'w-6 h-6 text-lg',
        md: 'w-10 h-10 text-3xl',
        lg: 'w-16 h-16 text-5xl'
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className={`${sizeClasses[size]} text-neon-blue`}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                    <FaSpinner />
                </motion.div>
            </div>
            {message && <p className="text-sm text-gray-400">{message}</p>}
        </div>
    );
};

export const LoadingOverlay = ({ isLoading, message = 'Loading...' }) => {
    if (!isLoading) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
            <LoadingSpinner size="lg" message={message} />
        </motion.div>
    );
};

export const SuccessMessage = ({ message = 'Success!', autoClose = true, duration = 3000, onClose }) => {
    React.useEffect(() => {
        if (autoClose && onClose) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [autoClose, duration, onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center gap-4 py-8"
        >
            <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6 }}
                className="w-16 h-16 text-4xl text-neon-green"
            >
                <FaCheckCircle />
            </motion.div>
            <p className="text-lg font-semibold text-white text-center">{message}</p>
        </motion.div>
    );
};

export default LoadingSpinner;
