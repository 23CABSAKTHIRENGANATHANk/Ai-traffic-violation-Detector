import React from 'react';
import { motion } from 'framer-motion';

const Button = React.forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon: Icon = null,
    className = '',
    ...props
}, ref) => {
    const variantClasses = {
        primary: 'btn-primary',
        'primary-solid': 'btn-primary-solid',
        danger: 'btn-danger',
        'danger-solid': 'btn-danger-solid',
        secondary: 'btn-secondary',
        outline: 'bg-transparent border border-white/20 text-white hover:border-white/40 hover:bg-white/5',
        ghost: 'bg-transparent text-white hover:bg-white/10'
    };

    const sizeClasses = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg',
        full: 'w-full px-4 py-2 text-sm'
    };

    return (
        <motion.button
            ref={ref}
            whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            disabled={disabled || loading}
            className={`
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                rounded-lg font-semibold tracking-wide transition-all duration-300
                flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
            `}
            {...props}
        >
            {loading && (
                <span className="animate-spin">⚡</span>
            )}
            {Icon && !loading && <Icon size={16} />}
            {children}
        </motion.button>
    );
});

Button.displayName = 'Button';

export default Button;
