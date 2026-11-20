import React, { useState, useMemo, useRef, useEffect } from 'react';

import { ServiceModal } from '../components/ServiceModal';

import type { ModalServiceData } from '../components/ServiceModal';

import { formatIntervalLabel } from '../hooks/useServicesPolling';

import {
  useDashboardSummary,
  type DashboardService,
  type DashboardSummary,
} from '../hooks/useDashboardSummary';

import { PollingStatusBanner } from '../components/PollingStatusBanner';

import { ServiceComparisonPage } from './ServiceComparisonPage';

import { formatEnvironmentalMetric } from '../utils/environmentalMetrics';
import {
  resolveServiceFilterKey,
  STATUS_CONFIG,
  type ServiceFilterKey,
} from '../config/statusConfig';


type ServiceStatus = 'Ativo' | 'Indisponível' | 'Sem métricas';

interface DashboardServiceRow {
  id: string;
  name: string;
  location: string;
  country: string;
  region: string;
  city: string;
  status: ServiceStatus;
  statusKey: ServiceFilterKey;
  consumptionKwh: number | null;
  emissionsGco2e: number | null;
  collectedAt: string | null;
}

interface DemoDashboardServiceRow {
  numericId: number;
  code: string;
  subId: string;
  location: string;
  country: string;
  region: string;
  state: string;
  city: string;
  status: ServiceStatus;
  consumptionKwh: number | null;
  consumptionLabel: string;
  emissionKg: number | null;
  emissionLabel: string;
  series: number[];
}

export interface DashboardPageProps {
  onOpenRanking?: () => void;
}

const SIMULATED_CHART_DATA: DemoDashboardServiceRow[] = [
  {
    numericId: 41,
    code: 'ASTAH-XYZ',
    subId: 'ID 0041',
    location: 'São Francisco - EUA',
    country: 'Estados Unidos',
    region: 'América do Norte',
    state: 'Califórnia',
    city: 'São Francisco',
    status: 'Ativo',
    consumptionKwh: 1240,
    consumptionLabel: '1.240',
    emissionKg: 459,
    emissionLabel: '459',
    series: [35, 42, 43, 35, 36, 44, 42, 43, 43],
  },
  {
    numericId: 102,
    code: 'ASTAH-ABC',
    subId: 'ID 0102',
    location: 'São Paulo - BR',
    country: 'Brasil',
    region: 'Sudeste',
    state: 'São Paulo',
    city: 'São Paulo',
    status: 'Ativo',
    consumptionKwh: 1105,
    consumptionLabel: '1.105',
    emissionKg: 88,
    emissionLabel: '88',
    series: [32, 31, 30, 32, 35, 33, 34, 34, 34],
  },
  {
    numericId: 87,
    code: 'ASTAH-DEF',
    subId: 'ID 0087',
    location: 'Berlim - DE',
    country: 'Alemanha',
    region: 'Europa Central',
    state: 'Berlim',
    city: 'Berlim',
    status: 'Ativo',
    consumptionKwh: 962,
    consumptionLabel: '962',
    emissionKg: 366,
    emissionLabel: '366',
    series: [28, 25, 22, 27, 26, 23, 24, 23, 25],
  },
  {
    numericId: 230,
    code: 'ASTAH-GHI',
    subId: 'ID 0230',
    location: 'Sydney - AU',
    country: 'Austrália',
    region: 'Oceania',
    state: 'Nova Gales do Sul',
    city: 'Sydney',
    status: 'Ativo',
    consumptionKwh: 874,
    consumptionLabel: '874',
    emissionKg: 481,
    emissionLabel: '481',
    series: [19, 17, 17, 19, 18, 17, 17, 16, 17],
  },
  {
    numericId: 315,
    code: 'ASTAH-JKL',
    subId: 'ID 0315',
    location: 'Toronto - CA',
    country: 'Canadá',
    region: 'América do Norte',
    state: 'Ontário',
    city: 'Toronto',
    status: 'Ativo',
    consumptionKwh: 731,
    consumptionLabel: '731',
    emissionKg: 88,
    emissionLabel: '88',
    series: [12, 12, 11, 13, 12, 11, 10, 9, 10],
  },
  {
    numericId: 412,
    code: 'ASTAH-MNO',
    subId: 'ID 0412',
    location: 'Lisboa - PT',
    country: 'Portugal',
    region: 'Europa Ocidental',
    state: 'Lisboa',
    city: 'Lisboa',
    status: 'Ativo',
    consumptionKwh: 640,
    consumptionLabel: '640',
    emissionKg: 96,
    emissionLabel: '96',
    series: [21, 22, 20, 21, 23, 22, 21, 22, 22],
  },
  {
    numericId: 455,
    code: 'ASTAH-PQR',
    subId: 'ID 0455',
    location: 'Tóquio - JP',
    country: 'Japão',
    region: 'Ásia Oriental',
    state: 'Tóquio',
    city: 'Tóquio',
    status: 'Indisponível',
    consumptionKwh: 512,
    consumptionLabel: '512 (último)',
    emissionKg: 236,
    emissionLabel: '236 (último)',
    series: [15, 14, 15, 12, 8, 4, 2, 1, 0],
  },
  {
    numericId: 501,
    code: 'ASTAH-STU',
    subId: 'ID 0501',
    location: 'Cidade do México - MX',
    country: 'México',
    region: 'América do Norte',
    state: 'Cidade do México',
    city: 'Cidade do México',
    status: 'Sem métricas',
    consumptionKwh: null,
    consumptionLabel: '-',
    emissionKg: null,
    emissionLabel: '-',
    series: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
];

function formatCollectionPeriod(summary: DashboardSummary): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
  const dates = [summary.periodo_inicio, summary.periodo_fim]
    .map(value => (value ? new Date(value) : null))
    .filter((date): date is Date => date !== null && Number.isFinite(date.getTime()));

  if (dates.length === 0) return 'Nenhuma coleta registrada';
  if (dates.length === 1 || dates[0].getTime() === dates[1].getTime()) {
    return formatter.format(dates[0]);
  }
  return `${formatter.format(dates[0])} – ${formatter.format(dates[1])}`;
}

