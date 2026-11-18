import React, { useState, useEffect, useMemo } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { ServiceModal } from '../components/ServiceModal';
import type { ModalServiceData } from '../components/ServiceModal';

interface HistoryEventRow {
  id: string;
  sub: string;
  loc: string;
  date: string;
  timestamp: number;
  event: string;
  status: 'Ativo' | 'Indisponível' | 'Sem métricas' | 'Removido';
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

export const HistoricoPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [chartWindow, setChartWindow] = useState<'30d' | '7d'>('30d');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedServiceModal, setSelectedServiceModal] = useState<ModalServiceData | null>(null);

  const [refreshIntervalSec] = useState<number>(5);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(() => new Date());

  const formatDateTime = (date: Date) => {
    return date
      .toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(',', '');
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdatedAt(new Date());
    }, refreshIntervalSec * 1000);

    return () => clearInterval(timer);
  }, [refreshIntervalSec]);

  const toggleStatusFilter = (status: string) => {
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

  return (
    <div className="min-h-screen bg-[#060D09] text-white p-4 sm:p-6 md:p-8 font-sans pb-24 md:pb-20">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 sm:mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Histórico</h1>
          <h2 className="text-base sm:text-xl font-semibold mb-1.5">Verifique resultados e análises passadas</h2>
          <p className="text-gray-400 text-xs sm:text-sm">
            Última atualização: <span className="text-gray-200">{formatDateTime(lastUpdatedAt)}</span> · atualiza a cada{' '}
            {refreshIntervalSec} s
          </p>
        </div>

        <div className="relative w-full lg:w-80">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquise por um serviço aqui"
            className="bg-[#0B150F] border border-[#1A2E20] rounded-lg pl-9 sm:pl-10 pr-4 py-2 w-full text-xs sm:text-sm focus:outline-none focus:border-[#2FA862] text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { title: 'Registros no período', value: '128', sub: '▲ 12% vs. período anterior', filterValue: null },
          { title: 'Serviços ativos', value: '94', sub: '73% do total', filterValue: 'Ativo' },
          { title: 'Indisponíveis', value: '21', sub: '▲ 3 novos hoje', filterValue: 'Indisponível' },
          { title: 'Sem métricas', value: '13', sub: '10% do total', filterValue: 'Sem métricas' },
        ].map((kpi, i) => {
          const isSelected = kpi.filterValue !== null && statusFilter === kpi.filterValue;
          return (
            <button
              key={i}
              type="button"
              onClick={() => (kpi.filterValue ? toggleStatusFilter(kpi.filterValue) : setStatusFilter(null))}
              className={`text-left bg-[#0C1711] border p-4 sm:p-5 rounded-xl transition-colors cursor-pointer ${
                isSelected ? 'border-[#2FA862] bg-[#112419]' : 'border-[#1A2E20] hover:border-[#2FA862]/60'
              }`}
            >
              <h4 className="text-gray-400 text-xs sm:text-sm mb-2">{kpi.title}</h4>
              <div className="text-2xl sm:text-3xl font-bold mb-2">{kpi.value}</div>
              <div className="text-[11px] sm:text-xs text-gray-400">{kpi.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-7">
        {/* Gráfico de Barras: Eventos ao longo do tempo */}
        <div className="lg:col-span-2 bg-[#0C1711] border border-[#1A2E20] p-4 sm:p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-base sm:text-lg">Eventos ao longo do tempo</h4>
            <p className="text-gray-400 text-xs mt-0.5 mb-8">
              Quantidade de registros por dia{' '}
              <button
                type="button"
                onClick={() => setChartWindow((prev) => (prev === '30d' ? '7d' : '30d'))}
                title="Alternar janela temporal"
                className="underline text-gray-300 hover:text-[#4ADE80] cursor-pointer"
              >
                {chartWindow === '30d' ? 'últimos 30 dias' : 'últimos 7 dias'}
              </button>
            </p>
          </div>

          <div>
            <div className="h-36 sm:h-44 flex items-end justify-between gap-1.5 mt-2">
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
                    {/* Barra */}
                    <div
                      className="w-full bg-[#1B5E36] group-hover:bg-[#2FA862] group-focus:bg-[#2FA862] rounded-t-sm transition-colors"
                      style={{ height: `${item.count * 10}%` }}
                    />

                    {/* Balão flutuante acima do topo exato da coluna */}
                    <div
                      style={{ bottom: `calc(${item.count * 10}% + 8px)` }}
                      className={`pointer-events-none opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus:opacity-100 group-focus:scale-100 transition-all duration-150 absolute ${tooltipPositionClass} z-20 bg-[#08150E] border border-[#2FA862] text-white rounded-lg px-2.5 py-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.85)] whitespace-nowrap`}
                    >
                      <div className="text-[10px] text-gray-300 leading-tight">{item.date}</div>
                      <div className="text-xs font-bold text-[#4ADE80] leading-tight mt-0.5">
                        {item.count} {item.count === 1 ? 'registro' : 'registros'}
                      </div>

                      {/* Setinha inferior do balão */}
                      <span
                        className={`absolute -bottom-[5px] ${arrowPositionClass} w-2 h-2 rotate-45 bg-[#08150E] border-r border-b border-[#2FA862]`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-xs text-gray-400 mt-2.5">
              <span>{chartWindow === '30d' ? 'há 30 dias' : 'há 7 dias'}</span>
              <span>hoje</span>
            </div>
          </div>
        </div>

        {/* Gráfico Donut: Distribuição por status */}
        <div className="lg:col-span-1 bg-[#0C1711] border border-[#1A2E20] p-4 sm:p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-base sm:text-lg flex items-center gap-2">
              <span>Distribuição por status</span>
              <span
                title="Proporção dos registros históricos agrupados pelo status do serviço"
                className="inline-flex items-center text-gray-400 hover:text-gray-200 cursor-help"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </h4>
            <p className="text-gray-400 text-xs mt-0.5 mb-5">Proporção dos registros no período</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-auto">
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="14.5" fill="transparent" stroke="#1A2E20" strokeWidth="5.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="14.5"
                  fill="transparent"
                  stroke="#2FA862"
                  strokeWidth="5.5"
                  strokeDasharray="66.5 91.1"
                  strokeDashoffset="0"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14.5"
                  fill="transparent"
                  stroke="#EF4444"
                  strokeWidth="5.5"
                  strokeDasharray="14.6 91.1"
                  strokeDashoffset="-66.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14.5"
                  fill="transparent"
                  stroke="#6B7280"
                  strokeWidth="5.5"
                  strokeDasharray="10 91.1"
                  strokeDashoffset="-81.1"
                />
              </svg>
            </div>

            <div className="flex flex-col gap-2.5 w-full sm:w-auto">
              {[
                { status: 'Ativo', pct: '73%' },
                { status: 'Indisponível', pct: '16%' },
                { status: 'Sem métricas', pct: '11%' },
              ].map((item) => (
                <button
                  key={item.status}
                  type="button"
                  onClick={() => toggleStatusFilter(item.status)}
                  className={`flex items-center justify-between gap-2.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === item.status ? 'bg-[#1A2E20] ring-1 ring-[#2FA862]' : 'hover:bg-[#111F16]'
                  }`}
                >
                  <StatusBadge status={item.status} size="sm" />
                  <span className="font-bold text-sm text-gray-200">{item.pct}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Registros */}
      <div className="bg-[#0C1711] border border-[#1A2E20] p-4 sm:p-6 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
          <div>
            <h4 className="font-bold text-base sm:text-lg text-white">Histórico de registros</h4>
            <p className="text-gray-400 text-xs mt-0.5">
              {sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}, clique em uma linha para abrir o serviço
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            {statusFilter && (
              <button
                type="button"
                onClick={() => setStatusFilter(null)}
                className="text-xs text-[#4ADE80] underline hover:text-white transition cursor-pointer"
              >
                Limpar filtro ({statusFilter})
              </button>
            )}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="w-full sm:w-auto justify-between sm:justify-center bg-[#1E663B] hover:bg-[#154D2B] text-white border border-[#2FA862] px-4 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-2 transition cursor-pointer"
            >
              <span>Ordenar: Data</span>
              <svg
                className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* =========================================================
            MOBILE (< 768px): Cards de histórico
            ========================================================= */}
        <div className="md:hidden space-y-3">
          {filteredRows.map((row, i) => (
            <div
              key={`${row.id}-${row.date}`}
              onClick={() => setSelectedServiceModal(mapHistoryRowToModalData(row, i))}
              className="p-3.5 rounded-xl bg-[#09120D] border border-[#1A2E20] hover:border-[#2FA862] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <div className="font-semibold text-sm text-white">{row.id}</div>
                  <div className="text-[11px] text-gray-400">{row.sub}</div>
                </div>
                <StatusBadge status={row.status} size="sm" />
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#1A2E20]/80">
                  <span className="text-gray-400">Localização</span>
                  <span className="text-gray-200 font-medium">{row.loc || 'Não informada'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#1A2E20]/80">
                  <span className="text-gray-400">Data e hora</span>
                  <span className="text-gray-200">{row.date}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-400">Evento</span>
                  <span className="text-gray-200 font-medium">{row.event}</span>
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
              <tr className="bg-[#9BAE9E] text-[#0C1711] text-xs font-semibold">
                <th className="py-2.5 px-4 rounded-l-md w-1/5">Serviço</th>
                <th className="py-2.5 px-4 w-1/5">Localização</th>
                <th className="py-2.5 px-4 w-1/5">Data e hora</th>
                <th className="py-2.5 px-4 w-1/5">Evento</th>
                <th className="py-2.5 px-4 w-1/6">
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </th>
                <th className="py-2.5 px-4 rounded-r-md"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-2"></tr>

              {filteredRows.map((row, i) => (
                <tr
                  key={`${row.id}-${row.date}`}
                  onClick={() => setSelectedServiceModal(mapHistoryRowToModalData(row, i))}
                  className="border-b border-[#1A2E20] hover:bg-[#111F16] transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 rounded-l-md">
                    <div className="font-semibold text-white">{row.id}</div>
                    <div className="text-xs text-gray-500">{row.sub}</div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-300">{row.loc || 'Não informada'}</td>
                  <td className="py-3.5 px-4 text-gray-300">{row.date}</td>
                  <td className="py-3.5 px-4 text-gray-300">{row.event}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={row.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right rounded-r-md">
                    <svg
                      className="w-4 h-4 text-white inline-block group-hover:translate-x-0.5 transition-transform"
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

        {/* Rodapé da tabela com paginação */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 text-xs text-gray-400">
          <span>Mostrando 1–{filteredRows.length} de 128 registros</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition cursor-pointer"
            >
              &lt;
            </button>
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 flex items-center justify-center rounded transition cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#1E663B] text-white border border-[#2FA862] font-medium'
                    : 'border border-[#1A2E20] hover:bg-[#1A2E20]'
                }`}
              >
                {page}
              </button>
            ))}
            <span className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded text-gray-500">
              ...
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(22)}
              className={`w-7 h-7 flex items-center justify-center rounded transition cursor-pointer ${
                currentPage === 22
                  ? 'bg-[#1E663B] text-white border border-[#2FA862] font-medium'
                  : 'border border-[#1A2E20] hover:bg-[#1A2E20]'
              }`}
            >
              22
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(22, p + 1))}
              className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition cursor-pointer"
            >
              &gt;
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