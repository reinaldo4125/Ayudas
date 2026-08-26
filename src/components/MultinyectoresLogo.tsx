import React from 'react';

interface MultinyectoresLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'full';
  layout?: 'horizontal' | 'stacked';
  showWebsite?: boolean;
}

export const MultinyectoresLogo: React.FC<MultinyectoresLogoProps> = ({
  className = '',
  variant = 'dark',
  layout = 'horizontal',
  showWebsite = true
}) => {
  const isDark = variant === 'dark';

  // SVG Icon Component matching image.png reference exactly
  const LogoIcon = () => (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Rhombus Diamond Frame */}
      <rect
        x="45"
        y="45"
        width="110"
        height="110"
        rx="22"
        transform="rotate(45 100 100)"
        fill="white"
        stroke="#0B3B82"
        strokeWidth="11"
        strokeLinejoin="round"
      />

      {/* Fuel Injector Graphic - Rotated +45deg to align from top-right to bottom-left */}
      <g transform="rotate(45 100 100)" fill="#0B3B82">
        {/* Top Electrical Terminal Prongs */}
        <rect x="94" y="24" width="4" height="15" rx="1" />
        <rect x="102" y="24" width="4" height="15" rx="1" />

        {/* Electrical Plug Socket Header */}
        <path d="M 86 38 L 114 38 L 111 54 L 89 54 Z" />

        {/* Side Connector Port (sticks out upper-left in diagonal) */}
        <path d="M 89 50 L 68 38 C 66 37 63 38 62 40 L 58 46 C 57 48 58 51 60 52 L 83 66 Z" />

        {/* Solenoid Head Body */}
        <path d="M 82 54 L 118 54 C 120 54 121 56 121 58 L 118 76 L 82 76 L 79 58 C 79 56 80 54 82 54 Z" />

        {/* Upper Body Ring */}
        <rect x="84" y="76" width="32" height="7" rx="1" />

        {/* Main Injector Cylinder Shaft */}
        <path d="M 86 83 L 114 83 L 111 122 L 89 122 Z" />

        {/* Side Tab / Bracket on right side */}
        <rect x="111" y="96" width="20" height="7" rx="1" />
        {/* Small square dot below right tab */}
        <rect x="122" y="110" width="6.5" height="6.5" rx="1" />

        {/* Lower Shaft Transition */}
        <rect x="89" y="122" width="22" height="7" rx="1" />
        <path d="M 91 129 L 109 129 L 106 150 L 94 150 Z" />

        {/* Nozzle Tip Collar */}
        <rect x="93" y="150" width="14" height="5" rx="1" />

        {/* Nozzle Tip Pointing Down-Left */}
        <path d="M 95 155 L 105 155 L 102 173 C 101.5 175 98.5 175 98 173 Z" />

        {/* White Highlight Reflection Mark on Nozzle Tip */}
        <ellipse cx="98" cy="164" rx="1.2" ry="3" fill="white" />
      </g>
    </svg>
  );

  if (layout === 'stacked') {
    return (
      <a
        href="https://www.multinyectorescolombia.com"
        target="_blank"
        rel="noopener noreferrer"
        title="Visitar Multinyectores Colombia - www.multinyectorescolombia.com"
        className={`group inline-flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 ${
          isDark
            ? 'bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/40 shadow-lg'
            : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-500/40 shadow-sm'
        } ${className}`}
      >
        {/* Diamond Icon Container */}
        <div className="w-20 h-20 shrink-0 bg-white rounded-2xl p-1 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform duration-200">
          <LogoIcon />
        </div>

        {/* Brand Name Text */}
        <span className={`mt-3 font-bold text-base sm:text-lg tracking-wide ${
          isDark ? 'text-white' : 'text-[#0B3B82]'
        }`}>
          Multinyectores Colombia
        </span>

        {/* Thin Red Accent Underline */}
        <div className="w-32 h-[1.5px] bg-red-600 rounded-full my-1.5" />

        {showWebsite && (
          <span className={`text-[11px] font-semibold tracking-tight transition-colors mt-0.5 ${
            isDark ? 'text-sky-400 group-hover:text-sky-300' : 'text-[#0B3B82] group-hover:text-blue-600'
          }`}>
            www.multinyectorescolombia.com ↗
          </span>
        )}
      </a>
    );
  }

  return (
    <a
      href="https://www.multinyectorescolombia.com"
      target="_blank"
      rel="noopener noreferrer"
      title="Visitar Multinyectores Colombia - www.multinyectorescolombia.com"
      className={`group inline-flex items-center gap-3.5 px-4 py-2.5 rounded-2xl transition-all duration-200 ${
        isDark
          ? 'bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/40 shadow-lg shadow-black/20'
          : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-500/40 shadow-sm hover:shadow-md'
      } ${className}`}
    >
      {/* High-definition Exact Vector Logo Emblem */}
      <div className="relative shrink-0 flex items-center justify-center w-12 h-12 bg-white rounded-xl p-1 shadow-xs border border-slate-100 group-hover:scale-105 transition-transform duration-200">
        <LogoIcon />
      </div>

      {/* Typography & Brand Name */}
      <div className="flex flex-col text-left">
        <span
          className={`font-bold text-xs sm:text-sm sm:text-base tracking-wide ${
            isDark ? 'text-white' : 'text-[#0B3B82]'
          }`}
        >
          Multinyectores Colombia
        </span>

        {/* Thin 1.5px red accent brand underline bar */}
        <div className="w-full h-[1.5px] bg-red-600 rounded-full my-1" />

        {showWebsite && (
          <span
            className={`text-[10px] sm:text-[11px] font-semibold tracking-tight transition-colors ${
              isDark
                ? 'text-sky-400 group-hover:text-sky-300'
                : 'text-[#0B3B82] group-hover:text-blue-600'
            }`}
          >
            www.multinyectorescolombia.com ↗
          </span>
        )}
      </div>
    </a>
  );
};
