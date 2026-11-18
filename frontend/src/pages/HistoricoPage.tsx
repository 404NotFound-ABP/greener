import React, { useState, useMemo } from 'react';
import { ServiceModal } from '../components/ServiceModal';
import type { ModalServiceData } from '../components/ServiceModal';
// Hook centralizado de polling (ciclo de 5s, detecção de dados antigos e fallback em falhas - T29.3 / #113)
import { useServicesPolling } from '../hooks/useServicesPolling';
// Banner visual compartilhado para sinalizar estado degradado e permitir nova tentativa
import { PollingStatusBanner } from '../components/PollingStatusBanner';

type HistoryStatus = 'Ativo' | 'Indisponível' | 'Sem métricas' | 'Removido';

interface HistoryEventRow {
  id: string;
  sub: string;
  loc: string;
  date: string;
  timestamp: number;
  event: string;
  status: HistoryStatus;
}

const historyData: HistoryEventRow[] = [
  {
    id: 'ASTAH-XYZ',
    sub: 'ID 0041',
    loc: 'São Francisco - EUA',
    date: '17/10/2026 14:20',
    timestamp: 1792257600000,
    event: 'Perdeu conexão',
    status: 'Indisponível',
  },
  {
    id: 'ASTAH-ABC',
    sub: 'ID 0042',
    loc: 'Tóquio - Japão',
    date: '17/10/2026 11:45',
    timestamp: 1792248300000,
    event: 'Serviço descoberto',
    status: 'Ativo',
  },
  {
    id: 'ASTAH-DEF',
    sub: 'ID 0043',
    loc: 'Berlim - Alemanha',
    date: '16/10/2026 10:00',
    timestamp: 1792155600000,
    event: 'Parou de enviar métricas',
    status: 'Sem métricas',
  },
  {
    id: 'ASTAH-GHI',
    sub: 'ID 0044',
    loc: 'Londres - Reino Unido',
    date: '15/10/2026 09:15',
    timestamp: 1792066500000,
    event: 'Conectado',
    status: 'Ativo',
  },
  {
    id: 'ASTAH-JKL',
    sub: 'ID 0045',
    loc: 'Sydney - Austrália',
    date: '13/10/2026 08:30',
    timestamp: 1791891000000,
    event: 'Serviço removido',
    status: 'Removido',
  },
  {
    id: 'ASTAH-MNO',
    sub: 'ID 0046',
    loc: 'Canberra - Austrália',
    date: '12/10/2026 14:32',
    timestamp: 1791826320000,
    event: 'Conectado',
    status: 'Ativo',
  },
];

const dailySeries30Days = [
  { date: '24/09/2026', label: '24/09', count: 4 },
  { date: '25/09/2026', label: '25/09', count: 5 },
  { date: '26/09/2026', label: '26/09', count: 3 },
  { date: '27/09/2026', label: '27/09', count: 7 },
  { date: '28/09/2026', label: '28/09', count: 8 },
  { date: '29/09/2026', label: '29/09', count: 5 },
  { date: '30/09/2026', label: '30/09', count: 9 },
  { date: '01/10/2026', label: '01/10', count: 10 },
  { date: '02/10/2026', label: '02/10', count: 6 },
  { date: '03/10/2026', label: '03/10', count: 7 },
  { date: '04/10/2026', label: '04/10', count: 9 },
  { date: '05/10/2026', label: '05/10', count: 8 },
  { date: '06/10/2026', label: '06/10', count: 5 },
  { date: '07/10/2026', label: '07/10', count: 4 },
  { date: '08/10/2026', label: '08/10', count: 3 },
  { date: '09/10/2026', label: '09/10', count: 6 },
  { date: '10/10/2026', label: '10/10', count: 7 },
  { date: '11/10/2026', label: '11/10', count: 6 },
  { date: '12/10/2026', label: '12/10', count: 8 },
  { date: '13/10/2026', label: '13/10', count: 7 },
  { date: '14/10/2026', label: '14/10', count: 9 },
  { date: '15/10/2026', label: '15/10', count: 8 },
  { date: '16/10/2026', label: '16/10', count: 6 },
  { date: '17/10/2026 (Hoje)', label: 'Hoje', count: 7 },
];

