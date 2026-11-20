import React, { useState } from 'react';
import type { ServiceData } from '../types/service';
import { formatEnvironmentalMetric } from '../utils/environmentalMetrics';

export interface ServiceCardProps {
  markerVisible?: boolean;
  onToggleMarker?: () => void;
  service: ServiceData & {
    periodo?: string;
    estimado?: boolean;
    valores?: {
      kwh?: number | null;
      gco2e?: number | null;
      kgco2e?: number | null;
      periodo?: string;
      estimado?: boolean;
    };
  };
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  markerVisible,
  onToggleMarker
}) => {
  const [locallySelected, setLocallySelected] = useState(false);
  const isSelected = markerVisible ?? locallySelected;

  const statusNorm = service?.status?.toLowerCase().trim() || '';
  const isAtivo = statusNorm === 'ativo';
  const isIndisponivel = statusNorm === 'indisponível' || statusNorm === 'indisponivel';

  const statusLabel = isAtivo
    ? 'Ativo'
    : isIndisponivel
    ? 'Indisponível'
    : 'Sem métricas';

  // Fallbacks para localização incompleta (T23/US10)
  const pais = service.localizacao?.pais?.trim() || '';
  const regiao = service.localizacao?.regiao?.trim() || '';
  const cidade = service.localizacao?.cidade?.trim() || '';

  const compactLocation =
    [cidade, pais].filter(Boolean).join(' - ') || 'Localização não informada';

  // Leitura segura das métricas ambientais (T24.2/US18)
  const rawKwh = service.valores?.kwh ?? null;
  const hasKgCo2 = service.valores?.kgco2e !== undefined;
  const rawCo2 = hasKgCo2 ? service.valores?.kgco2e : service.valores?.gco2e ?? null;
  const co2Unit = hasKgCo2 ? 'kgCO₂e' : 'gCO₂e';

  const kwhFormatted = formatEnvironmentalMetric(rawKwh, 'kWh');
  const co2Formatted = formatEnvironmentalMetric(rawCo2, co2Unit);

  const periodLabel =
    service.valores?.periodo ||
    service.periodo ||
    (isIndisponivel ? 'Última leitura' : 'Últimos 7 dias');

  const isEstimated = Boolean(service.valores?.estimado ?? service.estimado);

  const compactMetricText = !kwhFormatted.isAvailable
    ? `Resultados indisponíveis (${periodLabel})`
    : isAtivo
    ? `${kwhFormatted.displayWithUnit}${isEstimated ? ' (est.)' : ''} · ${periodLabel}`
    : `último: ${kwhFormatted.displayWithUnit}`;

  return (
    <>
      {/* =========================================================
          VERSÃO MOBILE (< 640px): Card horizontal compacto do Figma
          ========================================================= */}
      <div className="flex sm:hidden self-stretch w-full px-[14px] py-[12px] bg-[#166A3E]/55 rounded-[14px] border border-[#2FA862] justify-between items-center gap-[10px] shrink-0">
        <div className="flex-1 min-w-0 flex flex-col justify-center items-start gap-[2px]">
          <span className="text-[#F7F7F5] text-[15px] font-medium leading-[20px] truncate w-full">
            {service.nome}
          </span>
          <span className="text-[#DDF1E5]/85 text-[12px] font-normal leading-[16px] truncate w-full">
            {compactLocation} · {compactMetricText}
          </span>
        </div>

        {/* Badge de Status Compacto */}
        <div
          className={`px-[10px] py-[5px] rounded-[10px] border flex justify-center items-center gap-[5px] shrink-0 ${
            isAtivo
              ? 'bg-[#1F8A4C]/30 border-[#2FA862]'
              : isIndisponivel
              ? 'bg-[#9C2A2A]/30 border-[#9C2A2A]'
              : 'bg-[#4A504D]/40 border-[#B8B7B8]'
          }`}
        >
          {isAtivo ? (
            <svg className="w-[16px] h-[16px] text-[#F7F7F5] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4" />
            </svg>
          ) : isIndisponivel ? (
            <svg className="w-[16px] h-[16px] text-[#F2FAF5] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 10l4 4m0-4l-4 4" />
            </svg>
          ) : (
            <svg className="w-[16px] h-[16px] text-[#F2FAF5] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8 12h8" />
            </svg>
          )}
          <span className="text-[#F2FAF5] text-[13px] font-normal leading-[18px] whitespace-nowrap">
            {statusLabel}
          </span>
        </div>
      </div>

      {/* =========================================================
          VERSÃO DESKTOP (>= 640px): Card detalhado original
          ========================================================= */}
      <div className="hidden sm:flex self-stretch w-full p-[10px] bg-[#166A3E]/50 overflow-hidden rounded-[14px] border border-[#2FA862] flex-col justify-start items-start gap-[14px] shrink-0">
        {/* 1. TOPO: Checkbox + Nome do Serviço + Badge de Estado */}
        <div className="self-stretch px-[5px] flex justify-start items-center gap-[8px]">
          <button
            type="button"
            onClick={event => {
              event.stopPropagation();
              if (markerVisible === undefined) {
                setLocallySelected(previous => !previous);
              }
              onToggleMarker?.();
            }}
            aria-label={`Selecionar ${service.nome}`}
            aria-pressed={isSelected}
            className={`w-[25px] h-[25px] relative rounded-[5px] border border-[#2FA862] flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isSelected ? 'bg-[#2FA862]' : 'bg-transparent hover:bg-[#2FA862]/20'
            }`}
          >
            {isSelected && (
              <svg className="w-[16px] h-[16px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="flex-1 text-[#F7F7F5] text-[16px] font-normal leading-[24px] break-words">
            {service.nome}
          </div>

          <div
            className={`px-[6px] py-[4px] overflow-hidden rounded-[10px] border flex justify-start items-center gap-[4px] shrink-0 ${
              isAtivo
                ? 'bg-[#2FA862] border-[#2FA862]'
                : isIndisponivel
                ? 'bg-[#9C2A2A] border-[#F34F0E]'
                : 'bg-[#4A504D] border-[#B8B7B8]'
            }`}
          >
            <div className="w-[25px] h-[25px] relative overflow-hidden flex items-center justify-center shrink-0">
              {isAtivo ? (
                <svg className="w-[20px] h-[20px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4" />
                </svg>
              ) : isIndisponivel ? (
                <svg className="w-[20px] h-[20px] text-[#F2FAF5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 10l4 4m0-4l-4 4" />
                </svg>
              ) : (
                <svg className="w-[20px] h-[20px] text-[#F2FAF5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8 12h8" />
                </svg>
              )}
            </div>
            <span className="text-[#F2FAF5] text-[16px] font-normal leading-[24px] whitespace-nowrap">
              {isAtivo ? 'Ativo' : isIndisponivel ? 'Indisponível' : 'Sem métricas'}
            </span>
          </div>
        </div>

        {/* 2. LOCALIZAÇÃO: País, Região e Cidade com fallback */}
        <div className="self-stretch flex flex-col justify-center items-start gap-[5px]">
          <div className="text-[#F2FAF5] text-[16px] font-normal leading-[24px]">
            Localização
          </div>
          <div className="self-stretch flex justify-start items-start gap-[10px] flex-wrap content-start">
            <div className="p-[4px] rounded-[6px] border border-[#2FA862] flex flex-col justify-center items-center">
              <span className="text-[#F2FAF5] text-[14px] font-normal leading-[20px]">
                País: {pais || 'Não informado'}
              </span>
            </div>
            <div className="p-[4px] overflow-hidden rounded-[6px] border border-[#2FA862] flex flex-col justify-start items-start">
              <span className="text-[#F2FAF5] text-[14px] font-normal leading-[20px]">
                Região: {regiao || 'Não informada'}
              </span>
            </div>
            <div className="p-[4px] overflow-hidden rounded-[6px] border border-[#2FA862] flex flex-col justify-start items-start">
              <span className="text-[#F2FAF5] text-[14px] font-normal leading-[20px]">
                Cidade: {cidade || 'Não informada'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. VALORES: kWh e CO₂e com período, estimativa e estado indisponível */}
        <div className="self-stretch flex flex-col justify-start items-start gap-[5px]">
          <div className="self-stretch flex items-center justify-between gap-[6px]">
            <div className="text-white text-[16px] font-normal leading-[24px]">
              Valores <span className="text-[12px] text-[#A6DEBD]">({periodLabel})</span>
            </div>

            {isEstimated && (kwhFormatted.isAvailable || co2Formatted.isAvailable) && (
              <span
                title="Valor estimado por modelo ambiental"
                className="inline-flex items-center gap-[4px] px-[6px] py-[2px] rounded-[6px] bg-[#D97706]/20 border border-[#D97706] text-[#FBBF24] text-[11px] font-medium"
              >
                <svg className="w-[12px] h-[12px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Estimado
              </span>
            )}
          </div>

          <div className="self-stretch p-[6px] rounded-[10px] border border-[#2FA862] flex flex-col justify-start items-start gap-[6px]">
            {!kwhFormatted.isAvailable && !co2Formatted.isAvailable ? (
              <div className="text-[#DDF1E5]/80 text-[13px] italic py-[2px]">
                Resultados ambientais indisponíveis neste período
              </div>
            ) : (
              <>
                <div className="inline-flex justify-start items-center gap-[6px]">
                  <span className="text-[#F2FAF5] text-[14px] font-normal leading-[20px]">
                    {kwhFormatted.isAvailable ? kwhFormatted.displayWithUnit : 'Consumo indisponível'}
                  </span>
                  {kwhFormatted.isAvailable && (
                    <div className="w-[100px] h-[4px] relative bg-[#8A38F5] rounded-[10px]" />
                  )}
                </div>

                <div className="inline-flex justify-start items-center gap-[6px]">
                  <span className="text-[#F2FAF5] text-[14px] font-normal leading-[20px]">
                    {co2Formatted.isAvailable ? co2Formatted.displayWithUnit : 'Emissão indisponível'}
                  </span>
                  {co2Formatted.isAvailable && (
                    <div className="w-[100px] h-[4px] relative bg-[#8A38F5] rounded-[10px]" />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};