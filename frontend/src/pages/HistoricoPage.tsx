import React from 'react';

export const HistoricoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#060D09] text-white p-8 font-sans">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Histórico</h1>
          <h2 className="text-xl font-semibold mb-2">Verifique resultados e análises passadas</h2>
          <p className="text-gray-400 text-sm">Última atualização: 17/10/2026 14:32 · atualiza a cada 5 s</p>
        </div>
        <div className="relative">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Pesquise por um serviço aqui" className="bg-[#0B150F] border border-[#1A2E20] rounded-lg pl-10 pr-4 py-2 w-80 text-sm focus:outline-none focus:border-[#2FA862] text-white placeholder-gray-500" />
        </div>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { title: 'Registros no período', value: '128', sub: '▲ 12% vs. período anterior' },
          { title: 'Serviços ativos', value: '94', sub: '73% do total' },
          { title: 'Indisponíveis', value: '21', sub: '▲ 3 novos hoje' },
          { title: 'Sem métricas', value: '13', sub: '10% do total' }
        ].map((kpi, i) => (
          <div key={i} className="bg-[#0C1711] border border-[#1A2E20] p-5 rounded-xl">
            <h4 className="text-gray-400 text-sm mb-2">{kpi.title}</h4>
            <div className="text-3xl font-bold mb-2">{kpi.value}</div>
            <div className="text-xs text-gray-400">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Gráfico de Barras */}
        <div className="col-span-2 bg-[#0C1711] border border-[#1A2E20] p-6 rounded-xl">
          <h4 className="font-bold text-lg">Eventos ao longo do tempo</h4>
          <p className="text-gray-400 text-xs mb-6">Quantidade de registros por dia <span className="underline cursor-pointer">últimos 30 dias</span></p>
          <div className="h-40 flex items-end justify-between gap-1 mt-4">
            {/* Barras simuladas */}
            {[4, 5, 3, 7, 8, 5, 9, 10, 6, 7, 9, 8, 5, 4, 3, 6, 7, 6, 8, 7, 9, 8, 6, 7].map((val, i) => (
              <div key={i} className="w-full bg-[#1B5E36] hover:bg-[#2FA862] rounded-t-sm transition-colors" style={{ height: `${val * 10}%` }}></div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>há 30 dias</span><span>hoje</span>
          </div>
        </div>

        {/* Gráfico Donut */}
        <div className="col-span-1 bg-[#0C1711] border border-[#1A2E20] p-6 rounded-xl relative">
          <h4 className="font-bold text-lg flex items-center gap-2">Distribuição por status <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></h4>
          <p className="text-gray-400 text-xs mb-6">Proporção dos registros no período</p>
          <div className="flex items-center justify-between">
            {/* Donut Mock */}
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#2a2a2a" strokeWidth="4"></circle>
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#2FA862" strokeWidth="4" strokeDasharray="73 27" strokeDashoffset="0"></circle>
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#EF4444" strokeWidth="4" strokeDasharray="16 84" strokeDashoffset="-73"></circle>
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#6B7280" strokeWidth="4" strokeDasharray="11 89" strokeDashoffset="-89"></circle>
              </svg>
            </div>
            {/* Legenda */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2"><StatusBadge status="Ativo" /> <span className="font-bold">73%</span></div>
              <div className="flex items-center gap-2"><StatusBadge status="Indisponível" /> <span className="font-bold">16%</span></div>
              <div className="flex items-center gap-2"><StatusBadge status="Sem métricas" /> <span className="font-bold">11%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Histórico */}
      <div className="bg-[#0C1711] border border-[#1A2E20] p-6 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="font-bold text-lg text-white">Histórico de registros</h4>
            <p className="text-gray-400 text-xs mt-1">Mais recentes primeiro, clique em uma linha para abrir o serviço</p>
          </div>
          <button className="bg-[#1E663B] hover:bg-[#154D2B] text-white border border-[#2FA862] px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition">
            Ordenar: Data <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-[#9BAE9E] text-[#0C1711] text-xs font-semibold">
                <th className="py-2.5 px-4 rounded-l-md w-1/4">Serviço</th>
                <th className="py-2.5 px-4 w-1/4">Localização</th>
                <th className="py-2.5 px-4 w-1/6">Data e hora</th>
                <th className="py-2.5 px-4 w-1/6">Evento</th>
                <th className="py-2.5 px-4 flex items-center gap-1 w-1/6">
                  Status 
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </th>
                <th className="py-2.5 px-4 rounded-r-md"></th>
              </tr>
            </thead>
            <tbody>
             
              <tr className="h-2"></tr>

              {[
                { id: 'ASTAH-XYZ', sub: 'ID 0041', loc: 'São Francisco - EUA', date: '17/10/2026 14:20', event: 'Perdeu conexão', status: 'Indisponível' },
                { id: 'ASTAH-ABC', sub: 'ID 0042', loc: 'Tóquio - Japão', date: '17/10/2026 11:45', event: 'Serviço descoberto', status: 'Ativo' },
                { id: 'ASTAH-DEF', sub: 'ID 0043', loc: 'Berlim - Alemanha', date: '16/10/2026 10:00', event: 'Parou de enviar métricas', status: 'Sem métricas' },
                { id: 'ASTAH-GHI', sub: 'ID 0044', loc: 'Londres - Reino Unido', date: '15/10/2026 09:15', event: 'Conectado', status: 'Ativo' },
                { id: 'ASTAH-JKL', sub: 'ID 0045', loc: 'Sydney - Austrália', date: '13/10/2026 08:30', event: 'Serviço removido', status: 'Removido' },
                { id: 'ASTAH-MNO', sub: 'ID 0046', loc: 'Canberra - Austrália', date: '12/10/2026 14:32', event: 'Conectado', status: 'Ativo' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-[#1A2E20] hover:bg-[#111F16] transition-colors cursor-pointer group">
                  <td className="py-3.5 px-4 rounded-l-md">
                    <div className="font-semibold text-white">{row.id}</div>
                    <div className="text-xs text-gray-500">{row.sub}</div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-300">{row.loc}</td>
                  <td className="py-3.5 px-4 text-gray-300">{row.date}</td>
                  <td className="py-3.5 px-4 text-gray-300">{row.event}</td>
                  <td className="py-3.5 px-4"><StatusBadge status={row.status} /></td>
                  <td className="py-3.5 px-4 text-right rounded-r-md">
                    <svg className="w-5 h-5 text-white font-bold inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

       
        <div className="flex justify-between items-center mt-6 text-[11px] text-gray-400">
          <span>Mostrando 1–6 de 128 registros</span>
          <div className="flex gap-1.5">
            <button className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition">&lt;</button>
            <button className="w-7 h-7 flex items-center justify-center bg-[#1E663B] text-white border border-[#2FA862] rounded font-medium">1</button>
            <button className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition">2</button>
            <button className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition">3</button>
            <span className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded text-gray-500">...</span>
            <button className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition">22</button>
            <button className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};


const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'Ativo') {
    return (
      <span className="bg-[#2FA862] text-white px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 text-[11px] font-medium border border-[#2FA862]">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Ativo
      </span>
    );
  }
  if (status === 'Indisponível') {
    return (
      <span className="bg-[#A42F2F] text-white px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 text-[11px] font-medium border border-[#A42F2F]">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> Indisponível
      </span>
    );
  }
  if (status === 'Removido') {
    return (
      <span className="bg-transparent text-gray-300 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 text-[11px] font-medium border border-gray-500">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg> Removido
      </span>
    );
  }
  return (
    <span className="bg-transparent text-gray-300 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 text-[11px] font-medium border border-gray-500">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg> Sem métricas
    </span>
  );
};