import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = ''
}) => {
  const styles = {
    success: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20 dark:bg-[#10B981]/15 dark:text-[#34D399]',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 dark:bg-[#F59E0B]/15 dark:text-[#FBBF24]',
    danger: 'bg-[#FFDAD4] text-[#BA1A1A] border-[#BA1A1A]/20 dark:bg-[#7F1D1D]/30 dark:text-[#FCA5A5] dark:border-[#FCA5A5]/25',
    info: 'bg-[#0284C7]/10 text-[#0284C7] border-[#0284C7]/20 dark:bg-[#0369A1]/30 dark:text-[#38BDF8] dark:border-[#38BDF8]/20',
    neutral: 'bg-[#EFF4FF] text-[#545F73] border-[#E5EEFF] dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:border-[#334155]',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

