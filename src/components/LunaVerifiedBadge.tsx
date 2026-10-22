import React from 'react';

interface LunaVerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const LunaVerifiedBadge: React.FC<LunaVerifiedBadgeProps> = ({
  className = '',
  size = 'sm',
  showLabel = false,
}) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 select-none ${className}`}
      title="Identidade Oficial da Luna AI • Perfil Verificado no Aplicativo"
      aria-label="Perfil Verificado da Luna AI"
    >
      <svg
        className={`${sizeClasses[size]} shrink-0 text-[#0ea5e9] hover:text-[#38bdf8] transition-colors drop-shadow-[0_1px_2px_rgba(14,165,233,0.3)]`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        {/* Symmetrical verified badge outline */}
        <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.41 2.33 2.33 6.36-6.36 1.41 1.41-7.77 7.77z" />
      </svg>
      {showLabel && (
        <span className="text-[10px] font-medium text-sky-400 tracking-wide">
          Verificada
        </span>
      )}
    </span>
  );
};
