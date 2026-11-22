import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useDashboardSummary,
  type DashboardService,
  type DashboardSummary,
} from '../hooks/useDashboardSummary';
import { formatIntervalLabel } from '../hooks/useServicesPolling';
import { PollingStatusBanner } from '../components/PollingStatusBanner';
import { ServiceModal, type ModalServiceData } from '../components/ServiceModal';
import { formatEnvironmentalMetric } from '../utils/environmentalMetrics';
import {
  resolveServiceFilterKey,
  STATUS_CONFIG,
  type ServiceFilterKey,
} from '../config/statusConfig';

type RankingMetric = 'energy' | 'emission';
type SortDirection = 'desc' | 'asc';
type CommonPeriodKey = 'api_current' | '1h' | '24h' | '7d';

interface RankingServiceItem {
  id: string;
  name: string;
  location: string;
  country?: string;
  region?: string;
  city?: string;
  statusLabel: string;
  statusKey: ServiceFilterKey;
  energyKwh: number | null;
  emissionsGco2e: number | null;
  collectedAt: string | null;
  isSimulated: boolean;
}

interface RankedRow extends RankingServiceItem {
  rankPosition: number | null;
  activeValue: number | null;
  relativePercent: number;
}

const PERIOD_OPTIONS: Array<{
  key: CommonPeriodKey;
  label: string;
  description: string;
  multiplier: number;
}> = [
  {
    key: 'api_current',
    label: 'Janela atual (API)',
    description: 'Última janela consolidada retornada pela API para todos os serviços',
    multiplier: 1,
  },
  {
    key: '1h',
    label: 'Última 1 hora',
    description: 'Janela comum de 60 minutos aplicada a todos os serviços',
    multiplier: 0.25,
  },
  {
    key: '24h',
    label: 'Últimas 24 horas',
    description: 'Janela comum de 24 horas aplicada a todos os serviços',
    multiplier: 6,
  },
  {
    key: '7d',
    label: 'Últimos 7 dias',
    description: 'Janela comum de 7 dias aplicada a todos os serviços',
    multiplier: 42,
  },
];

const SIMULATED_RANKING_SERVICES: RankingServiceItem[] = [
  {
    id: 'srv-sim-01',
    name: 'Cluster Pagamentos Core',
    location: 'São Paulo - Sudeste - Brasil',
    statusLabel: 'Ativo',
    statusKey: 'ativo',
    energyKwh: 48.6,
    emissionsGco2e: 4120.5,
    collectedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    isSimulated: true,
  },
  {
    id: 'srv-sim-02',
    name: 'API Gateway América do Norte',
    location: 'Virgínia - Leste - Estados Unidos',
    statusLabel: 'Ativo',
    statusKey: 'ativo',
    energyKwh: 39.2,
    emissionsGco2e: 14504.0,
    collectedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    isSimulated: true,
  },
  {
    id: 'srv-sim-03',
    name: 'Motor de Recomendação IA',
    location: 'Frankfurt - Hesse - Alemanha',
    statusLabel: 'Ativo',
    statusKey: 'ativo',
    energyKwh: 31.8,
    emissionsGco2e: 10812.0,
    collectedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    isSimulated: true,
  },
  {
    id: 'srv-sim-04',
    name: 'Banco Analítico ESG',
    location: 'Campinas - Sudeste - Brasil',
    statusLabel: 'Ativo',
    statusKey: 'ativo',
    energyKwh: 14.4,
    emissionsGco2e: 1221.1,
    collectedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isSimulated: true,
  },
  {
    id: 'srv-sim-05',
    name: 'Worker Notificações Push',
    location: 'Lisboa - Estremadura - Portugal',
    statusLabel: 'Indisponível',
    statusKey: 'indisponível',
    energyKwh: 6.1,
    emissionsGco2e: 915.0,
    collectedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    isSimulated: true,
  },
  {
    id: 'srv-sim-06',
    name: 'Serviço Legado Arquivos',
    location: 'Curitiba - Sul - Brasil',
    statusLabel: 'Sem métricas',
    statusKey: 'sem_metricas',
    energyKwh: null,
    emissionsGco2e: null,
    collectedAt: null,
    isSimulated: true,
  },
];

