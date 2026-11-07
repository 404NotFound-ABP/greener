import React, { useState, useRef, useEffect } from 'react';

const servicesData = [
  { id: 'ASTAH-XYZ', sub: 'ID 0041', loc: 'Caçapava', status: 'Ativo', cons: '1.240', em: '459', color: '#2FA862' },
  { id: 'ASTAH-ABC', sub: 'ID 0102', loc: 'São Paulo - BR', status: 'Ativo', cons: '1.105', em: '88', color: '#3B82F6' },
  { id: 'ASTAH-DEF', sub: 'ID 0087', loc: 'Berlin - DE', status: 'Ativo', cons: '962', em: '366', color: '#F59E0B' },
  { id: 'ASTAH-GHI', sub: 'ID 0230', loc: 'Sydney - AU', status: 'Ativo', cons: '874', em: '481', color: '#8B5CF6' },
  { id: 'ASTAH-PQR', sub: 'ID 0466', loc: 'Tóquio - JP', status: 'Indisponível', cons: '512 (último)', em: '236 (último)', color: '#EF4444' },
  { id: 'ASTAH-STU', sub: 'ID 0501', loc: 'Cidade do México - MX', status: 'Sem métricas', cons: '—', em: '—', color: '#6B7280' },
];

const CustomDropdown = ({ 
  label, 
  placeholder, 
  options 
}: { 
  label: string, 
  placeholder: string, 
  options: string[] 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <label className="block text-white text-[11px] mb-1.5">{label}</label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center bg-[#0C1711] border ${isOpen ? 'border-[#329656]' : 'border-[#1A2E20]'} text-gray-300 text-[11px] px-3 py-2.5 rounded-md hover:border-[#329656] transition-colors`}
      >
        {isOpen && placeholder.startsWith('Todas') ? placeholder.replace('Todas as', 'Digite uma').replace('Todos os', 'Digite um') : placeholder}
        <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full bg-[#0C1711] border border-[#329656] rounded-md p-1.5 z-50 shadow-2xl flex flex-col gap-1.5">
          {options.map((option, idx) => (
            <button 
              key={idx}
              className="w-full text-left text-gray-300 text-[11px] px-3 py-2 border border-[#1A2E20] rounded-[4px] hover:bg-[#15241A] hover:border-[#329656] transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>(['ASTAH-XYZ']);

  const toggleSelection = (id: string) => {
    setSelectedServices(prev => {
      if (prev.includes(id)) return prev.filter(serviceId => serviceId !== id);
      if (prev.length < 5) return [...prev, id];
      return prev;
    });
  };

  const activeServices = servicesData.filter(s => selectedServices.includes(s.id));

  const getGraphPath = (index: number) => {
    const paths = [
      "M0,70 Q150,20 300,50 T600,60 T1000,40",
      "M0,80 Q200,90 400,30 T700,40 T1000,20",
      "M0,40 Q100,60 250,20 T500,80 T1000,50",
      "M0,90 Q300,30 500,70 T800,20 T1000,60",
      "M0,30 Q150,80 350,40 T650,90 T1000,30"
    ];
    return paths[index % paths.length];
  };

  return (
    <div className="min-h-screen bg-[#060D09] text-white p-8 font-sans pb-20">
      
      {/* Cabeçalho com Pesquisa à Direita */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboards</h1>
          <h2 className="text-xl font-semibold mb-2">Resultados cumulativos</h2>
          <p className="text-gray-400 text-sm">Última atualização: 17/10/2026 14:32 · atualiza a cada 5 s</p>
        </div>
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Pesquise por um serviço aqui" className="bg-[#0B150F] border border-[#1A2E20] rounded-lg pl-9 pr-4 py-2 w-80 text-xs focus:outline-none focus:border-[#2FA862] text-white placeholder-gray-500" />
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4">Consumo de KPIs em tempo real</h3>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { title: 'Consumo total', value: '128 kWh', sub: '▲ 4% vs. período anterior' },
          { title: 'Emissão total', value: '54 kgCO₂e', sub: '▲ 3% vs. período anterior' },
          { title: 'Serviços ativos', value: '94', sub: '73% do total' },
          { title: 'Indisponíveis', value: '21', sub: '' }
        ].map((kpi, i) => (
          <div key={i} className="bg-[#0C1711] border border-[#1A2E20] p-5 rounded-xl">
            <h4 className="text-gray-400 text-sm mb-2">{kpi.title}</h4>
            <div className="text-3xl font-bold mb-2">{kpi.value}</div>
            {kpi.sub && <div className="text-xs text-gray-400">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Barra de Filtros Logo Abaixo das Métricas (Conforme o Design) */}
      <div className="flex items-end gap-3 mb-10 w-full relative z-30">
        <CustomDropdown label="País" placeholder="Todos os países" options={['Brasil', 'Estados Unidos', 'Reino Unido', 'Canadá', 'Coreia do sul']} />
        <CustomDropdown label="Região" placeholder="Todas as regiões" options={['Região Sudeste', 'Região Norte', 'Região Sul', 'Região Nordeste', 'Região Centro-oeste']} />
        <CustomDropdown label="Estado" placeholder="Todos os estados" options={['São Paulo', 'Rio de Janeiro', 'Minas Gerais']} />
        <CustomDropdown label="Cidade" placeholder="Todas as cidades" options={['Jacareí', 'Caçapava', 'Taubaté', 'São Paulo', 'Mogi das cruzes']} />
        
        <div className="flex items-center gap-6 ml-4 h-[38px]">
          <button className="text-white text-[11px] underline hover:text-gray-300 transition-colors whitespace-nowrap">Limpar filtros</button>
          <button className="flex items-center gap-2 bg-[#2FA862] hover:bg-[#258248] text-white px-4 h-full rounded-md text-[11px] font-medium transition-colors whitespace-nowrap">
            Exportar <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </button>
        </div>
      </div>

      {/* Título do Gráfico */}
      <h3 className="text-2xl font-bold mb-4">
        {selectedServices.length === 1 ? `Serviço - ${selectedServices[0]}` : selectedServices.length > 1 ? `Comparando ${selectedServices.length} serviços` : 'Nenhum serviço selecionado'}
      </h3>

      {/* Gráfico Dinâmico */}
      <div className="bg-[#0C1711] border border-[#1A2E20] p-6 rounded-xl mb-8 relative z-10">
        <div className="flex justify-between mb-6">
          <div>
            <h4 className="font-bold text-lg">Uso em tempo real</h4>
            <p className="text-gray-400 text-xs">Compare até 5 serviços · consumo em kWh</p>
            <div className="text-3xl font-bold mt-2">kWh <span className="text-sm font-normal text-gray-400">total dos {selectedServices.length} serviços</span></div>
          </div>
          <div className="flex gap-2 h-fit">
            <span className="border border-[#1A2E20] text-gray-300 px-3 py-1 rounded-full text-xs">{selectedServices.length} de 5 serviços</span>
            <span className="border border-[#1A2E20] text-[#2FA862] px-3 py-1 rounded-full text-xs flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#2FA862] animate-pulse"></span> Ao vivo · atualiza a cada 5 s</span>
          </div>
        </div>
        
        <div className="h-48 relative border-b border-[#1A2E20] mb-4">
           {selectedServices.length > 0 ? (
             <svg className="w-full h-full relative z-10" preserveAspectRatio="none" viewBox="0 0 1000 100">
               {activeServices.map((service, index) => (
                 <path 
                   key={service.id} d={getGraphPath(index)} fill="none" stroke={service.color} strokeWidth="2" 
                   className="animate-[dash_2s_ease-out_forwards]" style={{ strokeDasharray: 1200, strokeDashoffset: 1200 }}
                 />
               ))}
             </svg>
           ) : (
             <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm z-10">
               Selecione um serviço abaixo para visualizar no gráfico.
             </div>
           )}
           <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
           
           <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-[#1A2E20] w-full h-0"></div>
              <div className="border-t border-[#1A2E20] w-full h-0"></div>
              <div className="border-t border-[#1A2E20] w-full h-0"></div>
              <div className="border-t border-[#1A2E20] w-full h-0"></div>
           </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>-60 min</span><span>-45 min</span><span>-30 min</span><span>-15 min</span><span>agora</span>
        </div>
      </div>

      {/* Tabela de Serviços */}
      <div className="bg-[#0C1711] border border-[#1A2E20] p-6 rounded-xl relative z-0">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="font-bold text-lg">Todos os serviços</h4>
            <p className="text-gray-400 text-xs">128 serviços · marque até 5 para comparar</p>
          </div>
          <span className="border border-[#1A2E20] text-gray-300 px-3 py-1 rounded-full text-xs h-fit">
            {selectedServices.length} de {selectedServices.length > 0 ? selectedServices.length : 1} selecionado
          </span>
        </div>

        <div className="flex justify-between items-end mb-4">
          <div className="flex gap-6">
            <div>
              <div className="text-gray-400 text-xs mb-2">Ordenar por</div>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 border border-[#1A2E20] rounded text-xs text-gray-300 hover:bg-[#15241A] transition">Ordem alfabética (A–Z)</button>
                <button className="px-4 py-1.5 bg-[#1B5E36] text-white rounded text-xs font-medium border border-[#2FA862]">Maior valor</button>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-2">Ordenar por métrica</div>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 border border-[#2FA862] text-[#4ADE80] rounded text-xs hover:bg-[#15241A] transition">Emissão (CO₂e)</button>
                <button className="px-4 py-1.5 bg-[#9A7217] text-white border border-[#D97706] rounded text-xs font-medium">Energia (kWh)</button>
              </div>
            </div>
          </div>
          <div className="text-gray-500 text-xs mb-1">Mostrando 6 de 128 serviços</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-[#9BAE9E] text-[#0C1711] text-xs font-semibold">
                <th className="py-2.5 px-4 rounded-l-md w-10 text-center"></th>
                <th className="py-2.5 px-4 border-l border-[#7A8C7C]"><div className="flex items-center justify-between">Serviço <span className="text-[10px]">▼</span></div></th>
                <th className="py-2.5 px-4 border-l border-[#7A8C7C]"><div className="flex items-center justify-between">Localização <span className="text-[10px]">▼</span></div></th>
                <th className="py-2.5 px-4 border-l border-[#7A8C7C]"><div className="flex items-center justify-between">Status <span className="text-[10px]">▼</span></div></th>
                <th className="py-2.5 px-4 border-l border-[#7A8C7C]"><div className="flex items-center justify-between">Consumo no período (kWh) <span className="text-[10px]">▼</span></div></th>
                <th className="py-2.5 px-4 border-l border-[#7A8C7C] rounded-r-md"><div className="flex items-center justify-between">Emissão no período (kgCO₂e) <span className="text-[10px]">▼</span></div></th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-2"></tr>
              {servicesData.map((row) => {
                const isChecked = selectedServices.includes(row.id);
                const isDisabled = !isChecked && selectedServices.length >= 5;

                return (
                  <tr 
                    key={row.id} 
                    onClick={() => !isDisabled && toggleSelection(row.id)}
                    className={`border-b border-[#1A2E20] transition-colors cursor-pointer ${isChecked ? 'bg-[#1E663B]' : isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#111F16]'}`}
                  >
                    <td className={`py-3 px-4 rounded-l-md text-center ${isChecked ? 'border-none' : ''}`}>
                      <input type="checkbox" checked={isChecked} readOnly disabled={isDisabled} className="accent-[#2FA862] w-4 h-4 rounded-sm border-gray-600 bg-transparent cursor-pointer" />
                    </td>
                    <td className={`py-3 px-4 ${isChecked ? 'border-none' : ''}`}>
                      <div className="font-semibold text-white">{row.id}</div>
                      <div className={`text-xs ${isChecked ? 'text-gray-300' : 'text-gray-500'}`}>{row.sub}</div>
                    </td>
                    <td className={`py-3 px-4 ${isChecked ? 'text-white border-none' : 'text-gray-300'}`}>{row.loc}</td>
                    <td className={`py-3 px-4 ${isChecked ? 'border-none' : ''}`}><StatusBadge status={row.status} /></td>
                    <td className={`py-3 px-4 ${isChecked ? 'text-white border-none' : 'text-gray-300'}`}>{row.cons}</td>
                    <td className={`py-3 px-4 rounded-r-md ${isChecked ? 'text-white border-none' : 'text-gray-300'}`}>{row.em}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-gray-500">Mostrando 1–6 dos serviços escolhidos</div>
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
  return (
    <span className="bg-transparent text-gray-300 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 text-[11px] font-medium border border-gray-500">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg> Sem métricas
    </span>
  );
};