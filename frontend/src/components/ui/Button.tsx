import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#006A6A] to-[#00A3A3] text-white hover:opacity-95 shadow-md shadow-[#006A6A]/10 focus:ring-[#006A6A] border border-transparent',
    secondary: 'bg-white dark:bg-slate-800 text-[#334155] dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-sm focus:ring-slate-400',
    success: 'bg-[#10B981] text-white hover:bg-emerald-600 shadow-md focus:ring-emerald-500 border border-transparent',
    warning: 'bg-[#F59E0B] text-white hover:bg-amber-600 shadow-md focus:ring-amber-500 border border-transparent',
    danger: 'bg-[#BA1A1A] text-white hover:bg-[#A01616] shadow-md shadow-red-900/20 focus:ring-red-500 border border-transparent',
    outline: 'border border-slate-300 dark:border-slate-700 text-[#334155] dark:text-[#CBD5E1] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-slate-400',
    ghost: 'text-[#334155] dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#0B1C30] dark:hover:text-white border border-transparent focus:ring-slate-400',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props as any}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
};

