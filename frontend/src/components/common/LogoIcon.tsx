import React from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
  color?: string;
  bgColor?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  className = '',
  size = 24,
}) => {
  return (
    <img
      src="/logo.png"
      alt="SmartOps Logo"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        // 22% border radius perfectly crops standard app-icon squircles to remove white corners
        borderRadius: '22%',
        overflow: 'hidden',
        display: 'block'
      }}
    />
  );
};
