import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform transition-transform hover:scale-105"
      >
        <defs>
          <linearGradient id="logo-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0055FF" />
            <stop offset="50%" stopColor="#0088FF" />
            <stop offset="100%" stopColor="#00CC88" />
          </linearGradient>
          <linearGradient id="logo-grad-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0055FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00CC88" stopOpacity="0.2" />
          </linearGradient>
          <filter id="logo-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
          </filter>
        </defs>

        {/* Glow backdrop */}
        <rect
          x="4"
          y="4"
          width="32"
          height="32"
          rx="10"
          fill="url(#logo-grad-glow)"
          filter="url(#logo-blur)"
        />

        {/* Outer Hex/Rounded Frame */}
        <rect
          x="4"
          y="4"
          width="32"
          height="32"
          rx="10"
          fill="#141428"
          stroke="#2A2A4A"
          strokeWidth="1.5"
        />

        {/* Robotic Kinematic Link & Neural Zero Vector */}
        <path
          d="M 12 28 L 18 16 L 28 12"
          stroke="url(#logo-grad-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Kinematic Joint Nodes */}
        <circle cx="12" cy="28" r="3" fill="#0A0A1A" stroke="#00CC88" strokeWidth="2" />
        <circle cx="18" cy="16" r="3.5" fill="#0A0A1A" stroke="#0088FF" strokeWidth="2" />
        <circle cx="28" cy="12" r="3" fill="#0055FF" stroke="#FFFFFF" strokeWidth="1.5" />

        {/* Zero Policy Pulse Outer Ring */}
        <circle cx="28" cy="28" r="5" stroke="#0055FF" strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="28" cy="28" r="2" fill="#00CC88" />
      </svg>
    </div>
  );
};