const SERIES_COLORS = [
  { stroke: '#2FA862', border: 'border-[#2FA862]' },
  { stroke: '#3B82F6', border: 'border-[#3B82F6]' },
  { stroke: '#EAB308', border: 'border-[#EAB308]' },
  { stroke: '#F35B1B', border: 'border-[#F35B1B]' },
  { stroke: '#E05252', border: 'border-[#E05252]' },
];

function mapApiServiceToRow(service: DashboardService): DashboardServiceRow {
  const latest = service.ultima_coleta;
  const apiStatusKey = resolveServiceFilterKey(service.status);
  const statusKey: ServiceFilterKey =
    apiStatusKey === 'ativo' && latest?.potencia_watts == null
      ? 'sem_metricas'
      : apiStatusKey;
  const status = STATUS_CONFIG[statusKey].label;
  const country = service.regiao?.pais ?? '';
  const region = service.regiao?.regiao ?? '';
  const city = service.regiao?.cidade ?? '';
  const location = [city, region, country].filter(Boolean).join(' - ');

  return {
    id: service.id,
    name: service.nome || service.id,
    location: location || 'Localização não informada',
    country,
    region,
    city,
    status,
    statusKey,
    consumptionKwh: latest?.energia_kwh ?? null,
    emissionsGco2e: latest?.emissoes_gco2e ?? null,
    collectedAt: latest?.coletado_em ?? null,
  };
}

function isServiceFilterKey(value: string): value is ServiceFilterKey {
  return value === 'ativo' || value === 'indisponível' || value === 'sem_metricas';
}

function mapServiceRowToModalData(row: DashboardServiceRow): ModalServiceData {
  const normalizedStatus: ModalServiceData['status'] =
    row.status === 'Ativo'
      ? 'ativo'
      : row.status === 'Indisponível'
      ? 'indisponível'
      : 'sem_metricas';

  return {
    id: row.id,
    name: row.name,
    status: normalizedStatus,
    location: row.location,
    kwh: row.consumptionKwh,
    co2: row.emissionsGco2e,
    lastUpdate: row.collectedAt ?? undefined,
  };
}

function formatCollectedAt(value: string | null): string {
  if (!value) return 'Sem leitura';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('pt-BR') : 'Data inválida';
}

function buildSmoothSvgPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

interface CustomFilterSelectProps {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ label: string; value: string }>;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  minWidthClass?: string;
}

