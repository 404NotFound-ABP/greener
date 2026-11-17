import React from 'react';
import { useMap } from 'react-leaflet';
import { formatEnvironmentalMetric } from '../utils/environmentalMetrics';

export interface ModalServiceData {
  id: number | string;
  name: string;
  status: 'ativo' | 'indisponível' | 'sem_metricas' | string;
  location?: string | null;
  kwh?: number | null;
  co2?: number | null;
  period?: string;
  isEstimated?: boolean;
  lastUpdate?: string;
}

export interface ServiceModalProps {
  service: ModalServiceData;
}

const METRICS_ITEMS: string[] = ['CPU', 'Memória', 'Armazenamento', 'Rede'];

export const ServiceModal: React.FC<ServiceModalProps> = ({ service }) => {
  const map = useMap();

  const statusNorm = service.status.toLowerCase();
  const isAtivo = statusNorm === 'ativo';
  const isIndisponivel = statusNorm === 'indisponível' || statusNorm === 'indisponivel';
  const isSemMetricas = statusNorm === 'sem_metricas' || statusNorm === 'sem métricas';

  const kwhMetric = formatEnvironmentalMetric(service.kwh, 'kWh');
  const co2Metric = formatEnvironmentalMetric(service.co2, 'kgCO₂e');
  const periodLabel =
    service.period?.trim() || (isIndisponivel ? 'Última leitura registrada' : 'Últimos 7 dias');
  const locationLabel = service.location?.trim() || 'Não informada';

  return (
    <div
      translate="no"
      className={`p-[16px] sm:p-[20px] bg-[#0E3B25]/85 sm:bg-[#0E3B25]/25 backdrop-blur-xl rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px] border-l border-t border-[#F2FAF5] shadow-[inset_-4px_-4px_12px_rgba(14,59,37,0.3),0_12px_28px_rgba(0,0,0,0.35)] flex flex-col justify-start items-start gap-[12px] sm:gap-[14px] text-[#F2FAF5] font-sans select-none ${
        isSemMetricas
          ? 'w-[calc(100vw-48px)] max-w-[340px]'
          : 'w-[calc(100vw-48px)] max-w-[440px]'
      }`}
    >
      {/* 1. TOPO: NOME DO SERVIÇO + BOTÃO DE FECHAR */}
      <div className="self-stretch flex justify-between items-center">
        <div className="text-[#F2FAF5] text-[18px] sm:text-[20px] font-medium leading-[26px] sm:leading-[28px] tracking-wide">
          {service.name}
        </div>

        <button
          type="button"
          onClick={() => map.closePopup()}
          title="Fechar"
          className="w-[35px] h-[35px] relative bg-[#1F8A4C]/50 hover:bg-[#1F8A4C]/80 overflow-hidden rounded-[14px] border border-[#2FA862] flex items-center justify-center text-[#F2FAF5] transition-colors cursor-pointer shrink-0"
        >
          <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 2. BADGE DE ESTADO + CIDADE + ESTIMATIVA */}
      <div className="flex justify-start items-center gap-[8px] flex-wrap">
        {isAtivo && (
          <div className="px-[10px] py-[5px] bg-[#1F8A4C]/20 overflow-hidden rounded-[10px] border border-[#2FA862] flex justify-start items-center gap-[4px]">
            <div className="w-[22px] h-[22px] sm:w-[25px] sm:h-[25px] relative overflow-hidden flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="text-[#F7F7F5] text-[14px] sm:text-[16px] font-normal leading-[22px] sm:leading-[24px]">
              Ativo
            </span>
          </div>
        )}

        {isIndisponivel && (
          <div className="px-[10px] py-[5px] bg-[#9C2A2A]/20 overflow-hidden rounded-[10px] border border-[#9C2A2A] flex justify-start items-center gap-[4px]">
            <div className="w-[22px] h-[22px] sm:w-[25px] sm:h-[25px] relative overflow-hidden flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 10l4 4m0-4l-4 4" />
              </svg>
            </div>
            <span className="text-[#F7F7F5] text-[14px] sm:text-[16px] font-normal leading-[22px] sm:leading-[24px]">
              Indisponível
            </span>
          </div>
        )}

        {isSemMetricas && (
          <div className="px-[10px] py-[5px] bg-[#B8B7B8]/20 overflow-hidden rounded-[10px] border border-[#B8B7B8] flex justify-start items-center gap-[4px]">
            <div className="w-[22px] h-[22px] sm:w-[25px] sm:h-[25px] relative overflow-hidden flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8 12h8" />
              </svg>
            </div>
            <span className="text-[#F7F7F5] text-[14px] sm:text-[16px] font-normal leading-[22px] sm:leading-[24px]">
              Sem métricas
            </span>
          </div>
        )}

        <div className="px-[8px] py-[4px] bg-transparent rounded-[8px] border border-[#2FA862] flex justify-start items-center">
          <span className="text-[#F2FAF5] text-[13px] sm:text-[14px] font-normal leading-[20px]">
            Cidade: {locationLabel}
          </span>
        </div>

        {service.isEstimated && !isSemMetricas && (
          <div
            title="Valores calculados por estimativa ambiental"
            className="px-[8px] py-[4px] bg-[#D97706]/20 rounded-[8px] border border-[#D97706] flex justify-start items-center gap-[4px]"
          >
            <svg className="w-[14px] h-[14px] text-[#FBBF24]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[#FBBF24] text-[12px] sm:text-[13px] font-medium leading-[18px]">
              Estimado
            </span>
          </div>
        )}
      </div>

      {/* VARIAÇÃO 1: ATIVO */}
      {isAtivo && (
        <>
          <div className="self-stretch flex flex-col gap-[6px]">
            <div className="flex items-center justify-between text-[#A6DEBD] text-[12px] leading-[16px]">
              <span>Indicadores ambientais</span>
              <span>Período: {periodLabel}</span>
            </div>

            <div className="self-stretch grid grid-cols-2 gap-[10px] sm:gap-[12px]">
              <div className="p-[10px] bg-transparent rounded-[10px] border border-[#2FA862] flex flex-col justify-start items-start gap-[4px]">
                {kwhMetric.isAvailable ? (
                  <>
                    <div className="text-[#F2FAF5] text-[22px] sm:text-[28px] font-bold leading-[28px] sm:leading-[34px] whitespace-nowrap">
                      {kwhMetric.displayWithUnit}
                    </div>
                    <div className="text-[#A6DEBD] text-[11px] font-normal leading-[15px]">
                      {periodLabel}
                    </div>
                  </>
                ) : (
                  <div className="text-[#DDF1E5]/70 text-[16px] sm:text-[18px] font-semibold leading-[26px]">
                    Consumo indisponível
                  </div>
                )}
              </div>

              <div className="p-[10px] bg-transparent rounded-[10px] border border-[#2FA862] flex flex-col justify-start items-start gap-[4px]">
                {co2Metric.isAvailable ? (
                  <>
                    <div className="text-[#F2FAF5] text-[22px] sm:text-[28px] font-bold leading-[28px] sm:leading-[34px] whitespace-nowrap">
                      {co2Metric.displayWithUnit}
                    </div>
                    <div className="text-[#A6DEBD] text-[11px] font-normal leading-[15px]">
                      {periodLabel}
                    </div>
                  </>
                ) : (
                  <div className="text-[#DDF1E5]/70 text-[16px] sm:text-[18px] font-semibold leading-[26px]">
                    Emissão indisponível
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="self-stretch overflow-hidden flex flex-col justify-start items-start gap-[6px]">
            <span className="text-[#A6DEBD] text-[12px] font-normal leading-[16px]">
              Métricas disponíveis
            </span>
            <div className="self-stretch flex justify-start items-center gap-[6px] flex-wrap sm:flex-nowrap">
              {METRICS_ITEMS.map((label) => (
                <div
                  key={label}
                  className="px-[8px] py-[4px] bg-transparent rounded-[8px] border border-[#2FA862] flex justify-start items-center gap-[4px] shrink-0 whitespace-nowrap"
                >
                  <svg
                    className="w-[15px] h-[15px] text-[#F2FAF5] shrink-0"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.5 7.5L5.5 11.5L13.5 3.5"
                      stroke="#F2FAF5"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#F2FAF5] text-[13px] sm:text-[14px] font-normal leading-[20px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[#A6DEBD] text-[12px] font-normal leading-[16px]">
            Última atualização: {service.lastUpdate || 'Aguardando sincronização'}
          </div>

          <button
            type="button"
            className="self-stretch h-[48px] sm:h-[56px] px-[24px] sm:px-[32px] bg-[#1F8A4C] hover:bg-[#2FA862] overflow-hidden rounded-[10px] flex justify-center items-center text-white text-[15px] sm:text-[16px] font-medium leading-[24px] transition-colors cursor-pointer"
          >
            Ver dashboard completo
          </button>
        </>
      )}

      {/* VARIAÇÃO 2: INDISPONÍVEL */}
      {isIndisponivel && (
        <>
          <div className="self-stretch p-[12px] bg-[#9C2A2A]/15 rounded-[10px] border border-dashed border-[#9C2A2A] flex justify-start items-center gap-[10px]">
            <div className="w-[20px] h-[20px] bg-[#9C2A2A] rounded-full flex justify-center items-center shrink-0">
              <span className="text-[#F7F7F5] text-[13px] font-bold leading-none">!</span>
            </div>
            <span className="text-[#F2FAF5] text-[13px] sm:text-[14px] font-normal leading-[20px]">
              {service.lastUpdate ? `Sem conexão desde ${service.lastUpdate}` : 'Serviço sem conexão ativa'}
            </span>
          </div>

          <div className="self-stretch flex flex-col justify-center items-start gap-[10px]">
            <span className="text-[#A6DEBD] text-[12px] font-normal leading-[16px]">
              Valores da última atualização ({periodLabel})
            </span>
            <div className="self-stretch grid grid-cols-2 gap-[10px] sm:gap-[15px]">
              <div className="p-[10px] bg-transparent rounded-[10px] border border-[#9C2A2A] flex flex-col justify-center items-center text-center">
                {kwhMetric.isAvailable ? (
                  <span className="text-[#F2FAF5] text-[22px] sm:text-[28px] font-bold leading-[28px] sm:leading-[36px] whitespace-nowrap">
                    {kwhMetric.displayWithUnit}
                  </span>
                ) : (
                  <span className="text-[#F2FAF5]/75 text-[15px] sm:text-[16px] font-medium leading-[22px]">
                    Consumo indisponível
                  </span>
                )}
              </div>
              <div className="p-[10px] bg-transparent rounded-[10px] border border-[#9C2A2A] flex flex-col justify-center items-center text-center">
                {co2Metric.isAvailable ? (
                  <span className="text-[#F2FAF5] text-[22px] sm:text-[28px] font-bold leading-[28px] sm:leading-[36px] whitespace-nowrap">
                    {co2Metric.displayWithUnit}
                  </span>
                ) : (
                  <span className="text-[#F2FAF5]/75 text-[15px] sm:text-[16px] font-medium leading-[22px]">
                    Emissão indisponível
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="self-stretch overflow-hidden flex flex-col justify-start items-start gap-[6px]">
            <span className="text-[#A6DEBD] text-[12px] font-normal leading-[16px]">
              Métricas disponíveis
            </span>
            <div className="self-stretch flex justify-start items-center gap-[6px] flex-wrap sm:flex-nowrap">
              {METRICS_ITEMS.map((label) => (
                <div
                  key={label}
                  className="px-[8px] py-[4px] bg-transparent rounded-[8px] border border-[#2FA862] flex justify-start items-center gap-[4px] shrink-0 whitespace-nowrap"
                >
                  <svg
                    className="w-[15px] h-[15px] text-[#F2FAF5] shrink-0"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.5 7.5L5.5 11.5L13.5 3.5"
                      stroke="#F2FAF5"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#F2FAF5] text-[13px] sm:text-[14px] font-normal leading-[20px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[#A6DEBD] text-[12px] font-normal leading-[16px]">
            Última atualização: {service.lastUpdate || 'Indisponível'}
          </div>

          <button
            type="button"
            className="self-stretch h-[48px] sm:h-[56px] px-[24px] sm:px-[32px] bg-[#1F8A4C] hover:bg-[#2FA862] overflow-hidden rounded-[10px] flex justify-center items-center text-white text-[15px] sm:text-[16px] font-medium leading-[24px] transition-colors cursor-pointer"
          >
            Ver dashboard completo
          </button>
        </>
      )}

      {/* VARIAÇÃO 3: SEM MÉTRICAS */}
      {isSemMetricas && (
        <>
          <div className="self-stretch flex flex-col justify-start items-start gap-[6px]">
            <span className="text-[#A6DEBD] text-[12px] font-normal leading-[16px]">
              Métricas disponíveis
            </span>
            <div className="px-[10px] py-[4px] bg-transparent rounded-[8px] border border-[#2FA862] flex items-center">
              <span className="text-[#F2FAF5] text-[14px] font-normal leading-[20px]">
                – Nenhuma métrica recebida
              </span>
            </div>
          </div>

          <div className="self-stretch py-[22px] sm:py-[28px] px-[16px] bg-[#F2FAF5]/10 rounded-[12px] flex flex-col items-center justify-center text-center gap-[12px]">
            <div className="w-[48px] h-[48px] rounded-full bg-[#B8B7B8]/25 flex items-center justify-center">
              <div className="w-[18px] h-[3px] bg-[#4A5550] rounded-full" />
            </div>
            <div className="flex flex-col gap-[4px]">
              <span className="text-[#F2FAF5] sm:text-[#111A15] text-[15px] sm:text-[16px] font-medium leading-[22px]">
                Este serviço ainda não envia dados
              </span>
              <span className="text-[#DDF1E5]/80 sm:text-[#3A4940] text-[12px] font-normal leading-[16px]">
                Resultados ambientais indisponíveis no momento.
              </span>
            </div>
          </div>

          <button
            type="button"
            className="self-stretch h-[48px] sm:h-[56px] px-[24px] sm:px-[32px] bg-transparent hover:bg-[#1F8A4C]/20 overflow-hidden rounded-[10px] border-[1.5px] border-[#1F8A4C] flex justify-center items-center text-[#F2FAF5] text-[15px] sm:text-[16px] font-medium leading-[24px] transition-colors cursor-pointer"
          >
            Ver dashboard completo
          </button>
        </>
      )}
    </div>
  );
};