function mapHistoryRowToModalData(row: HistoryEventRow, fallbackIndex: number): ModalServiceData {
  const numericId = Number(row.sub.replace(/\D/g, '')) || fallbackIndex + 1;
  const normalizedStatus: ModalServiceData['status'] =
    row.status === 'Ativo'
      ? 'ativo'
      : row.status === 'Indisponível' || row.status === 'Removido'
      ? 'indisponível'
      : 'sem_metricas';

  return {
    id: numericId,
    name: row.id,
    status: normalizedStatus,
    location: row.loc || 'Localização não informada',
  };
}

/**
 * Badge sólido de status alinhado ao protótipo do Histórico e paleta oficial GreenER
 */
const HistoryStatusPill: React.FC<{
  status: HistoryStatus;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const config: Record<HistoryStatus, { bgBorder: string; icon: React.ReactNode }> = {
    Ativo: {
      bgBorder: 'bg-[#2FA862] border-[#14C45A]',
      icon: (
        <svg className={size === 'md' ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.2l2.3 2.3 4.7-4.8" />
        </svg>
      ),
    },
    Indisponível: {
      bgBorder: 'bg-[#9E2B25] border-[#F35B1B]',
      icon: (
        <svg className={size === 'md' ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5l5 5m0-5l-5 5" />
        </svg>
      ),
    },
    'Sem métricas': {
      bgBorder: 'bg-[#46524B] border-[#B5BDB8]',
      icon: (
        <svg className={size === 'md' ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12h7" />
        </svg>
      ),
    },
    Removido: {
      bgBorder: 'bg-[#46524B] border-[#B5BDB8]',
      icon: (
        <svg className={size === 'md' ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12h7" />
        </svg>
      ),
    },
  };

  const current = config[status];
  const sizeClass =
    size === 'md'
      ? 'px-3.5 py-2 rounded-xl text-sm sm:text-base gap-2.5'
      : 'px-2.5 py-1 rounded-lg text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center border-2 font-medium text-[#F2FAF5] whitespace-nowrap ${current.bgBorder} ${sizeClass}`}
    >
      {current.icon}
      <span>{status}</span>
    </span>
  );
};

export const HistoricoPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<HistoryStatus | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [chartWindow, setChartWindow] = useState<'30d' | '7d'>('30d');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedServiceModal, setSelectedServiceModal] = useState<ModalServiceData | null>(null);

  // Sincroniza o status de atualização e recuperação após falha do Histórico com o ciclo de polling (T29.3 / #113)
  const {
    lastUpdate,
    isPaused,
    isRefreshing,
    hasError,
    isStale,
    togglePause,
    triggerRefresh,
  } = useServicesPolling();

  const currentDateLabel = new Date().toLocaleDateString('pt-BR');

  const toggleStatusFilter = (status: HistoryStatus) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = historyData.filter((row) => {
      const matchesSearch =
        !term ||
        row.id.toLowerCase().includes(term) ||
        row.sub.toLowerCase().includes(term) ||
        row.loc.toLowerCase().includes(term) ||
        row.event.toLowerCase().includes(term);
      const matchesStatus = statusFilter ? row.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) =>
      sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
    );
  }, [searchTerm, statusFilter, sortOrder]);

  const visibleBars = chartWindow === '30d' ? dailySeries30Days : dailySeries30Days.slice(-7);

  const statusDistributionItems: Array<{ status: HistoryStatus; pct: string }> = [
    { status: 'Ativo', pct: '73%' },
    { status: 'Indisponível', pct: '16%' },
    { status: 'Sem métricas', pct: '11%' },
  ];

  return (
    <div className="min-h-screen bg-[#07150E] text-[#F2FAF5] p-4 sm:p-6 md:p-8 font-sans pb-24 md:pb-20">
      {/* Cabeçalho com horário da última consulta válida, feedback de sincronização e controle de pausa */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 sm:mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-[#F2FAF5]">Histórico</h1>
          <h2 className="text-base sm:text-xl font-semibold mb-1.5 text-[#F2FAF5]">
            Verifique resultados e análises passadas
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-[#9DB0A4] text-xs sm:text-sm">
            <span>
              Última atualização:{' '}
              <span className="text-[#D4E3DA]">
                {currentDateLabel} {lastUpdate}
              </span>{' '}
              · atualiza a cada 5 s
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

        {/* Campo de busca conforme protótipo */}
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
            className="bg-[#0B1C12] border-2 border-[#4A6B57] rounded-xl pl-11 pr-4 py-2.5 w-full text-xs sm:text-sm focus:outline-none focus:border-[#14C45A] text-[#F2FAF5] placeholder-[#9DB0A4] transition-colors"
          />
        </div>
      </div>

      {/* Preserva os registros históricos exibidos em caso de falha e permite recuperação manual */}
      <PollingStatusBanner
        hasError={hasError}
        isStale={isStale}
        isRefreshing={isRefreshing}
        lastUpdate={lastUpdate}
        onRetry={triggerRefresh}
      />

      {/* Cards de KPIs com bordas mais espessas (border-2) e superfícies da paleta oficial */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {(
          [
            { title: 'Registros no período', value: '128', sub: '▲ 12% vs. período anterior', filterValue: null },
            { title: 'Serviços ativos', value: '94', sub: '73% do total', filterValue: 'Ativo' },
            { title: 'Indisponíveis', value: '21', sub: '▲ 3 novos hoje', filterValue: 'Indisponível' },
            { title: 'Sem métricas', value: '13', sub: '10% do total', filterValue: 'Sem métricas' },
          ] as Array<{ title: string; value: string; sub: string; filterValue: HistoryStatus | null }>
        ).map((kpi, i) => {
          const isSelected = kpi.filterValue !== null && statusFilter === kpi.filterValue;
          return (
            <button
              key={i}
              type="button"
              onClick={() => (kpi.filterValue ? toggleStatusFilter(kpi.filterValue) : setStatusFilter(null))}
              className={`text-left bg-[#0D2115] border-2 p-4 sm:p-5 rounded-2xl transition-colors cursor-pointer ${
                isSelected
                  ? 'border-[#14C45A] bg-[#122D1D]'
                  : 'border-[#385E47] hover:border-[#2FA862]'
              }`}
            >
              <h4 className="text-[#D4E3DA] text-xs sm:text-sm font-medium mb-2">{kpi.title}</h4>
              <div className="text-2xl sm:text-3xl font-bold text-[#F2FAF5] mb-2">{kpi.value}</div>
              <div className="text-[11px] sm:text-xs text-[#9DB0A4]">{kpi.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-7">
        {/* Gráfico de Barras: Eventos ao longo do tempo */}
        <div className="lg:col-span-2 bg-[#0D2115] border-2 border-[#385E47] p-5 sm:p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
            <div>
              <h4 className="font-bold text-lg sm:text-xl text-[#F2FAF5]">Eventos ao longo do tempo</h4>
              <p className="text-[#9DB0A4] text-xs sm:text-sm mt-0.5">
                Quantidade de registros por dia
              </p>
            </div>

            {/* Seletor em pílula para alternar a janela temporal de forma visível e intuitiva */}
            <div
              role="group"
              aria-label="Selecionar período do gráfico"
              className="self-start inline-flex items-center p-1 rounded-full bg-[#07150E] border-2 border-[#385E47] gap-1 shrink-0"
            >
              <button
                type="button"
                onClick={() => setChartWindow('7d')}
                aria-pressed={chartWindow === '7d'}
                className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  chartWindow === '7d'
                    ? 'bg-[#1F8A4C] text-[#F2FAF5] border border-[#14C45A] font-semibold shadow-sm'
                    : 'text-[#9DB0A4] hover:text-[#F2FAF5] border border-transparent'
                }`}
              >
                7 dias
              </button>
              <button
                type="button"
                onClick={() => setChartWindow('30d')}
                aria-pressed={chartWindow === '30d'}
                className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  chartWindow === '30d'
                    ? 'bg-[#1F8A4C] text-[#F2FAF5] border border-[#14C45A] font-semibold shadow-sm'
                    : 'text-[#9DB0A4] hover:text-[#F2FAF5] border border-transparent'
                }`}
              >
                30 dias
              </button>
            </div>
          </div>

          <div>
            <div className="h-40 sm:h-48 flex items-end justify-between gap-1.5 sm:gap-2 mt-2">
              {visibleBars.map((item, i) => {
                const isNearLeft = i <= 1;
                const isNearRight = i >= visibleBars.length - 2;
                const tooltipPositionClass = isNearLeft
                  ? 'left-0'
                  : isNearRight
                  ? 'right-0'
                  : 'left-1/2 -translate-x-1/2';
                const arrowPositionClass = isNearLeft
                  ? 'left-3'
                  : isNearRight
                  ? 'right-3'
                  : 'left-1/2 -translate-x-1/2';

                return (
                  <div
                    key={item.date}
                    tabIndex={0}
                    aria-label={`${item.date}: ${item.count} ${item.count === 1 ? 'registro' : 'registros'}`}
                    className="group relative flex-1 h-full flex items-end focus:outline-none cursor-pointer"
                  >
                    {/* Barra em verde/700 (#186A3B) com hover em verde/500 (#2FA862) */}
                    <div
                      className="w-full bg-[#186A3B] group-hover:bg-[#2FA862] group-focus:bg-[#2FA862] rounded-t-md transition-colors"
                      style={{ height: `${item.count * 10}%` }}
                    />

                    {/* Balão flutuante acima do topo exato da coluna */}
                    <div
                      style={{ bottom: `calc(${item.count * 10}% + 8px)` }}
                      className={`pointer-events-none opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus:opacity-100 group-focus:scale-100 transition-all duration-150 absolute ${tooltipPositionClass} z-20 bg-[#07150E] border-2 border-[#2FA862] text-[#F2FAF5] rounded-lg px-2.5 py-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.85)] whitespace-nowrap`}
                    >
                      <div className="text-[10px] text-[#9DB0A4] leading-tight">{item.date}</div>
                      <div className="text-xs font-bold text-[#14C45A] leading-tight mt-0.5">
                        {item.count} {item.count === 1 ? 'registro' : 'registros'}
                      </div>

                      {/* Setinha inferior do balão */}
                      <span
                        className={`absolute -bottom-[5px] ${arrowPositionClass} w-2 h-2 rotate-45 bg-[#07150E] border-r-2 border-b-2 border-[#2FA862]`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-xs text-[#9DB0A4] mt-3">
              <span>{chartWindow === '30d' ? 'há 30 dias' : 'há 7 dias'}</span>
              <span>hoje</span>
            </div>
          </div>
        </div>

        {/* Gráfico Donut: Distribuição por status */}
        <div className="lg:col-span-1 bg-[#0D2115] border-2 border-[#385E47] p-5 sm:p-6 rounded-2xl flex flex-col justify-between overflow-hidden">
          <div>
            <h4 className="font-bold text-lg sm:text-xl text-[#F2FAF5] flex items-center gap-2">
              <span>Distribuição por status</span>
              <span
                title="Proporção dos registros históricos agrupados pelo status do serviço"
                className="inline-flex items-center text-[#9DB0A4] hover:text-white cursor-help"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </h4>
            <p className="text-[#9DB0A4] text-xs sm:text-sm mt-0.5 mb-5">Proporção dos registros no período</p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-4 my-auto">
            {/* Donut dimensionado para manter respiro lateral em telas desktop */}
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="13.5" fill="transparent" stroke="#07150E" strokeWidth="7.8" />
                {/* 73% Ativo - verde/700 (#186A3B) */}
                <circle
                  cx="18"
                  cy="18"
                  r="13.5"
                  fill="transparent"
                  stroke="#186A3B"
                  strokeWidth="6.8"
                  strokeDasharray="60.4 84.82"
                  strokeDashoffset="-0.7"
                />
                {/* 16% Indisponível - neutro/200 (#B5BDB8) */}
                <circle
                  cx="18"
                  cy="18"
                  r="13.5"
                  fill="transparent"
                  stroke="#B5BDB8"
                  strokeWidth="6.8"
                  strokeDasharray="12.2 84.82"
                  strokeDashoffset="-62.6"
                />
                {/* 11% Sem métricas - vermelho/600 (#9E2B25) */}
                <circle
                  cx="18"
                  cy="18"
                  r="13.5"
                  fill="transparent"
                  stroke="#9E2B25"
                  strokeWidth="6.8"
                  strokeDasharray="8.1 84.82"
                  strokeDashoffset="-76.2"
                />
              </svg>
            </div>

            {/* Legenda interativa com largura flexível e margem direita garantida */}
            <div className="flex flex-col gap-2.5 w-full min-w-0 flex-1">
              {statusDistributionItems.map((item) => {
                const isSelected = statusFilter === item.status;
                return (
                  <button
                    key={item.status}
                    type="button"
                    onClick={() => toggleStatusFilter(item.status)}
                    className={`flex items-center justify-between gap-2.5 w-full group cursor-pointer rounded-xl transition-opacity ${
                      statusFilter && !isSelected ? 'opacity-55 hover:opacity-100' : 'opacity-100'
                    }`}
                  >
                    <span className={`rounded-lg shrink-0 ${isSelected ? 'ring-2 ring-white/80' : ''}`}>
                      <HistoryStatusPill status={item.status} size="sm" />
                    </span>
                    <span className="font-medium text-sm sm:text-base text-[#9DB0A4] group-hover:text-white transition-colors tabular-nums shrink-0">
                      {item.pct}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Registros */}
      <div className="bg-[#0D2115] border-2 border-[#385E47] p-5 sm:p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
          <div>
            <h4 className="font-bold text-lg sm:text-xl text-[#F2FAF5]">Histórico de registros</h4>
            <p className="text-[#9DB0A4] text-xs sm:text-sm mt-0.5">
              {sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}, clique em uma linha para abrir o serviço
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            {statusFilter && (
              <button
                type="button"
                onClick={() => setStatusFilter(null)}
                className="text-xs text-[#14C45A] underline hover:text-white transition cursor-pointer"
              >
                Limpar filtro ({statusFilter})
              </button>
            )}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="w-full sm:w-auto justify-between sm:justify-center bg-[#1F8A4C] hover:bg-[#2FA862] text-[#F2FAF5] border-2 border-[#14C45A] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition cursor-pointer"
            >
              <span>Ordenar: Data</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <path d="M6 9.5L1.5 3h9L6 9.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Apresentação clara quando não há registros históricos para o filtro aplicado (T29.3 / #113) */}
        {filteredRows.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-[#385E47] rounded-xl bg-[#09180F]">
            <p className="text-sm font-medium text-[#F2FAF5] mb-1">Nenhum registro encontrado</p>
            <p className="text-xs text-[#9DB0A4] mb-4">
              Não existem eventos registrados para o filtro ou termo buscado.
            </p>
            {(statusFilter || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter(null);
                  setSearchTerm('');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#1F8A4C] hover:bg-[#2FA862] text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* =========================================================
                MOBILE (< 768px): Cards de histórico
                ========================================================= */}
            <div className="md:hidden space-y-3">
              {filteredRows.map((row, i) => (
                <div
                  key={`${row.id}-${row.date}`}
                  onClick={() => setSelectedServiceModal(mapHistoryRowToModalData(row, i))}
                  className="p-3.5 rounded-xl bg-[#09180F] border-2 border-[#385E47] hover:border-[#14C45A] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <div className="font-semibold text-sm text-[#F2FAF5]">{row.id}</div>
                      <div className="text-[11px] text-[#9DB0A4]">{row.sub}</div>
                    </div>
                    <HistoryStatusPill status={row.status} size="sm" />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-[#243F2F]">
                      <span className="text-[#9DB0A4]">Localização</span>
                      <span className="text-[#D4E3DA] font-medium">{row.loc || 'Não informada'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#243F2F]">
                      <span className="text-[#9DB0A4]">Data e hora</span>
                      <span className="text-[#D4E3DA]">{row.date}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[#9DB0A4]">Evento</span>
                      <span className="text-[#D4E3DA] font-medium">{row.event}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* =========================================================
                DESKTOP (>= 768px): Tabela completa conforme protótipo
                ========================================================= */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                <thead>
                  <tr className="bg-[#96AA9E] text-[#07150E] text-xs font-semibold">
                    <th className="py-3 px-4 rounded-l-lg w-1/5">Serviço</th>
                    <th className="py-3 px-4 w-1/5">Localização</th>
                    <th className="py-3 px-4 w-1/5">Data e hora</th>
                    <th className="py-3 px-4 w-1/5">Evento</th>
                    <th className="py-3 px-4 w-1/6">
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </th>
                    <th className="py-3 px-4 rounded-r-lg"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-2"></tr>

                  {filteredRows.map((row, i) => (
                    <tr
                      key={`${row.id}-${row.date}`}
                      onClick={() => setSelectedServiceModal(mapHistoryRowToModalData(row, i))}
                      className="border-b border-[#243F2F] hover:bg-[#122B1C] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 rounded-l-lg">
                        <div className="font-semibold text-[#F2FAF5]">{row.id}</div>
                        <div className="text-xs text-[#9DB0A4]">{row.sub}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#D4E3DA]">{row.loc || 'Não informada'}</td>
                      <td className="py-3.5 px-4 text-[#D4E3DA]">{row.date}</td>
                      <td className="py-3.5 px-4 text-[#D4E3DA]">{row.event}</td>
                      <td className="py-3.5 px-4">
                        <HistoryStatusPill status={row.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right rounded-r-lg">
                        <svg
                          className="w-4 h-4 text-[#F2FAF5] inline-block group-hover:translate-x-0.5 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Rodapé da tabela com paginação e SVGs oficiais do Figma */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 text-xs text-[#9DB0A4]">
          <span>Mostrando 1–{filteredRows.length} de 128 registros</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
              className="w-9 h-9 flex items-center justify-center bg-[#0B1C12] border-2 border-[#385E47] rounded-xl hover:bg-[#183825] transition cursor-pointer"
            >
              <svg className="w-[8px] h-[13px]" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.8125 1.5625L1.5625 7.8125L7.8125 14.0625"
                  strokeWidth="3.125"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="#8FA89B"
                />
              </svg>
            </button>
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border-2 text-xs transition cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#2FA862] text-[#F2FAF5] border-[#14C45A] font-bold'
                    : 'bg-[#0B1C12] border-[#385E47] text-[#8FA89B] font-medium hover:bg-[#183825]'
                }`}
              >
                {page}
              </button>
            ))}
            <span className="w-9 h-9 flex items-center justify-center bg-[#0B1C12] border-2 border-[#385E47] rounded-xl text-[#8FA89B] font-medium">
              ...
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(22)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border-2 text-xs transition cursor-pointer ${
                currentPage === 22
                  ? 'bg-[#2FA862] text-[#F2FAF5] border-[#14C45A] font-bold'
                  : 'bg-[#0B1C12] border-[#385E47] text-[#8FA89B] font-medium hover:bg-[#183825]'
              }`}
            >
              22
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(22, p + 1))}
              aria-label="Próxima página"
              className="w-9 h-9 flex items-center justify-center bg-[#0B1C12] border-2 border-[#385E47] rounded-xl hover:bg-[#183825] transition cursor-pointer"
            >
              <svg className="w-[24px] h-[24px]" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12.5 21.25L18.75 15L12.5 8.75"
                  strokeWidth="3.125"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="#8FA89B"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de detalhes do serviço ao clicar em uma linha do histórico */}
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
            <ServiceModal service={selectedServiceModal} />
          </div>
        </div>
      )}
    </div>
  );
};