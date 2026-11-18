import React from 'react';
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
  onClose?: () => void;
}

const METRICS_ITEMS: string[] = ['CPU', 'Memória', 'Armazenamento', 'Rede'];

export const ServiceModal: React.FC<ServiceModalProps> = ({ service, onClose }) => {
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
      className={`w-[calc(100vw-32px)] max-w-[360px] max-h-[calc(100vh-32px)] overflow-y-auto p-[12px] sm:p-[14px] bg-[#07180F]/95 backdrop-blur-xl rounded-[14px] border border-[#557364]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_28px_rgba(0,0,0,0.5)] flex flex-col justify-start items-start gap-[9px] sm:gap-[10px] text-[#F2FAF5] font-sans select-none`}
    >
      {/* 1. TOPO: NOME DO SERVIÇO + BOTÃO DE FECHAR */}
      <div className="self-stretch flex justify-between items-center gap-3">
        <div className="min-w-0 truncate text-[#F2FAF5] text-[15px] sm:text-[16px] font-semibold leading-[22px] tracking-wide">
          {service.name}
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={!onClose}
          title="Fechar"
          aria-label="Fechar detalhes do serviço"
          className="w-[25px] h-[25px] relative bg-[#1F8A4C]/35 hover:bg-[#1F8A4C]/70 overflow-hidden rounded-[8px] border border-[#2FA862]/70 flex items-center justify-center text-[#F2FAF5] transition-colors cursor-pointer shrink-0 disabled:cursor-default"
        >
          <svg className="w-[12px] h-[12px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 2. BADGE DE ESTADO + CIDADE + ESTIMATIVA */}
      <div className="self-stretch flex justify-start items-center gap-[5px] flex-wrap">
        {isAtivo && (
          <div className="px-[7px] py-[3px] bg-[#1F8A4C]/20 overflow-hidden rounded-[6px] border border-[#2FA862]/80 flex justify-start items-center gap-[4px]">
            <span className="w-[7px] h-[7px] rounded-full bg-[#39D879] shadow-[0_0_7px_rgba(57,216,121,0.7)]" />
            <span className="text-[#F7F7F5] text-[11px] font-medium leading-[16px]">
              Ativo
            </span>
          </div>
        )}

        {isIndisponivel && (
          <div className="px-[7px] py-[3px] bg-[#9C2A2A]/20 overflow-hidden rounded-[6px] border border-[#D34A4A]/80 flex justify-start items-center gap-[4px]">
            <span className="w-[7px] h-[7px] rounded-full bg-[#F05252] shadow-[0_0_7px_rgba(240,82,82,0.7)]" />
            <span className="text-[#F7F7F5] text-[11px] font-medium leading-[16px]">
              Indisponível
            </span>
          </div>
        )}

        {isSemMetricas && (
          <div className="px-[7px] py-[3px] bg-[#B8B7B8]/15 overflow-hidden rounded-[6px] border border-[#B8B7B8]/70 flex justify-start items-center gap-[4px]">
            <span className="w-[7px] h-[7px] rounded-full bg-[#B8B7B8]" />
            <span className="text-[#F7F7F5] text-[11px] font-medium leading-[16px]">
              Sem métricas
            </span>
          </div>
        )}

        <div className="max-w-full px-[7px] py-[3px] bg-transparent rounded-[6px] border border-[#2FA862]/70 flex justify-start items-center">
          <span className="truncate text-[#F2FAF5] text-[10px] sm:text-[11px] font-normal leading-[16px]">
            Cidade: {locationLabel}
          </span>
        </div>

        {service.isEstimated && !isSemMetricas && (
          <div
            title="Valores calculados por estimativa ambiental"
            className="px-[7px] py-[3px] bg-[#D97706]/20 rounded-[6px] border border-[#D97706] flex justify-start items-center gap-[4px]"
          >
            <svg className="w-[12px] h-[12px] text-[#FBBF24]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[#FBBF24] text-[10px] font-medium leading-[16px]">
              Estimado
            </span>
          </div>
        )}
      </div>

      {/* VARIAÇÃO 1: ATIVO */}
      {isAtivo && (
        <>
          <div className="self-stretch flex flex-col gap-[5px]">
            <div className="flex items-center justify-between gap-2 text-[#A6DEBD] text-[10px] leading-[14px]">
              <span className="font-medium">Indicadores ambientais</span>
              <span className="text-right">Período: {periodLabel}</span>
            </div>

            <div className="self-stretch grid grid-cols-2 gap-[7px]">
              <div className="min-w-0 p-[8px] bg-[#0C2819] rounded-[8px] border border-[#2FA862]/70 flex flex-col justify-start items-start gap-[2px]">
                {kwhMetric.isAvailable ? (
                  <>
                    <div className="max-w-full truncate text-[#F2FAF5] text-[18px] sm:text-[21px] font-bold leading-[25px] whitespace-nowrap">
                      {kwhMetric.displayWithUnit}
                    </div>
                    <div className="text-[#A6DEBD] text-[9px] font-normal leading-[13px]">
                      {periodLabel}
                    </div>
                  </>
                ) : (
                  <div className="text-[#DDF1E5]/70 text-[12px] font-semibold leading-[18px]">
                    Consumo indisponível
                  </div>
                )}
              </div>

              <div className="min-w-0 p-[8px] bg-[#0C2819] rounded-[8px] border border-[#2FA862]/70 flex flex-col justify-start items-start gap-[2px]">
                {co2Metric.isAvailable ? (
                  <>
                    <div className="max-w-full truncate text-[#F2FAF5] text-[18px] sm:text-[21px] font-bold leading-[25px] whitespace-nowrap">
                      {co2Metric.displayWithUnit}
                    </div>
                    <div className="text-[#A6DEBD] text-[9px] font-normal leading-[13px]">
                      {periodLabel}
                    </div>
                  </>
                ) : (
                  <div className="text-[#DDF1E5]/70 text-[12px] font-semibold leading-[18px]">
                    Emissão indisponível
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="self-stretch overflow-hidden flex flex-col justify-start items-start gap-[4px]">
            <span className="text-[#A6DEBD] text-[10px] font-medium leading-[14px]">
              Métricas disponíveis
            </span>
            <div className="self-stretch flex justify-start items-center gap-[4px] flex-wrap">
              {METRICS_ITEMS.map((label) => (
                <div
                  key={label}
                  className="px-[5px] py-[2px] bg-[#0C2819] rounded-[5px] border border-[#2FA862]/60 flex justify-start items-center gap-[3px] shrink-0 whitespace-nowrap"
                >
                  <svg
                    className="w-[11px] h-[11px] text-[#6FE39A] shrink-0"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.5 7.5L5.5 11.5L13.5 3.5"
                      stroke="#F2FAF5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#F2FAF5] text-[9px] sm:text-[10px] font-normal leading-[14px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[#A6DEBD] text-[9px] font-normal leading-[13px]">
            Última atualização: {service.lastUpdate || 'Aguardando sincronização'}
          </div>

          <button
            type="button"
            className="self-stretch h-[38px] px-[14px] bg-[#168747] hover:bg-[#1F9B52] overflow-hidden rounded-[7px] border border-[#36B86A]/70 flex justify-center items-center text-white text-[11px] font-semibold leading-[18px] transition-colors cursor-pointer"
          >
            Ver dashboard completo
          </button>
        </>
      )}

      {/* VARIAÇÃO 2: INDISPONÍVEL */}
      {isIndisponivel && (
        <>
          <div className="self-stretch p-[8px] bg-[#6E1C1C]/25 rounded-[7px] border border-[#B73B3B]/70 flex justify-start items-center gap-[7px]">
            <div className="w-[16px] h-[16px] bg-[#9C2A2A] rounded-full flex justify-center items-center shrink-0">
              <span className="text-[#F7F7F5] text-[10px] font-bold leading-none">!</span>
            </div>
            <span className="text-[#F2FAF5] text-[10px] sm:text-[11px] font-normal leading-[16px]">
              {service.lastUpdate ? `Sem conexão desde ${service.lastUpdate}` : 'Serviço sem conexão ativa'}
            </span>
          </div>

          <div className="self-stretch flex flex-col justify-center items-start gap-[5px]">
            <span className="text-[#A6DEBD] text-[10px] font-medium leading-[14px]">
              Valores da última atualização ({periodLabel})
            </span>
            <div className="self-stretch grid grid-cols-2 gap-[7px]">
              <div className="min-w-0 p-[8px] bg-[#0C2819] rounded-[7px] border border-[#9C2A2A]/80 flex flex-col justify-center items-center text-center">
                {kwhMetric.isAvailable ? (
                  <span className="max-w-full truncate text-[#F2FAF5] text-[17px] sm:text-[20px] font-bold leading-[25px] whitespace-nowrap">
                    {kwhMetric.displayWithUnit}
                  </span>
                ) : (
                  <span className="text-[#F2FAF5]/75 text-[11px] font-medium leading-[17px]">
                    Consumo indisponível
                  </span>
                )}
              </div>
              <div className="min-w-0 p-[8px] bg-[#0C2819] rounded-[7px] border border-[#9C2A2A]/80 flex flex-col justify-center items-center text-center">
                {co2Metric.isAvailable ? (
                  <span className="max-w-full truncate text-[#F2FAF5] text-[17px] sm:text-[20px] font-bold leading-[25px] whitespace-nowrap">
                    {co2Metric.displayWithUnit}
                  </span>
                ) : (
                  <span className="text-[#F2FAF5]/75 text-[11px] font-medium leading-[17px]">
                    Emissão indisponível
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="self-stretch overflow-hidden flex flex-col justify-start items-start gap-[4px]">
            <span className="text-[#A6DEBD] text-[10px] font-medium leading-[14px]">
              Métricas disponíveis
            </span>
            <div className="self-stretch flex justify-start items-center gap-[4px] flex-wrap">
              {METRICS_ITEMS.map((label) => (
                <div
                  key={label}
                  className="px-[5px] py-[2px] bg-[#0C2819] rounded-[5px] border border-[#2FA862]/60 flex justify-start items-center gap-[3px] shrink-0 whitespace-nowrap"
                >
                  <svg
                    className="w-[11px] h-[11px] text-[#6FE39A] shrink-0"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.5 7.5L5.5 11.5L13.5 3.5"
                      stroke="#F2FAF5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#F2FAF5] text-[9px] sm:text-[10px] font-normal leading-[14px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[#A6DEBD] text-[9px] font-normal leading-[13px]">
            Última atualização: {service.lastUpdate || 'Indisponível'}
          </div>

          <button
            type="button"
            className="self-stretch h-[38px] px-[14px] bg-[#168747] hover:bg-[#1F9B52] overflow-hidden rounded-[7px] border border-[#36B86A]/70 flex justify-center items-center text-white text-[11px] font-semibold leading-[18px] transition-colors cursor-pointer"
          >
            Ver dashboard completo
          </button>
        </>
      )}

      {/* VARIAÇÃO 3: SEM MÉTRICAS */}
      {isSemMetricas && (
        <>
          <div className="self-stretch flex flex-col justify-start items-start gap-[4px]">
            <span className="text-[#A6DEBD] text-[10px] font-medium leading-[14px]">
              Métricas disponíveis
            </span>
            <div className="px-[7px] py-[3px] bg-[#0C2819] rounded-[6px] border border-[#2FA862]/60 flex items-center">
              <span className="text-[#F2FAF5] text-[10px] font-normal leading-[16px]">
                – Nenhuma métrica recebida
              </span>
            </div>
          </div>

          <div className="self-stretch py-[12px] px-[10px] bg-[#F2F5F2] rounded-[8px] flex flex-col items-center justify-center text-center gap-[6px]">
            <div className="w-[27px] h-[27px] rounded-full bg-[#DCE5DE] flex items-center justify-center">
              <div className="w-[11px] h-[2px] bg-[#52645A] rounded-full" />
            </div>
            <div className="flex flex-col gap-[2px]">
              <span className="text-[#17231B] text-[11px] font-semibold leading-[16px]">
                Este serviço ainda não envia dados
              </span>
              <span className="text-[#52645A] text-[9px] font-normal leading-[13px]">
                Resultados ambientais indisponíveis no momento.
              </span>
            </div>
          </div>

          <button
            type="button"
            className="self-stretch h-[38px] px-[14px] bg-transparent hover:bg-[#1F8A4C]/20 overflow-hidden rounded-[7px] border border-[#2FA862]/80 flex justify-center items-center text-[#F2FAF5] text-[11px] font-semibold leading-[18px] transition-colors cursor-pointer"
          >
            Ver dashboard completo
          </button>
        </>
      )}
    </div>
  );
};