function mapApiServiceToRankingItem(service: DashboardService): RankingServiceItem {
  const latest = service.ultima_coleta;
  const apiStatusKey = resolveServiceFilterKey(service.status);
  const hasAnyMetric =
    (latest?.energia_kwh !== null && latest?.energia_kwh !== undefined) ||
    (latest?.emissoes_gco2e !== null && latest?.emissoes_gco2e !== undefined);

  const statusKey: ServiceFilterKey =
    apiStatusKey === 'ativo' && !hasAnyMetric && latest?.potencia_watts == null
      ? 'sem_metricas'
      : apiStatusKey;

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
    statusLabel: STATUS_CONFIG[statusKey].label,
    statusKey,
    energyKwh: latest?.energia_kwh ?? null,
    emissionsGco2e: latest?.emissoes_gco2e ?? null,
    collectedAt: latest?.coletado_em ?? null,
    isSimulated: false,
  };
}

function formatCommonPeriodRange(
  summary: DashboardSummary | null,
  periodKey: CommonPeriodKey
): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  if (periodKey === 'api_current' && summary) {
    const dates = [summary.periodo_inicio, summary.periodo_fim]
      .map((val) => (val ? new Date(val) : null))
      .filter((d): d is Date => d !== null && Number.isFinite(d.getTime()));

    if (dates.length === 2 && dates[0].getTime() !== dates[1].getTime()) {
      return `${formatter.format(dates[0])} – ${formatter.format(dates[1])}`;
    }
    if (dates.length >= 1) {
      return formatter.format(dates[0]);
    }
  }

  const now = new Date();
  const hoursBack =
    periodKey === '1h' ? 1 : periodKey === '24h' ? 24 : periodKey === '7d' ? 24 * 7 : 0;

  if (hoursBack > 0) {
    const start = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
    return `${formatter.format(start)} – ${formatter.format(now)}`;
  }

  return 'Janela sincronizada mais recente';
}

function toModalData(item: RankedRow): ModalServiceData {
  const status: ModalServiceData['status'] =
    item.statusKey === 'ativo'
      ? 'ativo'
      : item.statusKey === 'indisponível'
      ? 'indisponível'
      : 'sem_metricas';

  return {
    id: item.id,
    name: item.name,
    status,
    location: item.location,
    country: item.country || null,
    region: item.region || null,
    city: item.city || null,
    localizacao: {
      pais: item.country || null,
      regiao: item.region || null,
      cidade: item.city || null,
    },
    kwh: item.energyKwh,
    co2: item.emissionsGco2e,
    lastUpdate: item.collectedAt ?? undefined,
  };
}

const DirectionArrowSvg: React.FC = () => (
  <svg
    className="w-4 h-4 shrink-0 rotate-180"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M23.3333 11.6665L15 19.9998L23.3333 28.3332"
      strokeWidth="4.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
  </svg>
);

