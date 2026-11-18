import React from 'react';

export interface StatusBadgeProps {
  status: 'active' | 'unavailable' | 'no-metrics' | 'ativo' | 'indisponível' | 'indisponivel' | 'sem_metricas' | 'sem métricas' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const norm = status.toLowerCase();
  const isAtivo = norm === 'ativo' || norm === 'active';
  const isIndisponivel = norm === 'indisponível' || norm === 'indisponivel' || norm === 'unavailable';

  const containerSize =
    size === 'md'
      ? 'px-[10px] py-[5px] rounded-[10px] gap-[6px] text-[14px] sm:text-[16px]'
      : 'px-[8px] py-[4px] rounded-[8px] gap-[5px] text-[12px]';

  const iconSize = size === 'md' ? 'w-[18px] h-[18px]' : 'w-[15px] h-[15px]';

  if (isAtivo) {
    return (
      <span
        className={`bg-[#1F8A4C]/20 border border-[#2FA862] text-[#F7F7F5] inline-flex items-center font-normal shrink-0 ${containerSize}`}
      >
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4" />
        </svg>
        Ativo
      </span>
    );
  }

  if (isIndisponivel) {
    return (
      <span
        className={`bg-[#9C2A2A]/20 border border-[#9C2A2A] text-[#F7F7F5] inline-flex items-center font-normal shrink-0 ${containerSize}`}
      >
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 10l4 4m0-4l-4 4" />
        </svg>
        Indisponível
      </span>
    );
  }

  return (
    <span
      className={`bg-[#B8B7B8]/20 border border-[#B8B7B8] text-[#F7F7F5] inline-flex items-center font-normal shrink-0 ${containerSize}`}
    >
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8 12h8" />
      </svg>
      Sem métricas
    </span>
  );
};