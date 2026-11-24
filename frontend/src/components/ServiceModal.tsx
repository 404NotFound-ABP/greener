import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatEnvironmentalMetric } from '../utils/environmentalMetrics';

export interface ModalServiceData {
  id: number | string;
  name: string;
  status: 'ativo' | 'indisponível' | 'sem_metricas' | string;
  location?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  localizacao?: {
    pais?: string | null;
    regiao?: string | null;
    cidade?: string | null;
  } | null;
  kwh?: number | null;
  co2?: number | null;
  period?: string;
  isEstimated?: boolean;
  lastUpdate?: string;
}

export interface ServiceHistoryMeasurement {
  id?: number | string;
  servidorId?: string;
  status?: string;
  cpuPercent?: string | number | null;
  memoriaGb?: string | number | null;
  discoGb?: string | number | null;
  redeGb?: string | number | null;
  energiaKwh?: string | number | null;
  emissoesGco2e?: string | number | null;
  coletadoEm: string;
}

export interface ServiceModalProps {
  service: ModalServiceData;
  onClose?: () => void;
  onOpenDashboard?: (service: ModalServiceData) => void;
  initialHistory?: ServiceHistoryMeasurement[];
}

type ChartMetricType = 'kwh' | 'co2';

interface NormalizedPoint {
  timestamp: number;
  isoDate: string;
  shortTimeLabel: string;
  fullDateTimeLabel: string;
  kwh: number;
  co2: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
const DEFAULT_METRICS_ITEMS: string[] = ['CPU', 'Memória', 'Armazenamento', 'Rede'];

function parseNumeric(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatSmartNumber(value: number, forceDecimals?: number): string {
  const decimals =
    typeof forceDecimals === 'number'
      ? forceDecimals
      : Number.isInteger(value)
      ? 0
      : Math.abs(value) > 0 && Math.abs(value) < 1
      ? 3
      : 2;

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatDateTimeFull(date: Date): string {
  const datePart = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

  const timePart = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);

  return `${datePart} às ${timePart}`;
}

function formatAxisTick(date: Date, spansMultipleDays: boolean): string {
  if (spansMultipleDays) {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function resolveLocationParts(service: ModalServiceData): {
  country: string;
  region: string;
  city: string;
} {
  const locObj = service.localizacao;
  let country = (service.country ?? locObj?.pais)?.trim() || '';
  let region = (service.region ?? locObj?.regiao)?.trim() || '';
  let city = (service.city ?? locObj?.cidade)?.trim() || '';

  if ((!country || !city) && service.location?.trim()) {
    const raw = service.location.trim();
    const delimiter = raw.includes(' - ') ? ' - ' : raw.includes(',') ? ',' : null;
    if (delimiter) {
      const parts = raw.split(delimiter).map((p) => p.trim()).filter(Boolean);
      if (parts.length === 3) {
        if (!city) city = parts[0];
        if (!region) region = parts[1];
        if (!country) country = parts[2];
      } else if (parts.length === 2) {
        if (!city) city = parts[0];
        if (!country) country = parts[1];
      } else if (parts.length === 1 && !city) {
        city = parts[0];
      }
    } else if (!city) {
      city = raw;
    }
  }

  return { country, region, city };
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  service,
  onClose,
  onOpenDashboard,
  initialHistory,
}) => {
  const statusNorm = service.status.toLowerCase().trim();
  const isAtivo = statusNorm === 'ativo';
  const isIndisponivel = statusNorm === 'indisponível' || statusNorm === 'indisponivel';
  const isSemMetricas =
    statusNorm === 'sem_metricas' ||
    statusNorm === 'sem métricas' ||
    statusNorm === 'sem métrica' ||
    statusNorm === 'sem metrica';

  const [history, setHistory] = useState<ServiceHistoryMeasurement[]>(initialHistory ?? []);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(!initialHistory && !isSemMetricas);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetricType>('kwh');
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  const fetchServiceHistory = useCallback(async () => {
    if (initialHistory) {
      setHistory(initialHistory);
      setIsLoadingHistory(false);
      setHistoryError(null);
      return;
    }

    if (isSemMetricas) {
      setHistory([]);
      setIsLoadingHistory(false);
      setHistoryError(null);
      return;
    }

    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const servidorId = encodeURIComponent(String(service.id));
      const response = await fetch(
        `${API_BASE_URL}/api/coleta/historico?servidorId=${servidorId}&limite=12`
      );

      if (!response.ok) {
        throw new Error(`Falha HTTP ${response.status}`);
      }

      const payload = (await response.json()) as ServiceHistoryMeasurement[];
      setHistory(Array.isArray(payload) ? payload : []);
    } catch {
      setHistoryError('Não foi possível carregar o histórico de coletas deste serviço.');
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [service.id, initialHistory, isSemMetricas]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchServiceHistory();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchServiceHistory]);

  const chartPoints = useMemo<NormalizedPoint[]>(() => {
    const validRaw = history
      .map((item) => {
        const date = new Date(item.coletadoEm);
        const kwh = parseNumeric(item.energiaKwh);
        const co2 = parseNumeric(item.emissoesGco2e);

        if (Number.isNaN(date.getTime()) || (kwh === null && co2 === null)) {
          return null;
        }

        return {
          timestamp: date.getTime(),
          date,
          isoDate: item.coletadoEm,
          kwh: kwh ?? 0,
          co2: co2 ?? 0,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-6);

    if (validRaw.length === 0) return [];

    const firstDay = validRaw[0].date.toDateString();
    const lastDay = validRaw[validRaw.length - 1].date.toDateString();
    const spansMultipleDays = firstDay !== lastDay;

    return validRaw.map((entry) => ({
      timestamp: entry.timestamp,
      isoDate: entry.isoDate,
      shortTimeLabel: formatAxisTick(entry.date, spansMultipleDays),
      fullDateTimeLabel: formatDateTimeFull(entry.date),
      kwh: entry.kwh,
      co2: entry.co2,
    }));
  }, [history]);

  const latestPoint = chartPoints.length > 0 ? chartPoints[chartPoints.length - 1] : null;
  const firstPoint = chartPoints.length > 0 ? chartPoints[0] : null;
  const activeChartPointIndex =
    chartPoints.length === 0
      ? null
      : activePointIndex === null || activePointIndex >= chartPoints.length
        ? chartPoints.length - 1
        : activePointIndex;

  const computedPeriodLabel = useMemo(() => {
    if (chartPoints.length >= 2 && firstPoint && latestPoint) {
      return `${firstPoint.shortTimeLabel} – ${latestPoint.shortTimeLabel}`;
    }
    if (chartPoints.length === 1 && latestPoint) {
      return `Coleta de ${latestPoint.shortTimeLabel}`;
    }
    return (
      service.period?.trim() ||
      (isIndisponivel ? 'Última leitura registrada' : 'Período atual')
    );
  }, [chartPoints, firstPoint, latestPoint, service.period, isIndisponivel]);

  const latestUpdateLabel = useMemo(() => {
    if (latestPoint) return latestPoint.fullDateTimeLabel;
    return service.lastUpdate || (isIndisponivel ? 'Indisponível' : 'Aguardando sincronização');
  }, [latestPoint, service.lastUpdate, isIndisponivel]);

  const kwhDisplay = useMemo(() => {
    if (latestPoint) {
      return {
        isAvailable: true,
        displayWithUnit: `${formatSmartNumber(latestPoint.kwh)} kWh`,
      };
    }
    return formatEnvironmentalMetric(service.kwh, 'kWh');
  }, [latestPoint, service.kwh]);

  const co2Display = useMemo(() => {
    if (latestPoint) {
      return {
        isAvailable: true,
        displayWithUnit: `${formatSmartNumber(latestPoint.co2)} gCO₂e`,
      };
    }
    return formatEnvironmentalMetric(service.co2, 'gCO₂e');
  }, [latestPoint, service.co2]);

  const computeVariation = useCallback(
    (metric: ChartMetricType) => {
      if (chartPoints.length < 2 || !firstPoint || !latestPoint) return null;
      const startVal = metric === 'kwh' ? firstPoint.kwh : firstPoint.co2;
      const endVal = metric === 'kwh' ? latestPoint.kwh : latestPoint.co2;

      if (startVal === 0 && endVal === 0) {
        return { label: '0% no período', direction: 'neutral' as const };
      }
      if (startVal === 0) {
        return { label: '▲ 100% no período', direction: 'up' as const };
      }

      const diff = ((endVal - startVal) / Math.abs(startVal)) * 100;
      const absFormatted = formatSmartNumber(Math.abs(diff), 1);
      if (diff > 0.05) {
        return { label: `▲ ${absFormatted}% no período`, direction: 'up' as const };
      }
      if (diff < -0.05) {
        return { label: `▼ ${absFormatted}% no período`, direction: 'down' as const };
      }
      return { label: '0% no período', direction: 'neutral' as const };
    },
    [chartPoints.length, firstPoint, latestPoint]
  );

  const kwhVariation = useMemo(() => computeVariation('kwh'), [computeVariation]);
  const co2Variation = useMemo(() => computeVariation('co2'), [computeVariation]);
  const activeVariation = selectedMetric === 'kwh' ? kwhVariation : co2Variation;

  const availableHardwareMetrics = useMemo(() => {
    if (history.length === 0) return DEFAULT_METRICS_ITEMS;
    const sorted = [...history].sort(
      (a, b) => new Date(b.coletadoEm).getTime() - new Date(a.coletadoEm).getTime()
    );
    const newest = sorted[0];
    const detected: string[] = [];

    if (parseNumeric(newest.cpuPercent) !== null) detected.push('CPU');
    if (parseNumeric(newest.memoriaGb) !== null) detected.push('Memória');
    if (parseNumeric(newest.discoGb) !== null) detected.push('Armazenamento');
    if (parseNumeric(newest.redeGb) !== null) detected.push('Rede');

    return detected.length > 0 ? detected : DEFAULT_METRICS_ITEMS;
  }, [history]);

  const { country, region, city } = resolveLocationParts(service);
  const countryLabel = country || 'Não informado';
  const regionLabel = region || 'Não informada';
  const cityLabel = city || 'Não informada';
  const unitLabel = selectedMetric === 'kwh' ? 'kWh' : 'gCO₂e';
  const axisYTitle = selectedMetric === 'kwh' ? 'Energia (kWh)' : 'Emissões (gCO₂e)';

  const chartGeometry = useMemo(() => {
    if (chartPoints.length === 0) return null;

    const svgWidth = 400;
    const svgHeight = 136;
    const padLeft = 48;
    const padRight = 20;
    const padTop = 22;
    const padBottom = 30;

    const plotWidth = svgWidth - padLeft - padRight;
    const plotHeight = svgHeight - padTop - padBottom;

    const values = chartPoints.map((p) => (selectedMetric === 'kwh' ? p.kwh : p.co2));
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);

    const minVal = rawMin > 0 ? Math.max(0, rawMin * 0.85) : 0;
    const maxVal = rawMax === minVal ? (rawMax === 0 ? 1 : rawMax * 1.2) : rawMax * 1.12;
    const midVal = (minVal + maxVal) / 2;

    const coords = chartPoints.map((point, idx) => {
      const val = selectedMetric === 'kwh' ? point.kwh : point.co2;
      const ratioX = chartPoints.length === 1 ? 0.5 : idx / (chartPoints.length - 1);
      const ratioY = (val - minVal) / (maxVal - minVal);

      const x = padLeft + ratioX * plotWidth;
      const y = padTop + plotHeight - ratioY * plotHeight;

      return {
        ...point,
        value: val,
        x,
        y,
        formattedValue: `${formatSmartNumber(val)} ${unitLabel}`,
      };
    });

    const polylinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const areaPath =
      coords.length > 1
        ? `M ${coords[0].x.toFixed(1)},${(padTop + plotHeight).toFixed(1)} ` +
          coords.map((c) => `L ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ') +
          ` L ${coords[coords.length - 1].x.toFixed(1)},${(padTop + plotHeight).toFixed(1)} Z`
        : '';

    return {
      svgWidth,
      svgHeight,
      padLeft,
      padRight,
      padTop,
      padBottom,
      plotHeight,
      yTicks: [
        { value: maxVal, label: formatSmartNumber(maxVal), y: padTop },
        { value: midVal, label: formatSmartNumber(midVal), y: padTop + plotHeight / 2 },
        { value: minVal, label: formatSmartNumber(minVal), y: padTop + plotHeight },
      ],
      coords,
      polylinePoints,
      areaPath,
    };
  }, [chartPoints, selectedMetric, unitLabel]);

  const inspectedPoint =
    chartGeometry &&
    activeChartPointIndex !== null &&
    chartGeometry.coords[activeChartPointIndex]
      ? chartGeometry.coords[activeChartPointIndex]
      : null;

  const renderChartSection = () => (
    <div className="self-stretch p-2.5 rounded-[10px] bg-[#0E3B25]/25 border border-[#2FA862]/70 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#F2FAF5] text-[11px] sm:text-[12px] font-medium">
            Histórico · {axisYTitle}
          </span>
          {activeVariation && (
            <span className="px-1.5 py-0.5 rounded-[6px] bg-[#1F8A4C]/30 border border-[#14C45A]/70 text-[#14C45A] text-[10px] sm:text-[11px] font-normal">
              {activeVariation.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-[#0E3B25]/45 p-[2px] rounded-[8px] border border-[#2FA862]/50">
          <button
            type="button"
            onClick={() => setSelectedMetric('kwh')}
            className={`px-2 py-0.5 rounded-[6px] text-[10px] sm:text-[11px] font-medium transition-colors cursor-pointer ${
              selectedMetric === 'kwh'
                ? 'bg-[#1F8A4C] text-[#F2FAF5]'
                : 'text-[#A6DEBD] hover:text-[#F2FAF5]'
            }`}
          >
            kWh
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric('co2')}
            className={`px-2 py-0.5 rounded-[6px] text-[10px] sm:text-[11px] font-medium transition-colors cursor-pointer ${
              selectedMetric === 'co2'
                ? 'bg-[#1F8A4C] text-[#F2FAF5]'
                : 'text-[#A6DEBD] hover:text-[#F2FAF5]'
            }`}
          >
            gCO₂e
          </button>
        </div>
      </div>

      {isLoadingHistory && (
        <div className="py-3 px-2.5 rounded-[8px] bg-[#0E3B25]/30 border border-[#2FA862]/30 flex flex-col items-center justify-center gap-1.5 text-center">
          <span className="w-4 h-4 rounded-full border-2 border-[#14C45A] border-t-transparent animate-spin" />
          <span className="text-[#DDF1E5] text-[11px]">
            Carregando histórico de medições reais...
          </span>
        </div>
      )}

      {!isLoadingHistory && historyError && (
        <div className="py-2.5 px-2.5 rounded-[8px] bg-[#5C1919]/35 border border-dashed border-[#D34A4A]/80 flex flex-col items-center justify-center gap-1.5 text-center">
          <span className="text-[#FCA5A5] text-[11px] leading-[15px]">{historyError}</span>
          <button
            type="button"
            onClick={() => void fetchServiceHistory()}
            className="px-2.5 py-1 rounded-[6px] bg-[#9C2A2A]/60 hover:bg-[#9C2A2A]/85 border border-[#F05252]/70 text-[#F2FAF5] text-[10px] sm:text-[11px] font-medium cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!isLoadingHistory && !historyError && !chartGeometry && (
        <div className="py-3 px-2.5 rounded-[8px] bg-[#0E3B25]/30 border border-[#2FA862]/30 text-center">
          <p className="text-[#DDF1E5] text-[11px] font-medium">
            Nenhuma medição histórica disponível para o período.
          </p>
          <p className="text-[#A6DEBD]/80 text-[10px] mt-0.5">
            Os pontos aparecerão assim que o coletor registrar novas leituras.
          </p>
        </div>
      )}

      {!isLoadingHistory && !historyError && chartGeometry && (
        <>
          {inspectedPoint && (
            <div className="px-2 py-1 rounded-[8px] bg-[#0E3B25]/45 border border-[#2FA862]/60 flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
              <span className="text-[#A6DEBD] truncate">
                {inspectedPoint.fullDateTimeLabel}
              </span>
              <span className="text-[#14C45A] font-bold whitespace-nowrap shrink-0">
                {inspectedPoint.formattedValue}
              </span>
            </div>
          )}

          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartGeometry.svgWidth} ${chartGeometry.svgHeight}`}
              role="img"
              aria-label={`Gráfico de ${axisYTitle} no período ${computedPeriodLabel}`}
              className="w-full h-auto block overflow-visible"
            >
              <defs>
                <linearGradient id="greenerAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14C45A" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#14C45A" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              <text x={4} y={10} fill="#A6DEBD" fontSize="8.5" fontWeight="600">
                {axisYTitle}
              </text>

              {chartGeometry.yTicks.map((tick, index) => (
                <g key={index}>
                  <line
                    x1={chartGeometry.padLeft}
                    y1={tick.y}
                    x2={chartGeometry.svgWidth - chartGeometry.padRight}
                    y2={tick.y}
                    stroke="#2FA862"
                    strokeOpacity="0.25"
                    strokeDasharray={index === chartGeometry.yTicks.length - 1 ? undefined : '2 2'}
                  />
                  <text
                    x={chartGeometry.padLeft - 6}
                    y={tick.y + 3}
                    textAnchor="end"
                    fill="#A6DEBD"
                    fontSize="8.5"
                  >
                    {tick.label}
                  </text>
                </g>
              ))}

              <line
                x1={chartGeometry.padLeft}
                y1={chartGeometry.padTop}
                x2={chartGeometry.padLeft}
                y2={chartGeometry.padTop + chartGeometry.plotHeight}
                stroke="#2FA862"
                strokeOpacity="0.6"
              />

              {chartGeometry.areaPath && (
                <path d={chartGeometry.areaPath} fill="url(#greenerAreaGrad)" />
              )}

              {chartGeometry.coords.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#14C45A"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartGeometry.polylinePoints}
                />
              )}

              {chartGeometry.coords.map((pt, idx) => {
                const isSelected = activeChartPointIndex === idx;
                const isFirst = idx === 0;
                const isLast = idx === chartGeometry.coords.length - 1;
                const placeLabelBelow = pt.y < chartGeometry.padTop + 13;
                const labelY = placeLabelBelow ? pt.y + 12 : pt.y - 6;
                const textAnchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
                const labelX = isFirst ? pt.x - 2 : isLast ? pt.x + 2 : pt.x;

                const showXTick =
                  chartGeometry.coords.length <= 4 ||
                  isFirst ||
                  isLast ||
                  idx % 2 === 0;

                return (
                  <g
                    key={pt.isoDate + idx}
                    onMouseEnter={() => setActivePointIndex(idx)}
                    onClick={() => setActivePointIndex(idx)}
                    onTouchStart={() => setActivePointIndex(idx)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <line
                        x1={pt.x}
                        y1={pt.y}
                        x2={pt.x}
                        y2={chartGeometry.padTop + chartGeometry.plotHeight}
                        stroke="#14C45A"
                        strokeOpacity="0.5"
                        strokeDasharray="2 2"
                      />
                    )}

                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor={textAnchor}
                      fill={isSelected ? '#14C45A' : '#F2FAF5'}
                      fontSize="8"
                      fontWeight={isSelected ? '700' : '600'}
                    >
                      {formatSmartNumber(pt.value)} {unitLabel}
                    </text>

                    {showXTick && (
                      <text
                        x={labelX}
                        y={chartGeometry.padTop + chartGeometry.plotHeight + 12}
                        textAnchor={textAnchor}
                        fill={isSelected ? '#F2FAF5' : '#A6DEBD'}
                        fontSize="8"
                        fontWeight={isSelected ? '600' : '400'}
                      >
                        {pt.shortTimeLabel}
                      </text>
                    )}

                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 4.5 : 3.3}
                      fill={isSelected ? '#14C45A' : '#0E3B25'}
                      stroke="#14C45A"
                      strokeWidth="2"
                    />

                    <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
                  </g>
                );
              })}

              <text
                x={(chartGeometry.padLeft + chartGeometry.svgWidth - chartGeometry.padRight) / 2}
                y={chartGeometry.svgHeight - 2}
                textAnchor="middle"
                fill="#A6DEBD"
                fontSize="8"
              >
                Horário das medições ({computedPeriodLabel})
              </text>
            </svg>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div
      translate="no"
      className="w-[min(calc(100vw-24px),440px)] max-h-[min(82dvh,620px)] overflow-y-auto p-3.5 sm:p-4 bg-[#0E3B25]/25 backdrop-blur-xl rounded-tl-none rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px] border-l border-t border-[#F2FAF5] shadow-[inset_-4px_-4px_12px_rgba(14,59,37,0.35),0_16px_36px_rgba(0,0,0,0.35)] flex flex-col justify-start items-start gap-2.5 sm:gap-3 text-[#F2FAF5] font-['Roboto',sans-serif] select-none"
    >
      {/* 1. TOPO: NOME DO SERVIÇO + BOTÃO FECHAR DO FIGMA */}
      <div className="self-stretch flex justify-between items-center gap-2.5">
        <div className="min-w-0 truncate text-[#F2FAF5] text-[17px] sm:text-[19px] font-medium leading-snug">
          {service.name}
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={!onClose}
          title="Fechar"
          aria-label="Fechar detalhes do serviço"
          className="w-[30px] h-[30px] sm:w-[33px] sm:h-[33px] relative bg-[#1F8A4C]/50 hover:bg-[#1F8A4C]/85 rounded-[12px] border border-[#2FA862] flex items-center justify-center text-[#F2FAF5] transition-colors cursor-pointer shrink-0 disabled:cursor-default"
        >
          <svg className="w-[13px] h-[13px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 2. BADGE DE ESTADO + CIDADE + ESTIMATIVA */}
      <div className="self-stretch flex justify-start items-center gap-1.5 sm:gap-2 flex-wrap">
        {isAtivo && (
          <div className="px-2 py-1 bg-[#1F8A4C]/20 rounded-[8px] border border-[#2FA862] flex justify-start items-center gap-1.5">
            <svg className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3.5" y="3.5" width="17" height="17" rx="4" strokeWidth="1.8" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8.5 12l2.5 2.5 4.5-4.5" />
            </svg>
            <span className="text-[#F7F7F5] text-[13px] sm:text-[14px] font-normal leading-tight">
              Ativo
            </span>
          </div>
        )}

        {isIndisponivel && (
          <div className="px-2 py-1 bg-[#9C2A2A]/20 rounded-[8px] border border-[#D34A4A] flex justify-start items-center gap-1.5">
            <svg className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3.5" y="3.5" width="17" height="17" rx="4" strokeWidth="1.8" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9.5 9.5l5 5m0-5l-5 5" />
            </svg>
            <span className="text-[#F7F7F5] text-[13px] sm:text-[14px] font-normal leading-tight">
              Indisponível
            </span>
          </div>
        )}

        {isSemMetricas && (
          <div className="px-2 py-1 bg-[#B8B7B8]/15 rounded-[8px] border border-[#B8B7B8] flex justify-start items-center gap-1.5">
            <svg className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3.5" y="3.5" width="17" height="17" rx="4" strokeWidth="1.8" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8 12h8" />
            </svg>
            <span className="text-[#F7F7F5] text-[13px] sm:text-[14px] font-normal leading-tight">
              Sem métricas
            </span>
          </div>
        )}

        <div className="max-w-full px-2 py-1 rounded-[8px] border border-[#2FA862] flex justify-start items-center">
          <span className="truncate text-[#F2FAF5] text-[12px] sm:text-[13px] font-normal leading-tight">
            País: {countryLabel}
          </span>
        </div>

        <div className="max-w-full px-2 py-1 rounded-[8px] border border-[#2FA862] flex justify-start items-center">
          <span className="truncate text-[#F2FAF5] text-[12px] sm:text-[13px] font-normal leading-tight">
            Região: {regionLabel}
          </span>
        </div>

        <div className="max-w-full px-2 py-1 rounded-[8px] border border-[#2FA862] flex justify-start items-center">
          <span className="truncate text-[#F2FAF5] text-[12px] sm:text-[13px] font-normal leading-tight">
            Cidade: {cityLabel}
          </span>
        </div>

        {service.isEstimated && !isSemMetricas && (
          <div
            title="Valores calculados por estimativa ambiental"
            className="px-2 py-1 bg-[#D97706]/20 rounded-[8px] border border-[#D97706] flex items-center"
          >
            <span className="text-[#FBBF24] text-[11px] font-medium leading-tight">
              Estimado
            </span>
          </div>
        )}
      </div>

      {/* VARIAÇÃO 1: ATIVO */}
      {isAtivo && (
        <>
          <div className="self-stretch grid grid-cols-2 gap-2.5">
            <div className="min-w-0 p-2.5 rounded-[10px] border border-[#14C45A] flex flex-col justify-start items-start gap-0.5">
              {kwhDisplay.isAvailable ? (
                <>
                  <div className="max-w-full truncate text-[#F2FAF5] text-[clamp(1.25rem,3.4vw,1.85rem)] font-bold leading-tight">
                    {kwhDisplay.displayWithUnit}
                  </div>
                  <div className="text-[#14C45A] text-[11px] sm:text-[12px] font-normal leading-snug truncate max-w-full">
                    {kwhVariation ? kwhVariation.label : `Período: ${computedPeriodLabel}`}
                  </div>
                </>
              ) : (
                <div className="text-[#DDF1E5]/75 text-[12px] sm:text-[13px] font-semibold">
                  Consumo indisponível
                </div>
              )}
            </div>

            <div className="min-w-0 p-2.5 rounded-[10px] border border-[#14C45A] flex flex-col justify-start items-start gap-0.5">
              {co2Display.isAvailable ? (
                <>
                  <div className="max-w-full truncate text-[#F2FAF5] text-[clamp(1.25rem,3.4vw,1.85rem)] font-bold leading-tight">
                    {co2Display.displayWithUnit}
                  </div>
                  <div className="text-[#14C45A] text-[11px] sm:text-[12px] font-normal leading-snug truncate max-w-full">
                    {co2Variation ? co2Variation.label : `Período: ${computedPeriodLabel}`}
                  </div>
                </>
              ) : (
                <div className="text-[#DDF1E5]/75 text-[12px] sm:text-[13px] font-semibold">
                  Emissão indisponível
                </div>
              )}
            </div>
          </div>

          {renderChartSection()}

          <div className="self-stretch overflow-hidden flex flex-col justify-start items-start gap-1">
            <span className="text-[#A6DEBD] text-[11px] font-normal leading-tight">
              Métricas disponíveis
            </span>
            <div className="self-stretch flex justify-start items-start gap-1.5 flex-wrap">
              {availableHardwareMetrics.map((label) => (
                <div
                  key={label}
                  className="px-2 py-0.5 rounded-[7px] border border-[#2FA862] flex justify-start items-center gap-1 shrink-0"
                >
                  <svg className="w-[12px] h-[12px] text-[#F2FAF5]" viewBox="0 0 15 15" fill="none">
                    <path
                      d="M1.5 7.5L5.5 11.5L13.5 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#F2FAF5] text-[12px] font-normal leading-snug">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[#A6DEBD] text-[11px] font-normal leading-tight">
            Última atualização: {latestUpdateLabel}
          </div>

          <button
            type="button"
            onClick={() => onOpenDashboard?.(service)}
            className="self-stretch h-[42px] sm:h-[46px] px-5 bg-[#1F8A4C] hover:bg-[#2FA862] rounded-[10px] flex justify-center items-center text-white text-[14px] sm:text-[15px] font-medium leading-tight transition-colors cursor-pointer shrink-0"
          >
            Ver dashboard completo
          </button>
        </>
      )}

      {/* VARIAÇÃO 2: INDISPONÍVEL */}
      {isIndisponivel && (
        <>
          <div className="self-stretch p-2.5 bg-[#4A1414]/45 rounded-[10px] border border-dashed border-[#B73B3B] flex items-center gap-2">
            <div className="w-[18px] h-[18px] bg-[#C83737] rounded-full flex justify-center items-center shrink-0">
              <span className="text-[#F7F7F5] text-[11px] font-bold leading-none">!</span>
            </div>
            <span className="text-[#F2FAF5] text-[12px] sm:text-[13px] font-normal leading-snug">
              {latestPoint
                ? `Sem conexão desde ${latestPoint.fullDateTimeLabel}`
                : service.lastUpdate
                ? `Sem conexão desde ${service.lastUpdate}`
                : 'Serviço sem conexão ativa'}
            </span>
          </div>

          <div className="self-stretch flex flex-col gap-1">
            <span className="text-[#A6DEBD] text-[11px] font-normal leading-tight">
              Valores da última atualização
            </span>
            <div className="self-stretch grid grid-cols-2 gap-2.5">
              <div className="min-w-0 p-2.5 rounded-[10px] border border-[#B73B3B] flex flex-col justify-center items-center text-center">
                {kwhDisplay.isAvailable ? (
                  <span className="max-w-full truncate text-[#F2FAF5] text-[clamp(1.25rem,3.4vw,1.85rem)] font-bold leading-tight">
                    {kwhDisplay.displayWithUnit}
                  </span>
                ) : (
                  <span className="text-[#F2FAF5]/75 text-[12px] sm:text-[13px] font-medium">
                    Consumo indisponível
                  </span>
                )}
              </div>
              <div className="min-w-0 p-2.5 rounded-[10px] border border-[#B73B3B] flex flex-col justify-center items-center text-center">
                {co2Display.isAvailable ? (
                  <span className="max-w-full truncate text-[#F2FAF5] text-[clamp(1.25rem,3.4vw,1.85rem)] font-bold leading-tight">
                    {co2Display.displayWithUnit}
                  </span>
                ) : (
                  <span className="text-[#F2FAF5]/75 text-[12px] sm:text-[13px] font-medium">
                    Emissão indisponível
                  </span>
                )}
              </div>
            </div>
          </div>

          {renderChartSection()}

          <div className="self-stretch overflow-hidden flex flex-col justify-start items-start gap-1">
            <span className="text-[#A6DEBD] text-[11px] font-normal leading-tight">
              Métricas disponíveis
            </span>
            <div className="self-stretch flex justify-start items-start gap-1.5 flex-wrap">
              {availableHardwareMetrics.map((label) => (
                <div
                  key={label}
                  className="px-2 py-0.5 rounded-[7px] border border-[#2FA862] flex justify-start items-center gap-1 shrink-0"
                >
                  <svg className="w-[12px] h-[12px] text-[#F2FAF5]" viewBox="0 0 15 15" fill="none">
                    <path
                      d="M1.5 7.5L5.5 11.5L13.5 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#F2FAF5] text-[12px] font-normal leading-snug">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[#A6DEBD] text-[11px] font-normal leading-tight">
            Última atualização: {latestUpdateLabel}
          </div>

          <button
            type="button"
            onClick={() => onOpenDashboard?.(service)}
            className="self-stretch h-[42px] sm:h-[46px] px-5 bg-[#1F8A4C] hover:bg-[#2FA862] rounded-[10px] flex justify-center items-center text-white text-[14px] sm:text-[15px] font-medium leading-tight transition-colors cursor-pointer shrink-0"
          >
            Ver dashboard completo
          </button>
        </>
      )}

      {/* VARIAÇÃO 3: SEM MÉTRICAS */}
      {isSemMetricas && (
        <>
          <div className="self-stretch flex flex-col justify-start items-start gap-1">
            <span className="text-[#A6DEBD] text-[11px] font-normal leading-tight">
              Métricas disponíveis
            </span>
            <div className="px-2 py-0.5 rounded-[7px] border border-[#2FA862] inline-flex items-center">
              <span className="text-[#F2FAF5] text-[12px] font-normal leading-snug">
                – Nenhuma métrica recebida
              </span>
            </div>
          </div>

          <div className="self-stretch py-5 px-3.5 bg-[#0E3B25]/25 rounded-[10px] border border-[#2FA862]/60 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-[32px] h-[32px] rounded-full bg-[#3A4D43]/45 border border-[#8FA89B]/40 flex items-center justify-center">
              <div className="w-[12px] h-[2px] bg-[#D4E3DA] rounded-full" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[#F2FAF5] text-[14px] font-medium leading-snug">
                Este serviço ainda não envia dados
              </span>
              <span className="text-[#A6DEBD]/85 text-[12px] font-normal leading-snug">
                Verifique o sensor ou veja os detalhes no dashboard.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenDashboard?.(service)}
            className="self-stretch h-[42px] sm:h-[46px] px-5 bg-transparent hover:bg-[#1F8A4C]/25 rounded-[10px] border border-[#2FA862] flex justify-center items-center text-white text-[14px] sm:text-[15px] font-medium leading-tight transition-colors cursor-pointer shrink-0"
          >
            Ver dashboard completo
          </button>
        </>
      )}
    </div>
  );
};