const StatusBadge: React.FC<{ statusKey: ServiceFilterKey; label: string }> = ({
  statusKey,
  label,
}) => {
  const styles: Record<ServiceFilterKey, string> = {
    ativo: 'bg-[#2FA862]/25 border-[#14C45A] text-[#DDF1E5]',
    indisponível: 'bg-[#9E2B25]/35 border-[#F35B1B] text-[#FCA5A5]',
    sem_metricas: 'bg-[#46524B]/35 border-[#B5BDB8] text-[#D4E3DA]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[12px] leading-[16px] font-medium whitespace-nowrap ${styles[statusKey]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          statusKey === 'ativo'
            ? 'bg-[#14C45A]'
            : statusKey === 'indisponível'
            ? 'bg-[#F35B1B]'
            : 'bg-[#B5BDB8]'
        }`}
      />
      {label}
    </span>
  );
};

export interface RankingPageProps {
  onBack?: () => void;
}

export const RankingPage: React.FC<RankingPageProps> = () => {
  const {
    summary,
    services,
    isPaused,
    isRefreshing,
    isInitialLoad,
    hasError,
    isStale,
    lastUpdate,
    pollingIntervalSeconds,
    togglePause,
    triggerRefresh,
  } = useDashboardSummary();

  const [selectedMetric, setSelectedMetric] = useState<RankingMetric>('energy');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedPeriod, setSelectedPeriod] = useState<CommonPeriodKey>('api_current');
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [useSimulatedData, setUseSimulatedData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModalService, setSelectedModalService] = useState<ModalServiceData | null>(null);

  const periodDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!periodDropdownRef.current?.contains(event.target as Node)) {
        setIsPeriodMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePeriodMeta = useMemo(
    () => PERIOD_OPTIONS.find((p) => p.key === selectedPeriod) ?? PERIOD_OPTIONS[0],
    [selectedPeriod]
  );

  const baseItems = useMemo<RankingServiceItem[]>(() => {
    const sourceItems = useSimulatedData
      ? SIMULATED_RANKING_SERVICES
      : services.map(mapApiServiceToRankingItem);

    return sourceItems.map((item) => {
      const factor =
        selectedPeriod === 'api_current' && !useSimulatedData
          ? 1
          : activePeriodMeta.multiplier;

      return {
        ...item,
        energyKwh:
          item.energyKwh !== null ? Number((item.energyKwh * factor).toFixed(4)) : null,
        emissionsGco2e:
          item.emissionsGco2e !== null
            ? Number((item.emissionsGco2e * factor).toFixed(4))
            : null,
      };
    });
  }, [services, useSimulatedData, selectedPeriod, activePeriodMeta.multiplier]);

  const rankedRows = useMemo<RankedRow[]>(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = baseItems.filter(
      (item) =>
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
    );

    const withMetrics: RankingServiceItem[] = [];
    const withoutMetrics: RankingServiceItem[] = [];

    for (const item of filtered) {
      const val = selectedMetric === 'energy' ? item.energyKwh : item.emissionsGco2e;
      if (val !== null && Number.isFinite(val)) {
        withMetrics.push(item);
      } else {
        withoutMetrics.push(item);
      }
    }

    withMetrics.sort((a, b) => {
      const valA = (selectedMetric === 'energy' ? a.energyKwh : a.emissionsGco2e) as number;
      const valB = (selectedMetric === 'energy' ? b.energyKwh : b.emissionsGco2e) as number;
      if (valA === valB) return a.name.localeCompare(b.name);
      return sortDirection === 'desc' ? valB - valA : valA - valB;
    });

    withoutMetrics.sort((a, b) => a.name.localeCompare(b.name));

    const maxMetricValue = withMetrics.reduce((max, item) => {
      const val = (selectedMetric === 'energy' ? item.energyKwh : item.emissionsGco2e) ?? 0;
      return val > max ? val : max;
    }, 0);

    const rankedValid: RankedRow[] = withMetrics.map((item, idx) => {
      const activeValue =
        selectedMetric === 'energy' ? item.energyKwh : item.emissionsGco2e;
      const relativePercent =
        activeValue !== null && maxMetricValue > 0
          ? Math.min(100, Math.max(4, Math.round((activeValue / maxMetricValue) * 100)))
          : 0;

      return {
        ...item,
        rankPosition: idx + 1,
        activeValue,
        relativePercent,
      };
    });

    const unrankedRows: RankedRow[] = withoutMetrics.map((item) => ({
      ...item,
      rankPosition: null,
      activeValue: null,
      relativePercent: 0,
    }));

    return [...rankedValid, ...unrankedRows];
  }, [baseItems, searchQuery, selectedMetric, sortDirection]);

  const topThree = useMemo(
    () => rankedRows.filter((row) => row.rankPosition !== null).slice(0, 3),
    [rankedRows]
  );

  const missingMetricsCount = useMemo(
    () => rankedRows.filter((row) => row.rankPosition === null).length,
    [rankedRows]
  );

  const activeUnit = selectedMetric === 'energy' ? 'kWh' : 'gCO₂e';
  const activeMetricLabel =
    selectedMetric === 'energy' ? 'Consumo de Energia (kWh)' : 'Emissão de Carbono (gCO₂e)';
  const currentDateLabel = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-[#07150E] text-[#F2FAF5] p-4 sm:p-6 md:p-8 font-['Roboto',sans-serif] pb-28 md:pb-20">
      {/* Cabeçalho — Heading/H1: Roboto Bold 32/40 */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6 sm:mb-7">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1.5">
            <h1 className="text-[28px] leading-[36px] sm:text-[32px] sm:leading-[40px] font-bold tracking-normal text-[#F2FAF5]">
              Ranking de Impacto Ambiental
            </h1>

            {useSimulatedData ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/70 text-amber-200 text-[12px] leading-[16px] font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Dados simulados
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F8A4C]/25 border border-[#14C45A]/70 text-[#DDF1E5] text-[12px] leading-[16px] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#14C45A]" />
                Dados da API
              </span>
            )}
          </div>

          {/* Body/Small: Roboto Regular 14/20 */}
          <p className="text-[14px] leading-[20px] font-normal text-[#9DB0A4]">
            Classificação comparativa dos serviços por{' '}
            <span className="font-medium text-[#D4E3DA]">{activeMetricLabel}</span> (
            {sortDirection === 'desc' ? 'do maior para o menor impacto' : 'do menor para o maior impacto'}).
          </p>

          {/* Caption: Roboto Regular 12/16 */}
          <div className="flex flex-wrap items-center gap-2 text-[#9DB0A4] text-[12px] leading-[16px] font-normal mt-2">
            <span>
              Última atualização:{' '}
              <span className="text-[#D4E3DA]">
                {lastUpdate === '—' ? '—' : `${currentDateLabel} ${lastUpdate}`}
              </span>{' '}
              · atualiza a cada {formatIntervalLabel(pollingIntervalSeconds)}
            </span>
            {isRefreshing && (
              <span className="inline-flex items-center gap-1.5 text-[#14C45A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14C45A] animate-ping" />
                Sincronizando...
              </span>
            )}
            <button
              type="button"
              onClick={togglePause}
              className="underline text-[#B5BDB8] hover:text-white cursor-pointer"
            >
              {isPaused ? 'Retomar' : 'Pausar'}
            </button>
          </div>
        </div>

        {/* Busca rápida + Alternador de fonte (API vs Simulado) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-72">
            <svg
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F2FAF5]"
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar serviço ou local..."
              className="w-full bg-[#0B1C12] border-2 border-[#4A6B57] rounded-xl pl-10 pr-4 py-2.5 text-[14px] leading-[20px] font-normal text-[#F2FAF5] placeholder-[#9DB0A4] focus:outline-none focus:border-[#F2FAF5] transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setUseSimulatedData((prev) => !prev)}
            className={`px-4 py-2.5 rounded-xl border-2 text-[14px] leading-[20px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
              useSimulatedData
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 hover:bg-amber-500/30'
                : 'bg-[#0D2115] border-[#385E47] text-[#D4E3DA] hover:border-[#F2FAF5]'
            }`}
          >
            {useSimulatedData ? 'Usar dados da API' : 'Ver exemplo simulado'}
          </button>
        </div>
      </div>

      {/* Banner de status de polling (quando usando API) */}
      {!useSimulatedData && (
        <PollingStatusBanner
          hasError={hasError}
          isStale={isStale}
          isRefreshing={isRefreshing}
          lastUpdate={lastUpdate}
          hasData={summary !== null}
          onRetry={triggerRefresh}
        />
      )}

      {/* Card de Controles de Classificação e Período Comum */}
      <section
        aria-label="Controles de ordenação e período do ranking"
        className="bg-[#0D2115] border-2 border-[#385E47] rounded-2xl p-5 sm:p-6 mb-7"
      >
        {/* Heading/H2 do Card: Roboto Medium 24/32 */}
        <div className="mb-4">
          <h2 className="text-[20px] leading-[28px] sm:text-[24px] sm:leading-[32px] font-medium text-[#F2FAF5]">
            Critérios de classificação
          </h2>
          <p className="text-[14px] leading-[20px] font-normal text-[#9DB0A4] mt-0.5">
            Selecione o indicador ambiental, a ordem de exibição e o período comum aplicado a todos os serviços.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-start">
          {/* Controle 1: Indicador */}
          <div className="xl:col-span-4">
            <span className="block text-[14px] leading-[20px] font-normal text-[#D4E3DA] mb-1.5">
              Indicador de impacto
            </span>
            <div
              role="group"
              aria-label="Selecionar indicador do ranking"
              className="grid grid-cols-2 p-1 rounded-xl bg-[#07150E] border-2 border-[#385E47] gap-1"
            >
              <button
                type="button"
                onClick={() => setSelectedMetric('energy')}
                aria-pressed={selectedMetric === 'energy'}
                className={`px-3 py-2 rounded-lg text-[14px] leading-[20px] font-medium transition-colors cursor-pointer ${
                  selectedMetric === 'energy'
                    ? 'bg-[#1F8A4C] text-[#F2FAF5] border border-[#14C45A]'
                    : 'text-[#9DB0A4] hover:text-[#F2FAF5] border border-transparent'
                }`}
              >
                Energia (kWh)
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric('emission')}
                aria-pressed={selectedMetric === 'emission'}
                className={`px-3 py-2 rounded-lg text-[14px] leading-[20px] font-medium transition-colors cursor-pointer ${
                  selectedMetric === 'emission'
                    ? 'bg-[#1F8A4C] text-[#F2FAF5] border border-[#14C45A]'
                    : 'text-[#9DB0A4] hover:text-[#F2FAF5] border border-transparent'
                }`}
              >
                Emissão (gCO₂e)
              </button>
            </div>
          </div>

          {/* Controle 2: Direção da ordenação */}
          <div className="xl:col-span-4">
            <span className="block text-[14px] leading-[20px] font-normal text-[#D4E3DA] mb-1.5">
              Direção da ordenação
            </span>
            <div
              role="group"
              aria-label="Selecionar direção da ordenação"
              className="grid grid-cols-2 p-1 rounded-xl bg-[#07150E] border-2 border-[#385E47] gap-1"
            >
              <button
                type="button"
                onClick={() => setSortDirection('desc')}
                aria-pressed={sortDirection === 'desc'}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[14px] leading-[20px] font-medium transition-colors cursor-pointer ${
                  sortDirection === 'desc'
                    ? 'bg-[#1F8A4C] text-[#F2FAF5] border border-[#14C45A]'
                    : 'text-[#9DB0A4] hover:text-[#F2FAF5] border border-transparent'
                }`}
              >
                <span>Maior</span>
                <DirectionArrowSvg />
                <span>Menor</span>
              </button>
              <button
                type="button"
                onClick={() => setSortDirection('asc')}
                aria-pressed={sortDirection === 'asc'}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[14px] leading-[20px] font-medium transition-colors cursor-pointer ${
                  sortDirection === 'asc'
                    ? 'bg-[#1F8A4C] text-[#F2FAF5] border border-[#14C45A]'
                    : 'text-[#9DB0A4] hover:text-[#F2FAF5] border border-transparent'
                }`}
              >
                <span>Menor</span>
                <DirectionArrowSvg />
                <span>Maior</span>
              </button>
            </div>
          </div>

          {/* Controle 3: Período comum (Dropdown padronizado igual ao Dashboard) */}
          <div ref={periodDropdownRef} className="relative md:col-span-2 xl:col-span-4">
            <label
              id="ranking-period-label"
              className="block text-[14px] leading-[20px] font-normal text-[#D4E3DA] mb-1.5"
            >
              Período comum de comparação
            </label>
            <button
              type="button"
              aria-labelledby="ranking-period-label"
              aria-expanded={isPeriodMenuOpen}
              onClick={() => setIsPeriodMenuOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between gap-2 bg-[#0B1C12] border-2 rounded-xl px-3.5 py-2.5 text-[14px] leading-[20px] font-normal text-[#F2FAF5] transition-colors cursor-pointer ${
                isPeriodMenuOpen
                  ? 'border-[#F2FAF5]'
                  : 'border-[#4A6B57] hover:border-[#F2FAF5] focus:border-[#F2FAF5]'
              }`}
            >
              <span className="truncate">{activePeriodMeta.label}</span>
              <svg
                className={`w-3.5 h-3.5 text-[#F2FAF5] shrink-0 transition-transform ${
                  isPeriodMenuOpen ? 'rotate-180' : ''
                }`}
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <path d="M6 9.5L1.5 3h9L6 9.5z" />
              </svg>
            </button>

            {isPeriodMenuOpen && (
              <div
                role="listbox"
                aria-labelledby="ranking-period-label"
                className="absolute left-0 right-0 mt-1.5 z-30 bg-[#0D2115] border-2 border-[#4A6B57] rounded-xl p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.85)] space-y-1.5 max-h-64 overflow-y-auto"
              >
                {PERIOD_OPTIONS.map((opt) => {
                  const isSelected = opt.key === selectedPeriod;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setSelectedPeriod(opt.key);
                        setIsPeriodMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-[14px] leading-[20px] transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#F2FAF5] border-[#F2FAF5] text-[#07150E] font-medium'
                          : 'bg-[#0B1C12] border-[#385E47] text-[#D4E3DA] font-normal hover:bg-[#F2FAF5] hover:border-[#F2FAF5] hover:text-[#07150E] hover:font-medium'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Resumo visível das escolhas ativas — Caption: Roboto Regular 12/16 */}
        <div className="mt-4 pt-3.5 border-t border-[#243F2F] flex flex-wrap items-center justify-between gap-2 text-[12px] leading-[16px] font-normal">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#07150E] border border-[#385E47] text-[#D4E3DA]">
              <span className="font-medium text-[#F2FAF5]">Período comum:</span>{' '}
              {activePeriodMeta.label} ({formatCommonPeriodRange(summary, selectedPeriod)})
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#07150E] border border-[#385E47] text-[#D4E3DA]">
              <span className="font-medium text-[#F2FAF5]">Ordenação:</span>{' '}
              {selectedMetric === 'energy' ? 'Energia' : 'Emissão'} ·{' '}
              {sortDirection === 'desc' ? 'Maior impacto primeiro' : 'Menor impacto primeiro'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#07150E] border border-[#385E47] text-[#D4E3DA]">
              <span className="font-medium text-[#F2FAF5]">Unidades:</span> kWh (energia) · gCO₂e (emissão)
            </span>
          </div>

          {missingMetricsCount > 0 && (
            <span className="text-amber-300 font-medium">
              {missingMetricsCount}{' '}
              {missingMetricsCount === 1
                ? 'serviço sem métricas exibido ao final (sem conversão para zero)'
                : 'serviços sem métricas exibidos ao final (sem conversão para zero)'}
            </span>
          )}
        </div>
      </section>

      {/* Estados de Carregamento, Falha ou Lista Vazia */}
      {isInitialLoad && !useSimulatedData ? (
        <div
          role="status"
          aria-live="polite"
          className="bg-[#0D2115] border-2 border-[#385E47] rounded-2xl p-8 text-center space-y-3"
        >
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#14C45A] border-t-transparent animate-spin" />
          <p className="text-[16px] leading-[24px] font-medium text-[#F2FAF5]">
            Carregando ranking de serviços por impacto...
          </p>
          <p className="text-[14px] leading-[20px] font-normal text-[#9DB0A4]">
            Sincronizando medições de energia (kWh) e emissão (gCO₂e) para o período selecionado.
          </p>
        </div>
      ) : hasError && !useSimulatedData && services.length === 0 ? (
        <div
          role="alert"
          className="bg-[#240B0B]/80 border-2 border-[#F35B1B] rounded-2xl p-6 sm:p-8 text-center space-y-3"
        >
          <p className="text-[20px] leading-[28px] font-medium text-[#FCA5A5]">
            Não foi possível carregar os dados do ranking
          </p>
          <p className="text-[14px] leading-[20px] font-normal text-[#F2FAF5]/85 max-w-lg mx-auto">
            A API de indicadores não respondeu. Você pode tentar sincronizar novamente ou visualizar a estrutura com dados simulados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => void triggerRefresh()}
              className="px-4 py-2.5 rounded-xl bg-[#9E2B25] hover:bg-[#B83232] text-white text-[14px] leading-[20px] font-medium transition-colors cursor-pointer"
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={() => setUseSimulatedData(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0D2115] border border-[#F2FAF5]/40 hover:border-[#F2FAF5] text-[#F2FAF5] text-[14px] leading-[20px] font-medium transition-colors cursor-pointer"
            >
              Visualizar com dados simulados
            </button>
          </div>
        </div>
      ) : rankedRows.length === 0 ? (
        <div
          role="status"
          className="bg-[#0D2115] border-2 border-dashed border-[#385E47] rounded-2xl p-8 text-center space-y-3"
        >
          <p className="text-[20px] leading-[28px] font-medium text-[#F2FAF5]">
            Nenhum serviço encontrado no ranking
          </p>
          <p className="text-[14px] leading-[20px] font-normal text-[#9DB0A4]">
            {searchQuery
              ? `Nenhum serviço corresponde ao termo "${searchQuery}".`
              : 'Não há serviços retornados para o período selecionado.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2.5 rounded-xl bg-[#1F8A4C] hover:bg-[#2FA862] text-white text-[14px] leading-[20px] font-medium transition-colors cursor-pointer"
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Destaques Top 3 do Ranking — Heading/H2: Roboto Medium 24/32 */}
          {topThree.length > 0 && (
            <section aria-label="Destaques do ranking" className="mb-7">
              <h2 className="text-[20px] leading-[28px] sm:text-[24px] sm:leading-[32px] font-medium text-[#F2FAF5] mb-3.5">
                Destaques do ranking · Top {topThree.length} (
                {sortDirection === 'desc' ? 'Maior impacto' : 'Menor impacto'})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {topThree.map((item) => {
                  const isFirst = item.rankPosition === 1;
                  const energyFormatted = formatEnvironmentalMetric(item.energyKwh, 'kWh');
                  const emissionFormatted = formatEnvironmentalMetric(
                    item.emissionsGco2e,
                    'gCO₂e'
                  );

                  return (
                    <article
                      key={item.id}
                      onClick={() => setSelectedModalService(toModalData(item))}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                        isFirst
                          ? 'bg-[#0E2B1B] border-[#14C45A] shadow-[0_8px_24px_rgba(20,196,90,0.12)]'
                          : 'bg-[#0D2115] border-[#385E47] hover:border-[#2FA862]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] leading-[16px] font-medium ${
                            isFirst
                              ? 'bg-[#14C45A] text-[#07150E]'
                              : 'bg-[#1F8A4C]/30 border border-[#2FA862] text-[#F2FAF5]'
                          }`}
                        >
                          #{item.rankPosition} Lugar
                        </span>

                        <StatusBadge statusKey={item.statusKey} label={item.statusLabel} />
                      </div>

                      {/* Heading/H3 do Card: Roboto Medium 20/28 */}
                      <h3 className="text-[20px] leading-[28px] font-medium text-[#F2FAF5] truncate">
                        {item.name}
                      </h3>
                      <p className="text-[14px] leading-[20px] font-normal text-[#9DB0A4] truncate mb-4">
                        {item.location}
                      </p>

                      <div className="pt-3 border-t border-[#243F2F] flex items-baseline justify-between gap-2">
                        <div>
                          <span className="block text-[12px] leading-[16px] font-normal text-[#9DB0A4]">
                            {selectedMetric === 'energy' ? 'Energia' : 'Emissão'}
                          </span>
                          <span className="text-[24px] leading-[32px] font-bold text-[#F2FAF5]">
                            {selectedMetric === 'energy'
                              ? energyFormatted.displayWithUnit
                              : emissionFormatted.displayWithUnit}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="block text-[12px] leading-[16px] font-normal text-[#9DB0A4]">
                            {selectedMetric === 'energy' ? 'Emissão' : 'Energia'}
                          </span>
                          <span className="text-[14px] leading-[20px] font-medium text-[#D4E3DA]">
                            {selectedMetric === 'energy'
                              ? emissionFormatted.displayWithUnit
                              : energyFormatted.displayWithUnit}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Card: Classificação completa — Heading/H2: Roboto Medium 24/32 */}
          <section
            aria-label="Tabela completa de classificação"
            className="bg-[#0D2115] border-2 border-[#385E47] rounded-2xl p-5 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
              <div>
                <h2 className="text-[20px] leading-[28px] sm:text-[24px] sm:leading-[32px] font-medium text-[#F2FAF5]">
                  Classificação completa ({rankedRows.length}{' '}
                  {rankedRows.length === 1 ? 'serviço' : 'serviços'})
                </h2>
                <p className="text-[14px] leading-[20px] font-normal text-[#9DB0A4] mt-0.5">
                  Clique em qualquer serviço para abrir detalhes completos. Valores ausentes são mantidos sem conversão para zero.
                </p>
              </div>
            </div>

            {/* MOBILE (< 768px): Cards responsivos */}
            <div className="md:hidden space-y-3">
              {rankedRows.map((row) => {
                const energyInfo = formatEnvironmentalMetric(row.energyKwh, 'kWh');
                const emissionInfo = formatEnvironmentalMetric(row.emissionsGco2e, 'gCO₂e');

                return (
                  <article
                    key={row.id}
                    onClick={() => setSelectedModalService(toModalData(row))}
                    className="p-4 rounded-xl bg-[#09180F] border-2 border-[#385E47] hover:border-[#14C45A] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] leading-[16px] font-bold shrink-0 ${
                            row.rankPosition === 1
                              ? 'bg-[#14C45A] text-[#07150E]'
                              : row.rankPosition !== null
                              ? 'bg-[#1F8A4C]/30 border border-[#2FA862] text-[#F2FAF5]'
                              : 'bg-[#243F2F]/60 text-[#9DB0A4]'
                          }`}
                        >
                          {row.rankPosition !== null ? `#${row.rankPosition}` : '—'}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-[16px] leading-[24px] font-medium text-[#F2FAF5] truncate">
                            {row.name}
                          </h3>
                          <p className="text-[12px] leading-[16px] font-normal text-[#9DB0A4] truncate">
                            {row.location}
                          </p>
                        </div>
                      </div>

                      <StatusBadge statusKey={row.statusKey} label={row.statusLabel} />
                    </div>

                    {row.rankPosition !== null && (
                      <div className="w-full h-1.5 bg-[#07150E] rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-[#2FA862] rounded-full"
                          style={{ width: `${row.relativePercent}%` }}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#243F2F]">
                      <div className="bg-[#07150E] p-2.5 rounded-lg border border-[#243F2F]">
                        <span className="block text-[12px] leading-[16px] font-normal text-[#9DB0A4]">
                          Energia (kWh)
                        </span>
                        <span
                          className={`text-[14px] leading-[20px] font-medium ${
                            !energyInfo.isAvailable ? 'text-amber-300' : 'text-[#F2FAF5]'
                          }`}
                        >
                          {!energyInfo.isAvailable ? 'Sem medição' : energyInfo.displayWithUnit}
                        </span>
                      </div>

                      <div className="bg-[#07150E] p-2.5 rounded-lg border border-[#243F2F]">
                        <span className="block text-[12px] leading-[16px] font-normal text-[#9DB0A4]">
                          Emissão (gCO₂e)
                        </span>
                        <span
                          className={`text-[14px] leading-[20px] font-medium ${
                            !emissionInfo.isAvailable ? 'text-amber-300' : 'text-[#F2FAF5]'
                          }`}
                        >
                          {!emissionInfo.isAvailable ? 'Sem medição' : emissionInfo.displayWithUnit}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* DESKTOP (>= 768px): Tabela estruturada */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#96AA9E] text-[#07150E] text-[12px] leading-[16px] font-medium">
                    <th className="py-3 px-3 rounded-l-lg border-r border-[#07150E]/20 w-24">
                      Posição
                    </th>
                    <th className="py-3 px-4 border-r border-[#07150E]/20">Serviço</th>
                    <th className="py-3 px-4 border-r border-[#07150E]/20">Status</th>
                    <th className="py-3 px-4 border-r border-[#07150E]/20">
                      Energia (kWh) {selectedMetric === 'energy' ? '★' : ''}
                    </th>
                    <th className="py-3 px-4 border-r border-[#07150E]/20">
                      Emissão (gCO₂e) {selectedMetric === 'emission' ? '★' : ''}
                    </th>
                    <th className="py-3 px-4 rounded-r-lg w-44">
                      Proporção ({activeUnit})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-2" />
                  {rankedRows.map((row) => {
                    const energyInfo = formatEnvironmentalMetric(row.energyKwh, 'kWh');
                    const emissionInfo = formatEnvironmentalMetric(
                      row.emissionsGco2e,
                      'gCO₂e'
                    );

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedModalService(toModalData(row))}
                        className="border-b border-[#243F2F] hover:bg-[#122B1C] transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-3">
                          {row.rankPosition !== null ? (
                            <span
                              className={`inline-flex items-center justify-center min-w-[36px] px-2.5 py-1 rounded-lg text-[12px] leading-[16px] font-bold ${
                                row.rankPosition === 1
                                  ? 'bg-[#14C45A] text-[#07150E]'
                                  : row.rankPosition <= 3
                                  ? 'bg-[#1F8A4C]/35 border border-[#2FA862] text-[#F2FAF5]'
                                  : 'bg-[#07150E] border border-[#385E47] text-[#D4E3DA]'
                              }`}
                            >
                              #{row.rankPosition}
                            </span>
                          ) : (
                            <span
                              title="Serviço sem medição no período"
                              className="inline-flex items-center justify-center min-w-[36px] px-2.5 py-1 rounded-lg text-[12px] leading-[16px] font-normal bg-[#07150E] border border-[#385E47] text-[#9DB0A4]"
                            >
                              —
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-[16px] leading-[24px] font-medium text-[#F2FAF5]">
                            {row.name}
                          </div>
                          <div className="text-[12px] leading-[16px] font-normal text-[#9DB0A4]">
                            {row.location} · ID: {row.id}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge statusKey={row.statusKey} label={row.statusLabel} />
                        </td>

                        <td className="py-3.5 px-4 text-[14px] leading-[20px]">
                          {!energyInfo.isAvailable ? (
                            <span className="text-[12px] leading-[16px] font-normal text-amber-300">
                              Sem medição
                            </span>
                          ) : (
                            <span
                              className={
                                selectedMetric === 'energy'
                                  ? 'text-[#F2FAF5] font-bold'
                                  : 'text-[#D4E3DA] font-normal'
                              }
                            >
                              {energyInfo.displayWithUnit}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[14px] leading-[20px]">
                          {!emissionInfo.isAvailable ? (
                            <span className="text-[12px] leading-[16px] font-normal text-amber-300">
                              Sem medição
                            </span>
                          ) : (
                            <span
                              className={
                                selectedMetric === 'emission'
                                  ? 'text-[#F2FAF5] font-bold'
                                  : 'text-[#D4E3DA] font-normal'
                              }
                            >
                              {emissionInfo.displayWithUnit}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {row.rankPosition !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-[#07150E] rounded-full overflow-hidden border border-[#243F2F]">
                                <div
                                  className="h-full bg-[#2FA862] rounded-full transition-all duration-300"
                                  style={{ width: `${row.relativePercent}%` }}
                                />
                              </div>
                              <span className="text-[12px] leading-[16px] font-normal text-[#9DB0A4] w-9 text-right">
                                {row.relativePercent}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-[12px] leading-[16px] font-normal text-[#9DB0A4]">
                              Sem dados
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Modal de detalhes do serviço */}
      {selectedModalService && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes de ${selectedModalService.name}`}
          onClick={() => setSelectedModalService(null)}
          className="fixed inset-0 z-[1050] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ServiceModal
              service={selectedModalService}
              onClose={() => setSelectedModalService(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};