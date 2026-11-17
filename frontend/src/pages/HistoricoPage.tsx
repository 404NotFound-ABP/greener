import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';

const historyData = [
  { id: 'ASTAH-XYZ', sub: 'ID 0041', loc: 'São Francisco - EUA', date: '17/10/2026 14:20', event: 'Perdeu conexão', status: 'Indisponível' },
  { id: 'ASTAH-ABC', sub: 'ID 0042', loc: 'Tóquio - Japão', date: '17/10/2026 11:45', event: 'Serviço descoberto', status: 'Ativo' },
  { id: 'ASTAH-DEF', sub: 'ID 0043', loc: 'Berlim - Alemanha', date: '16/10/2026 10:00', event: 'Parou de enviar métricas', status: 'Sem métricas' },
  { id: 'ASTAH-GHI', sub: 'ID 0044', loc: 'Londres - Reino Unido', date: '15/10/2026 09:15', event: 'Conectado', status: 'Ativo' },
  { id: 'ASTAH-JKL', sub: 'ID 0045', loc: 'Sydney - Austrália', date: '13/10/2026 08:30', event: 'Serviço removido', status: 'Removido' },
  { id: 'ASTAH-MNO', sub: 'ID 0046', loc: 'Canberra - Austrália', date: '12/10/2026 14:32', event: 'Conectado', status: 'Ativo' },
];

