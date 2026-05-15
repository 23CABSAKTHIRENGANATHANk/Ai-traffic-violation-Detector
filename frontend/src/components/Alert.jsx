import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';

const Alert = ({ type = 'info', title, message, onClose, autoClose = true, duration = 5000 }) => {
    React.useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [autoClose, duration, onClose]);

    const typeConfig = {
        success: {
            icon: FaCheckCircle,
            bg: 'bg-green-500/10',
            border: 'border-green-500/30',
            text: 'text-green-400',
            iconBg: 'bg-green-500/20'
        },
        error: {
            icon: FaTimesCircle,
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            text: 'text-red-400',
            iconBg: 'bg-red-500/20'
        },
        warning: {
            icon: FaExclamationTriangle,
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/30',
            text: 'text-yellow-400',
            iconBg: 'bg-yellow-500/20'
        },
        info: {
            icon: FaInfoCircle,
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            text: 'text-blue-400',
            iconBg: 'bg-blue-500/20'
        }
    };

    const config = typeConfig[type] || typeConfig.info;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${config.bg} ${config.border} border rounded-lg p-4 flex items-start gap-3`}
        >
            <div className={`${config.iconBg} p-2 rounded-full flex-shrink-0 mt-0.5`}>
                <Icon className={`${config.text} text-lg`} />
            </div>
            <div className="flex-1">
                {title && <h4 className="text-sm font-semibold text-white">{title}</h4>}
                {message && <p className="text-xs text-gray-300 mt-1">{message}</p>}
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className={`${config.text} hover:text-white transition-colors flex-shrink-0`}
                >
                    <FaTimes />
                </button>
            )}
        </motion.div>
    );
};

export const AlertContainer = ({ alerts, onRemove }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            <AnimatePresence mode="popLayout">
                {alerts.map(alert => (
                    <Alert
                        key={alert.id}
                        {...alert}
                        onClose={() => onRemove(alert.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default Alert;