const CustomFilterSelect: React.FC<CustomFilterSelectProps> = ({
  label,
  value,
  placeholder,
  options,
  isOpen,
  onToggle,
  onSelect,
  minWidthClass = 'w-full',
}) => {
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`relative ${minWidthClass}`}>
      <label className="block text-xs font-medium text-[#D4E3DA] mb-1.5">{label}</label>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 bg-[#0B1C12] border-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F2FAF5] transition-colors cursor-pointer ${
          isOpen
            ? 'border-[#F2FAF5]'
            : 'border-[#4A6B57] hover:border-[#F2FAF5] focus:border-[#F2FAF5]'
        }`}
      >
        <span className="truncate">{displayLabel}</span>
        <svg
          className={`w-3.5 h-3.5 text-[#F2FAF5] shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 9.5L1.5 3h9L6 9.5z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-30 bg-[#0D2115] border-2 border-[#4A6B57] rounded-xl p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.85)] space-y-1.5 max-h-64 overflow-y-auto min-w-[180px]">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value || '__all__'}
                type="button"
                onClick={() => onSelect(opt.value)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs sm:text-sm transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#F2FAF5] border-[#F2FAF5] text-[#07150E] font-semibold'
                    : 'bg-[#0B1C12] border-[#385E47] text-[#D4E3DA] hover:bg-[#F2FAF5] hover:border-[#F2FAF5] hover:text-[#07150E] hover:font-medium'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DashboardStatusPill: React.FC<{ status: ServiceStatus }> = ({ status }) => {
  const config: Record<ServiceStatus, { bgBorder: string; icon: React.ReactNode }> = {
    Ativo: {
      bgBorder: 'bg-[#2FA862] border-[#14C45A]',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.2l2.3 2.3 4.7-4.8" />
        </svg>
      ),
    },
    Indisponível: {
      bgBorder: 'bg-[#9E2B25] border-[#F35B1B]',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5l5 5m0-5l-5 5" />
        </svg>
      ),
    },
    'Sem métricas': {
      bgBorder: 'bg-[#46524B] border-[#B5BDB8]',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12h7" />
        </svg>
      ),
    },
  };

  const current = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 text-xs font-medium text-[#F2FAF5] whitespace-nowrap ${current.bgBorder}`}
    >
      {current.icon}
      <span>{status}</span>
    </span>
  );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenRanking }) => {
  const [isComparingServices, setIsComparingServices] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceFilterKey | ''>('');
  const [cityQuery, setCityQuery] = useState('');
  const [openFilterMenu, setOpenFilterMenu] = useState<
    'country' | 'region' | 'status' | 'city' | null
  >(null);

  const [selectedServiceCodes, setSelectedServiceCodes] = useState<string[]>([
    'ASTAH-XYZ',
    'ASTAH-ABC',
    'ASTAH-DEF',
    'ASTAH-GHI',
    'ASTAH-JKL',
  ]);

  const [sortMode, setSortMode] = useState<'alpha' | 'value'>('value');
  const [sortMetric, setSortMetric] = useState<'emission' | 'energy'>('energy');
  const [selectedServiceModal, setSelectedServiceModal] = useState<ModalServiceData | null>(null);

  const [chartTooltip, setChartTooltip] = useState<{
    serviceCode: string;
    value: number;
    minutes: number;
    x: number;
    y: number;
    color: string;
  } | null>(null);

  const filtersContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    lastUpdate,
    isPaused,
    isRefreshing,
    hasError,
    isStale,
    togglePause,
    triggerRefresh,
    summary,
    services,
    isInitialLoad,
    pollingIntervalSeconds,
  } = useDashboardSummary();

  const indicatorCards = [
    {
      title: 'Energia total',
      value: summary
        ? formatEnvironmentalMetric(summary.consumo_total_acumulado_kwh, 'kWh').displayWithUnit
        : isInitialLoad
          ? 'Carregando…'
          : 'Indisponível'
    },
    {
      title: 'Emissão total',
      value: summary
        ? formatEnvironmentalMetric(summary.emissoes_total_acumuladas_gco2e, 'gCO₂e').displayWithUnit
        : isInitialLoad
          ? 'Carregando…'
          : 'Indisponível'
    },
    {
      title: 'Serviços ativos',
      value: summary ? summary.disponiveis.toLocaleString('pt-BR') : '—'
    },
    {
      title: 'Serviços indisponíveis',
      value: summary ? summary.indisponiveis.toLocaleString('pt-BR') : '—'
    }
  ];

  const currentDateLabel = new Date().toLocaleDateString('pt-BR');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideGeo = filtersContainerRef.current?.contains(target);
      if (!insideGeo) {
        setOpenFilterMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dashboardServices = useMemo(() => services.map(mapApiServiceToRow), [services]);

  const countryOptions = useMemo(() => [
    { label: 'Todos os países', value: '' },
    ...Array.from(new Set(dashboardServices.map(service => service.country).filter(Boolean))).map(
      country => ({ label: country, value: country })
    ),
  ], [dashboardServices]);

  const regionOptions = useMemo(() => [
    { label: 'Todas as regiões', value: '' },
    ...Array.from(new Set(dashboardServices.map(service => service.region).filter(Boolean))).map(
      region => ({ label: region, value: region })
    ),
  ], [dashboardServices]);

  const statusOptions = useMemo(() => {
    const availableStatuses = Array.from(new Set(dashboardServices.map(service => service.statusKey)));
    return [
      { label: 'Todos os status', value: '' },
      ...availableStatuses.map(status => ({
        label: STATUS_CONFIG[status].label,
        value: status,
      })),
    ];
  }, [dashboardServices]);

  const activeStatusFilter = statusOptions.some(option => option.value === statusFilter)
    ? statusFilter
    : '';

  const filteredCityOptions = useMemo(() => {
    const q = cityQuery.toLowerCase().trim();
    const cities = Array.from(new Set(dashboardServices.map(service => service.city).filter(Boolean)));
    if (!q) return cities.slice(0, 5);
    return cities.filter(city => city.toLowerCase().includes(q));
  }, [cityQuery, dashboardServices]);

  const filteredServices = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const cityTerm = cityQuery.toLowerCase().trim();

    const filtered = dashboardServices.filter((row) => {
      const matchesSearch =
        !term ||
        row.name.toLowerCase().includes(term) ||
        row.id.toLowerCase().includes(term) ||
        row.location.toLowerCase().includes(term);
      const matchesCountry = !countryFilter || row.country === countryFilter;
      const matchesRegion = !regionFilter || row.region === regionFilter;
      const matchesStatus = !activeStatusFilter || row.statusKey === activeStatusFilter;
      const matchesCity = !cityTerm || row.city.toLowerCase().includes(cityTerm);

      return matchesSearch && matchesCountry && matchesRegion && matchesStatus && matchesCity;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      const valA = sortMetric === 'energy' ? (a.consumptionKwh ?? -1) : (a.emissionsGco2e ?? -1);
      const valB = sortMetric === 'energy' ? (b.consumptionKwh ?? -1) : (b.emissionsGco2e ?? -1);
      return valB - valA;
    });
  }, [
    dashboardServices,
    searchTerm,
    countryFilter,
    regionFilter,
    activeStatusFilter,
    cityQuery,
    sortMode,
    sortMetric,
  ]);

  const selectedServicesForChart = useMemo(
    () =>
      selectedServiceCodes
        .map((code) => SIMULATED_CHART_DATA.find((service) => service.code === code))
        .filter((item): item is DemoDashboardServiceRow => Boolean(item)),
    [selectedServiceCodes]
  );

  const toggleServiceSelection = (code: string) => {
    setSelectedServiceCodes((prev) => {
      if (prev.includes(code)) {
        return prev.filter((item) => item !== code);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, code];
    });
  };

  const clearAllFilters = () => {
    setCountryFilter('');
    setRegionFilter('');
    setStatusFilter('');
    setCityQuery('');
    setSearchTerm('');
    setOpenFilterMenu(null);
  };

  const handleExportCsv = () => {
    const header =
      'Serviço,ID,Localização,Status,Energia da última coleta (kWh),Emissão da última coleta (gCO2e),Coletado em\n';
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = filteredServices
      .map(service => [
        service.name,
        service.id,
        service.location,
        service.status,
        formatEnvironmentalMetric(service.consumptionKwh, 'kWh').formattedValue,
        formatEnvironmentalMetric(service.emissionsGco2e, 'gCO₂e').formattedValue,
        service.collectedAt ?? '',
      ].map(escapeCsv).join(','))
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `greener-dashboard-${currentDateLabel.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const chartLeft = 72;
  const chartRight = 895;
  const chartTop = 24;
  const chartBottom = 204;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;
  const maxVal = 60;

  if (isComparingServices) {
    return <ServiceComparisonPage onBack={() => setIsComparingServices(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#07150E] text-[#F2FAF5] p-4 sm:p-6 md:p-8 font-sans pb-24 md:pb-20">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 sm:mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-[#F2FAF5]">Dashboards</h1>

          <div className="mt-2 mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsComparingServices(true)}
              className="min-h-10 rounded-lg border border-[#2FA862] bg-[#1F8A4C]/30 px-3 py-2 text-sm font-semibold text-[#F2FAF5] transition-colors hover:bg-[#1F8A4C]/60 cursor-pointer"
            >
              Comparar serviços
            </button>

            {onOpenRanking && (
              <button
                type="button"
                onClick={onOpenRanking}
                className="min-h-10 rounded-lg border border-[#2FA862] bg-[#0D2115] px-3 py-2 text-sm font-semibold text-[#F2FAF5] transition-colors hover:bg-[#1F8A4C]/40 cursor-pointer"
              >
                Ranking de impacto
              </button>
            )}
          </div>

          <h2 className="text-base sm:text-xl font-semibold mb-1.5 text-[#F2FAF5]">
            Resultados cumulativos
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-[#9DB0A4] text-xs sm:text-sm">
            <span>
              Última atualização:{' '}
              <span className="text-[#D4E3DA]">
                {lastUpdate === '—' ? '—' : `${currentDateLabel} ${lastUpdate}`}
              </span>{' '}
              · atualiza a cada {formatIntervalLabel(pollingIntervalSeconds)}
            </span>

            {isRefreshing && (
              <span className="inline-flex items-center gap-1.5 text-[#14C45A] text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14C45A] animate-ping" />
                Sincronizando...
              </span>
            )}

            <button
              type="button"
              onClick={togglePause}
              className="text-xs underline text-[#B5BDB8] hover:text-white cursor-pointer"
            >
              {isPaused ? 'Retomar' : 'Pausar'}
            </button>
          </div>
        </div>

        {/* Campo de busca */}
        <div className="relative w-full lg:w-80">
          <svg
            className="w-5 h-5 absolute left-3.5 top-2.5 text-[#F2FAF5]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquise por um serviço aqui"
            className="bg-[#0B1C12] border-2 border-[#4A6B57] rounded-xl pl-11 pr-4 py-2.5 w-full text-xs sm:text-sm focus:outline-none focus:border-[#F2FAF5] hover:border-[#F2FAF5] text-[#F2FAF5] placeholder-[#9DB0A4] transition-colors"
          />
        </div>
      </div>

      {/* Banner de status de polling */}
      <PollingStatusBanner
        hasError={hasError}
        isStale={isStale}
        isRefreshing={isRefreshing}
        lastUpdate={lastUpdate}
        hasData={summary !== null}
        onRetry={triggerRefresh}
      />

      {/* Indicadores consolidados */}
      <div className="mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-[#F2FAF5] mb-3.5">
          Indicadores consolidados
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {indicatorCards.map((card) => (
            <article
              key={card.title}
              aria-label={card.title}
              className="min-w-0 bg-[#0D2115] border-2 border-[#385E47] hover:border-[#2FA862] p-4 sm:p-5 rounded-2xl transition-colors"
            >
              <h4 className="text-[#D4E3DA] text-xs sm:text-sm font-medium mb-2">
                {card.title}
              </h4>
              <div className="text-2xl sm:text-3xl font-bold text-[#F2FAF5] mb-2 break-words">
                {card.value}
              </div>
            </article>
          ))}
        </div>

        {summary ? (
          <div className="mt-3 space-y-1 text-[11px] sm:text-xs text-[#9DB0A4]">
            <p>
              Período das coletas: {formatCollectionPeriod(summary)} · janela de{' '}
              {formatIntervalLabel(summary.janela_amostragem_segundos)}
            </p>
            <p role={summary.cobertura_parcial ? 'status' : undefined}>
              {summary.cobertura_parcial
                ? `Totais parciais: métricas disponíveis para ${summary.servidores_com_metricas} de ${summary.total_servidores} serviços; ${summary.servidores_sem_metricas} sem métricas.`
                : summary.total_servidores === 0
                  ? 'Nenhum serviço retornou dados nesta janela.'
                  : `Cobertura completa: ${summary.servidores_com_metricas} de ${summary.total_servidores} serviços com métricas.`}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-[11px] sm:text-xs text-[#9DB0A4]">
            {isInitialLoad
              ? 'Carregando período e cobertura dos indicadores…'
              : 'Período e cobertura indisponíveis sem resposta da API.'}
          </p>
        )}

        <p className="mt-2 text-[11px] sm:text-xs text-[#9DB0A4]">
          Indicadores e lista de serviços vêm da API. As séries do gráfico de uso são apenas uma demonstração simulada.
        </p>
      </div>

      {/* Barra de Filtros Geográficos padronizados */}
      <div
        ref={filtersContainerRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end mb-7"
      >
        <div className="lg:col-span-2">
          <CustomFilterSelect
            label="País"
            value={countryFilter}
            placeholder="Todos os países"
            options={countryOptions}
            isOpen={openFilterMenu === 'country'}
            onToggle={() =>
              setOpenFilterMenu((prev) => (prev === 'country' ? null : 'country'))
            }
            onSelect={(val) => {
              setCountryFilter(val);
              setOpenFilterMenu(null);
            }}
          />
        </div>

        <div className="lg:col-span-2">
          <CustomFilterSelect
            label="Região"
            value={regionFilter}
            placeholder="Todas as regiões"
            options={regionOptions}
            isOpen={openFilterMenu === 'region'}
            onToggle={() =>
              setOpenFilterMenu((prev) => (prev === 'region' ? null : 'region'))
            }
            onSelect={(val) => {
              setRegionFilter(val);
              setOpenFilterMenu(null);
            }}
          />
        </div>

        <div className="lg:col-span-2">
          <CustomFilterSelect
            label="Status"
            value={activeStatusFilter}
            placeholder="Todos os status"
            options={statusOptions}
            isOpen={openFilterMenu === 'status'}
            onToggle={() =>
              setOpenFilterMenu((prev) => (prev === 'status' ? null : 'status'))
            }
            onSelect={(value) => {
              setStatusFilter(isServiceFilterKey(value) ? value : '');
              setOpenFilterMenu(null);
            }}
          />
        </div>

        <div className="relative lg:col-span-3">
          <label className="block text-xs font-medium text-[#D4E3DA] mb-1.5">Cidade</label>
          <div className="relative">
            <input
              type="text"
              value={cityQuery}
              onFocus={() => setOpenFilterMenu('city')}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setOpenFilterMenu('city');
              }}
              placeholder="Digite uma cidade"
              className={`w-full bg-[#0B1C12] border-2 rounded-xl pl-3.5 pr-9 py-2.5 text-xs sm:text-sm text-[#F2FAF5] placeholder-[#9DB0A4] focus:outline-none transition-colors ${
                openFilterMenu === 'city'
                  ? 'border-[#F2FAF5]'
                  : 'border-[#4A6B57] hover:border-[#F2FAF5] focus:border-[#F2FAF5]'
              }`}
            />
            <button
              type="button"
              aria-label="Alternar lista de cidades"
              onClick={() =>
                setOpenFilterMenu((prev) => (prev === 'city' ? null : 'city'))
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F2FAF5] cursor-pointer"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${
                  openFilterMenu === 'city' ? 'rotate-180' : ''
                }`}
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <path d="M6 9.5L1.5 3h9L6 9.5z" />
              </svg>
            </button>
          </div>

          {openFilterMenu === 'city' && filteredCityOptions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 z-30 bg-[#0D2115] border-2 border-[#4A6B57] rounded-xl p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.85)] space-y-1.5 max-h-64 overflow-y-auto">
              {filteredCityOptions.map((city) => {
                const isSelected = cityQuery.toLowerCase() === city.toLowerCase();
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setCityQuery(city);
                      setOpenFilterMenu(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs sm:text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#F2FAF5] border-[#F2FAF5] text-[#07150E] font-semibold'
                        : 'bg-[#0B1C12] border-[#385E47] text-[#D4E3DA] hover:bg-[#F2FAF5] hover:border-[#F2FAF5] hover:text-[#07150E] hover:font-medium'
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between lg:justify-end gap-4 pt-1">
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs sm:text-sm underline text-[#D4E3DA] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Limpar filtros
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 bg-[#1F8A4C] hover:bg-[#2FA862] border-2 border-[#14C45A] text-[#F2FAF5] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Exportar</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v11m0-11l-4 4m4-4l4 4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Card: Uso em tempo real */}
      <div className="bg-[#0D2115] border-2 border-[#385E47] p-5 sm:p-6 rounded-2xl mb-7">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-lg sm:text-xl text-[#F2FAF5]">
              Demonstração de uso em tempo real
            </h3>
            <p className="text-[#9DB0A4] text-xs sm:text-sm mt-0.5">
              Séries simuladas de consumo · não representam os serviços listados
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-[#0B1C12] border-2 border-[#385E47] text-xs text-[#9DB0A4] font-medium">
              {selectedServicesForChart.length} de 5 serviços
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B1C12] border-2 border-[#385E47] text-xs text-[#D4E3DA] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
              Dados simulados
            </span>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-4">
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold text-[#F2FAF5]">kWh</span>
            <span className="text-xs sm:text-sm text-[#9DB0A4]">
              total dos {selectedServicesForChart.length} serviços
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedServicesForChart.map((svc, idx) => {
              const colorSet = SERIES_COLORS[idx % SERIES_COLORS.length];
              return (
                <button
                  key={svc.code}
                  type="button"
                  onClick={() => toggleServiceSelection(svc.code)}
                  aria-label={`Remover ${svc.code} da demonstração`}
                  title="Clique para remover da demonstração simulada"
                  className={`px-3 py-1 rounded-lg bg-[#0B1C12] border-2 ${colorSet.border} text-xs font-semibold text-[#F2FAF5] hover:bg-[#152E1F] transition-colors cursor-pointer`}
                >
                  {svc.code}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gráfico de linhas comparativo SVG */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 920 270"
            preserveAspectRatio="xMidYMid meet"
            onMouseLeave={() => setChartTooltip(null)}
            className="block w-full min-w-[680px] h-auto select-none"
          >
            <style>
              {`
                @keyframes dashboardLineDraw {
                  from { stroke-dashoffset: 1; }
                  to { stroke-dashoffset: 0; }
                }
              `}
            </style>

            <text
              x="17"
              y={(chartTop + chartBottom) / 2}
              transform={`rotate(-90 17 ${(chartTop + chartBottom) / 2})`}
              textAnchor="middle"
              fill="#D4E3DA"
              fontSize="12"
              fontWeight="600"
            >
              Consumo (kWh)
            </text>

            {[0, 15, 30, 45, 60].map((tick) => {
              const y = chartBottom - (tick / maxVal) * chartHeight;
              return (
                <g key={tick}>
                  <text
                    x={chartLeft - 12}
                    y={y + 4}
                    textAnchor="end"
                    fill="#9DB0A4"
                    fontSize="12"
                  >
                    {tick}
                  </text>
                  <line
                    x1={chartLeft}
                    y1={y}
                    x2={chartRight}
                    y2={y}
                    stroke={tick === 0 ? '#4A6B57' : '#294434'}
                    strokeWidth={tick === 0 ? 1.5 : 1}
                  />
                </g>
              );
            })}

            {[
              { label: '60 min', ratio: 0 },
              { label: '45 min', ratio: 0.25 },
              { label: '30 min', ratio: 0.5 },
              { label: '15 min', ratio: 0.75 },
              { label: 'Agora', ratio: 1 },
            ].map((tick) => {
              const x = chartLeft + tick.ratio * chartWidth;
              return (
                <g key={tick.label}>
                  <line
                    x1={x}
                    y1={chartBottom}
                    x2={x}
                    y2={chartBottom + 5}
                    stroke="#4A6B57"
                  />
                  <text
                    x={x}
                    y={chartBottom + 21}
                    textAnchor={
                      tick.ratio === 0
                        ? 'start'
                        : tick.ratio === 1
                        ? 'end'
                        : 'middle'
                    }
                    fill="#9DB0A4"
                    fontSize="12"
                  >
                    {tick.label}
                  </text>
                </g>
              );
            })}

            <text
              x={(chartLeft + chartRight) / 2}
              y="257"
              textAnchor="middle"
              fill="#D4E3DA"
              fontSize="12"
              fontWeight="600"
            >
              Tempo (últimos 60 minutos)
            </text>

            {selectedServicesForChart.map((svc, idx) => {
              const colorSet = SERIES_COLORS[idx % SERIES_COLORS.length];
              const coords = svc.series.map((val, pointIdx) => ({
                x:
                  chartLeft +
                  (pointIdx / Math.max(svc.series.length - 1, 1)) *
                    chartWidth,
                y:
                  chartBottom -
                  (Math.min(maxVal, Math.max(0, val)) / maxVal) *
                    chartHeight,
              }));

              const lastPoint = coords[coords.length - 1];

              return (
                <g key={svc.code}>
                  <path
                    d={buildSmoothSvgPath(coords)}
                    fill="none"
                    stroke={colorSet.stroke}
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength="1"
                    strokeDasharray="1"
                    strokeDashoffset="1"
                    style={{
                      animation:
                        'dashboardLineDraw 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
                    }}
                  />

                  {coords.map((point, pointIdx) => {
                    const minutesAgo =
                      60 -
                      Math.round(
                        (pointIdx / Math.max(svc.series.length - 1, 1)) * 60
                      );

                    const showPointTooltip = () =>
                      setChartTooltip({
                        serviceCode: svc.code,
                        value: svc.series[pointIdx],
                        minutes: minutesAgo,
                        x: point.x,
                        y: point.y,
                        color: colorSet.stroke,
                      });

                    return (
                      <circle
                        key={`${svc.code}-${pointIdx}`}
                        cx={point.x}
                        cy={point.y}
                        r="9"
                        fill="transparent"
                        className="cursor-pointer"
                        tabIndex={0}
                        role="button"
                        aria-label={`${svc.code}: ${svc.series[pointIdx]} kWh, ${minutesAgo} minutos atrás`}
                        onMouseEnter={showPointTooltip}
                        onMouseLeave={() => setChartTooltip(null)}
                        onFocus={showPointTooltip}
                        onBlur={() => setChartTooltip(null)}
                        onClick={showPointTooltip}
                      />
                    );
                  })}

                  {lastPoint && (
                    <circle
                      cx={lastPoint.x}
                      cy={lastPoint.y}
                      r="4.5"
                      fill="#F2FAF5"
                      stroke={colorSet.stroke}
                      strokeWidth="2.5"
                      pointerEvents="none"
                    />
                  )}
                </g>
              );
            })}

            {chartTooltip && (
              <g pointerEvents="none">
                {(() => {
                  const tooltipX = Math.max(
                    chartLeft + 78,
                    Math.min(chartTooltip.x, chartRight - 78)
                  );
                  const tooltipY = Math.max(
                    chartTop + 30,
                    chartTooltip.y - 38
                  );

                  return (
                    <>
                      <line
                        x1={chartTooltip.x}
                        y1={chartTop}
                        x2={chartTooltip.x}
                        y2={chartBottom}
                        stroke={chartTooltip.color}
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        opacity="0.6"
                      />

                      <rect
                        x={tooltipX - 78}
                        y={tooltipY - 29}
                        width="156"
                        height="49"
                        rx="9"
                        fill="#07150E"
                        stroke={chartTooltip.color}
                        strokeWidth="1.5"
                      />

                      <text
                        x={tooltipX}
                        y={tooltipY - 10}
                        textAnchor="middle"
                        fill="#F2FAF5"
                        fontSize="11"
                        fontWeight="600"
                      >
                        {chartTooltip.serviceCode}
                      </text>

                      <text
                        x={tooltipX}
                        y={tooltipY + 7}
                        textAnchor="middle"
                        fill="#D4E3DA"
                        fontSize="10"
                      >
                        {chartTooltip.value} kWh ·{' '}
                        {chartTooltip.minutes === 0
                          ? 'Agora'
                          : `Há ${chartTooltip.minutes} min`}
                      </text>
                    </>
                  );
                })()}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Card: Todos os serviços */}
      <div className="bg-[#0D2115] border-2 border-[#385E47] p-5 sm:p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <h3 className="font-bold text-lg sm:text-xl text-[#F2FAF5]">Todos os serviços</h3>
            <p className="text-[#9DB0A4] text-xs sm:text-sm mt-0.5">
              {services.length} serviços · métricas da última coleta
            </p>
          </div>
        </div>

        {/* Barra de controles: Ordenação */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <span className="block text-xs font-medium text-[#D4E3DA] mb-1.5">Ordenar por</span>
              <div className="inline-flex items-center p-1 rounded-xl bg-[#07150E] border-2 border-[#385E47] gap-1">
                <button
                  type="button"
                  onClick={() => setSortMode('alpha')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    sortMode === 'alpha'
                      ? 'bg-[#1F8A4C] text-[#F2FAF5] border border-[#14C45A] font-semibold'
                      : 'text-[#9DB0A4] hover:text-[#F2FAF5] border border-transparent'
                  }`}
                >
                  Ordem alfabética (A–Z)
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode('value')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    sortMode === 'value'
                      ? 'bg-[#1F8A4C] text-[#F2FAF5] border border-[#14C45A] font-semibold'
                      : 'text-[#9DB0A4] hover:text-[#F2FAF5] border border-transparent'
                  }`}
                >
                  Maior valor
                </button>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#D4E3DA] mb-1.5">
                Ordenar por métrica
              </span>
              <div className="inline-flex items-center p-1 rounded-xl bg-[#07150E] border-2 border-[#385E47] gap-1">
                <button
                  type="button"
                  onClick={() => setSortMetric('emission')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    sortMetric === 'emission'
                      ? 'bg-[#1F8A4C] text-[#F2FAF5] border border-[#14C45A] font-semibold'
                      : 'text-[#9DB0A4] hover:text-[#F2FAF5] border border-transparent'
                  }`}
                >
                  Emissão (CO₂e)
                </button>
                <button
                  type="button"
                  onClick={() => setSortMetric('energy')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    sortMetric === 'energy'
                      ? 'bg-[#1F8A4C] text-[#F2FAF5] border border-[#14C45A] font-semibold'
                      : 'text-[#9DB0A4] hover:text-[#F2FAF5] border border-transparent'
                  }`}
                >
                  Energia (kWh)
                </button>
              </div>
            </div>
          </div>

          <span className="text-xs text-[#9DB0A4]">
            {isInitialLoad ? 'Carregando serviços…' : `Mostrando ${filteredServices.length} de ${services.length} serviços`}
          </span>
        </div>

        {/* Estado vazio */}
        {filteredServices.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-[#385E47] rounded-xl bg-[#09180F]">
            <p className="text-sm font-medium text-[#F2FAF5] mb-1">
              {isInitialLoad
                ? 'Carregando serviços'
                : hasError && summary === null
                  ? 'Não foi possível carregar os serviços'
                  : services.length === 0
                    ? 'A API não retornou serviços'
                    : 'Nenhum serviço encontrado'}
            </p>

            <p className="text-xs text-[#9DB0A4] mb-4">
              {isInitialLoad
                ? 'A lista será exibida assim que os dados da API forem recebidos.'
                : hasError && summary === null
                  ? 'Verifique a conexão e tente carregar novamente.'
                  : services.length === 0
                    ? 'Não há serviços cadastrados para exibir.'
                    : 'Não existem serviços correspondentes aos filtros aplicados.'}
            </p>

            {hasError && summary === null ? (
              <button
                type="button"
                onClick={() => void triggerRefresh()}
                className="px-3.5 py-1.5 rounded-lg bg-[#1F8A4C] hover:bg-[#2FA862] text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Tentar novamente
              </button>
            ) : services.length > 0 && filteredServices.length === 0 ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-3.5 py-1.5 rounded-lg bg-[#1F8A4C] hover:bg-[#2FA862] text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {/* MOBILE (< 768px): Cards */}
            <div className="md:hidden space-y-3">
              {filteredServices.map((row) => (
                <div
                  key={row.id}
                  onClick={() => setSelectedServiceModal(mapServiceRowToModalData(row))}
                  className="p-3.5 rounded-xl bg-[#09180F] border-2 border-[#385E47] hover:border-[#14C45A] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <div className="font-semibold text-sm text-[#F2FAF5]">{row.name}</div>
                      <div className="text-[11px] text-[#9DB0A4]">ID: {row.id}</div>
                    </div>
                    <DashboardStatusPill status={row.status} />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-[#243F2F]">
                      <span className="text-[#9DB0A4]">Localização</span>
                      <span className="text-[#D4E3DA] font-medium">{row.location}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#243F2F]">
                      <span className="text-[#9DB0A4]">Consumo (kWh)</span>
                      <span className="text-[#D4E3DA]">
                        {formatEnvironmentalMetric(row.consumptionKwh, 'kWh').formattedValue}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[#9DB0A4]">Emissão (gCO₂e)</span>
                      <span className="text-[#D4E3DA] font-medium">
                        {formatEnvironmentalMetric(row.emissionsGco2e, 'gCO₂e').formattedValue}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[#9DB0A4]">Última coleta</span>
                      <span className="text-[#D4E3DA] font-medium">
                        {formatCollectedAt(row.collectedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP (>= 768px): Tabela completa */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                <thead>
                  <tr className="bg-[#96AA9E] text-[#07150E] text-xs font-semibold">
                    <th className="py-3 px-3 rounded-l-lg border-r border-[#07150E]/20">Serviço / ID</th>
                    <th className="py-3 px-4 border-r border-[#07150E]/20">Localização</th>
                    <th className="py-3 px-4 border-r border-[#07150E]/20">Status</th>
                    <th className="py-3 px-4 border-r border-[#07150E]/20">
                      Energia na última coleta (kWh)
                    </th>
                    <th className="py-3 px-4 border-r border-[#07150E]/20">
                      Emissão na última coleta (gCO₂e)
                    </th>
                    <th className="py-3 px-4 rounded-r-lg">Coletado em</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-2"></tr>
                  {filteredServices.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedServiceModal(mapServiceRowToModalData(row))}
                      className="border-b border-[#243F2F] hover:bg-[#122B1C] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-[#F2FAF5]">{row.name}</div>
                        <div className="text-xs text-[#9DB0A4]">ID: {row.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#D4E3DA]">{row.location}</td>
                      <td className="py-3.5 px-4">
                        <DashboardStatusPill status={row.status} />
                      </td>
                      <td className="py-3.5 px-4 text-[#D4E3DA]">
                        {formatEnvironmentalMetric(row.consumptionKwh, 'kWh').formattedValue}
                      </td>
                      <td className="py-3.5 px-4 text-[#D4E3DA]">
                        {formatEnvironmentalMetric(row.emissionsGco2e, 'gCO₂e').formattedValue}
                      </td>
                      <td className="py-3.5 px-4 text-[#D4E3DA]">
                        {formatCollectedAt(row.collectedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-6 text-xs text-[#9DB0A4]">
          Mostrando {filteredServices.length} de {services.length} serviços
        </div>
      </div>

      {/* Modal de detalhes do serviço */}
      {selectedServiceModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes de ${selectedServiceModal.name}`}
          onClick={() => setSelectedServiceModal(null)}
          className="fixed inset-0 z-[1050] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedServiceModal(null)}
              aria-label="Fechar detalhes do serviço"
              className="px-3 py-1 rounded-full bg-[#081C12] border border-[#F2FAF5]/50 text-[#F2FAF5] text-xs hover:bg-[#1F8A4C] transition-colors cursor-pointer"
            >
              Fechar ✕
            </button>
            <ServiceModal
              service={selectedServiceModal}
              onClose={() => setSelectedServiceModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};