export const HistoricoPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Estados dinâmicos de intervalos e última atualização (T29.2/US09)
  const [collectionIntervalSec] = useState<number>(30);
  const [refreshIntervalSec] = useState<number>(5);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(() => new Date());

  const formatIntervalLabel = (seconds: number) => {
    if (seconds < 60) return `${seconds} s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    return `${Math.floor(seconds / 3600)} h`;
  };

  const formatDateTime = (date: Date) => {
    return date
      .toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
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

  const filteredRows = historyData.filter((row) => {
    const matchesSearch =
      row.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.loc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.event.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? row.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#060D09] text-white p-4 sm:p-6 md:p-8 font-sans pb-24 md:pb-20">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Histórico</h1>
          <h2 className="text-base sm:text-xl font-semibold mb-2">Verifique resultados e análises passadas</h2>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
            Última atualização: <span className="text-gray-200 font-medium">{formatDateTime(lastUpdatedAt)}</span> · coleta a cada{' '}
            <span className="text-gray-200">{formatIntervalLabel(collectionIntervalSec)}</span> · painel atualiza a cada{' '}
            <span className="text-gray-200">{formatIntervalLabel(refreshIntervalSec)}</span> · período:{' '}
            <span className="text-[#A6DEBD] font-medium">Últimos 30 dias</span>
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

      {/* Cards de KPIs: 2 colunas no celular, 4 no desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { title: 'Registros no período', value: '128', period: 'Últimos 30 dias', sub: '▲ 12% vs. período anterior', filterValue: null },
          { title: 'Serviços ativos', value: '94', period: 'Últimos 30 dias', sub: '73% do total', filterValue: 'Ativo' },
          { title: 'Indisponíveis', value: '21', period: 'Últimos 30 dias', sub: '▲ 3 novos hoje', filterValue: 'Indisponível' },
          { title: 'Sem métricas', value: '13', period: 'Últimos 30 dias', sub: '10% do total', filterValue: 'Sem métricas' },
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
              <div className="text-2xl sm:text-3xl font-bold mb-1">{kpi.value}</div>
              <div className="text-[10px] sm:text-[11px] text-[#A6DEBD] mb-1.5">Período: {kpi.period}</div>
              <div className="text-[11px] sm:text-xs text-gray-400">{kpi.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Gráficos: empilhados no celular, lado a lado no desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Gráfico de Barras */}
        <div className="lg:col-span-2 bg-[#0C1711] border border-[#1A2E20] p-4 sm:p-6 rounded-xl">
          <h4 className="font-bold text-base sm:text-lg">Eventos ao longo do tempo</h4>
          <p className="text-gray-400 text-xs mb-6">
            Quantidade de registros por dia <span className="underline cursor-pointer">últimos 30 dias</span>
          </p>
          <div className="h-36 sm:h-40 flex items-end justify-between gap-1 mt-4">
            {[4, 5, 3, 7, 8, 5, 9, 10, 6, 7, 9, 8, 5, 4, 3, 6, 7, 6, 8, 7, 9, 8, 6, 7].map((val, i) => (
              <div key={i} className="w-full bg-[#1B5E36] hover:bg-[#2FA862] rounded-t-sm transition-colors" style={{ height: `${val * 10}%` }}></div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>há 30 dias</span>
            <span>hoje</span>
          </div>
        </div>

        {/* Gráfico Donut */}
        <div className="lg:col-span-1 bg-[#0C1711] border border-[#1A2E20] p-4 sm:p-6 rounded-xl relative">
          <h4 className="font-bold text-base sm:text-lg flex items-center gap-2">
            Distribuição por status{' '}
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </h4>
          <p className="text-gray-400 text-xs mb-5">Clique em um indicador para filtrar · últimos 30 dias</p>
          <div className="flex flex-col sm:flex-row lg:flex-row items-center justify-between gap-4">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#2a2a2a" strokeWidth="4"></circle>
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#2FA862" strokeWidth="4" strokeDasharray="73 27" strokeDashoffset="0"></circle>
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#EF4444" strokeWidth="4" strokeDasharray="16 84" strokeDashoffset="-73"></circle>
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#6B7280" strokeWidth="4" strokeDasharray="11 89" strokeDashoffset="-89"></circle>
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
                  className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === item.status ? 'bg-[#1A2E20] ring-1 ring-[#2FA862]' : 'hover:bg-[#111F16]'
                  }`}
                >
                  <StatusBadge status={item.status} size="sm" />
                  <span className="font-bold text-sm">{item.pct}</span>
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
            <p className="text-gray-400 text-xs mt-1">Mais recentes primeiro, toque em um item para abrir o serviço</p>
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
              className="w-full sm:w-auto justify-between sm:justify-center bg-[#1E663B] hover:bg-[#154D2B] text-white border border-[#2FA862] px-4 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-2 transition"
            >
              <span>Ordenar: Data</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* =========================================================
            MOBILE (< 768px): Cards de histórico conforme protótipo Figma
            ========================================================= */}
        <div className="md:hidden space-y-3">
          {filteredRows.map((row, i) => (
            <div
              key={i}
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
                  <span className="text-gray-200 font-medium">{row.loc}</span>
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
            DESKTOP (>= 768px): Tabela completa original
            ========================================================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-[#9BAE9E] text-[#0C1711] text-xs font-semibold">
                <th className="py-2.5 px-4 rounded-l-md w-1/4">Serviço</th>
                <th className="py-2.5 px-4 w-1/4">Localização</th>
                <th className="py-2.5 px-4 w-1/6">Data e hora</th>
                <th className="py-2.5 px-4 w-1/6">Evento</th>
                <th className="py-2.5 px-4 flex items-center gap-1 w-1/6">
                  Status
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </th>
                <th className="py-2.5 px-4 rounded-r-md"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-2"></tr>

              {filteredRows.map((row, i) => (
                <tr key={i} className="border-b border-[#1A2E20] hover:bg-[#111F16] transition-colors cursor-pointer group">
                  <td className="py-3.5 px-4 rounded-l-md">
                    <div className="font-semibold text-white">{row.id}</div>
                    <div className="text-xs text-gray-500">{row.sub}</div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-300">{row.loc}</td>
                  <td className="py-3.5 px-4 text-gray-300">{row.date}</td>
                  <td className="py-3.5 px-4 text-gray-300">{row.event}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={row.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right rounded-r-md">
                    <svg className="w-5 h-5 text-white font-bold inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 text-[11px] text-gray-400">
          <span>Mostrando 1–{filteredRows.length} de 128 registros</span>
          <div className="flex gap-1.5">
            <button type="button" className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition">&lt;</button>
            <button type="button" className="w-7 h-7 flex items-center justify-center bg-[#1E663B] text-white border border-[#2FA862] rounded font-medium">1</button>
            <button type="button" className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition">2</button>
            <button type="button" className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition">3</button>
            <span className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded text-gray-500">...</span>
            <button type="button" className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition">22</button>
            <button type="button" className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};