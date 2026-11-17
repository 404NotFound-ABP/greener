import React, { useState, useRef, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { formatEnvironmentalMetric } from '../utils/environmentalMetrics';

interface DashboardServiceRow {
  id: string;
  sub: string;
  loc: string;
  status: 'Ativo' | 'Indisponível' | 'Sem métricas';
  consKwh: number | null;
  emKgCo2: number | null;
  period: string;
  isEstimated?: boolean;
  color: string;
}

const servicesData: DashboardServiceRow[] = [
  {
    id: 'ASTAH-XYZ',
    sub: 'ID 0041',
    loc: 'Caçapava',
    status: 'Ativo',
    consKwh: 1240,
    emKgCo2: 459,
    period: 'Últimos 7 dias',
    isEstimated: false,
    color: '#2FA862',
  },
  {
    id: 'ASTAH-ABC',
    sub: 'ID 0102',
    loc: 'São Paulo - BR',
    status: 'Ativo',
    consKwh: 1105,
    emKgCo2: 88,
    period: 'Últimos 7 dias',
    isEstimated: true,
    color: '#3B82F6',
  },
  {
    id: 'ASTAH-DEF',
    sub: 'ID 0087',
    loc: 'Berlin - DE',
    status: 'Ativo',
    consKwh: 0.0042,
    emKgCo2: 0.0018,
    period: 'Última 1h',
    isEstimated: false,
    color: '#F59E0B',
  },
  {
    id: 'ASTAH-GHI',
    sub: 'ID 0230',
    loc: 'Sydney - AU',
    status: 'Ativo',
    consKwh: 874,
    emKgCo2: 481,
    period: 'Últimos 7 dias',
    isEstimated: true,
    color: '#8B5CF6',
  },
  {
    id: 'ASTAH-PQR',
    sub: 'ID 0466',
    loc: 'Tóquio - JP',
    status: 'Indisponível',
    consKwh: 512,
    emKgCo2: 236,
    period: 'Último registro (10/10)',
    isEstimated: false,
    color: '#EF4444',
  },
  {
    id: 'ASTAH-STU',
    sub: 'ID 0501',
    loc: 'Cidade do México - MX',
    status: 'Sem métricas',
    consKwh: null,
    emKgCo2: null,
    period: 'Últimos 7 dias',
    isEstimated: false,
    color: '#6B7280',
  },
];

const EstimatedTag: React.FC = () => (
  <span
    title="Valor calculado por modelo de estimativa ambiental"
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#D97706]/15 border border-[#D97706]/50 text-[#FBBF24] text-[10px] font-medium whitespace-nowrap"
  >
    <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    Estimado
  </span>
);

const CustomDropdown = ({
  label,
  placeholder,
  options,
}: {
  label: string;
  placeholder: string;
  options: string[];
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
    <div className="relative w-full md:flex-1" ref={dropdownRef}>
      <label className="block text-white text-[11px] mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center bg-[#0C1711] border ${
          isOpen ? 'border-[#329656]' : 'border-[#1A2E20]'
        } text-gray-300 text-[11px] px-3 py-2.5 rounded-md hover:border-[#329656] transition-colors`}
      >
        {isOpen && placeholder.startsWith('Todas')
          ? placeholder.replace('Todas as', 'Digite uma').replace('Todos os', 'Digite um')
          : placeholder}
        <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full bg-[#0C1711] border border-[#329656] rounded-md p-1.5 z-50 shadow-2xl flex flex-col gap-1.5">
          {options.map((option, idx) => (
            <button
              key={idx}
              type="button"
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
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Últimos 7 dias');
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  const toggleSelection = (id: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(id)) return prev.filter((serviceId) => serviceId !== id);
      if (prev.length < 5) return [...prev, id];
      return prev;
    });
  };

  const filteredServices = servicesData.filter(
    (s) =>
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.loc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeServices = servicesData.filter((s) => selectedServices.includes(s.id));

  const availableSelectedCons = activeServices
    .map((s) => s.consKwh)
    .filter((v): v is number => v !== null && v !== undefined);

  const totalSelectedCons =
    activeServices.length === 0
      ? null
      : availableSelectedCons.length === 0
      ? null
      : availableSelectedCons.reduce((acc, curr) => acc + curr, 0);

  const hasEstimatedInSelection = activeServices.some((s) => s.isEstimated && s.consKwh !== null);
  const formattedChartTotal = formatEnvironmentalMetric(totalSelectedCons, 'kWh');

  const maxCons = Math.max(...servicesData.map((s) => s.consKwh ?? 0), 1);
  const maxEm = Math.max(...servicesData.map((s) => s.emKgCo2 ?? 0), 1);

  const getGraphPath = (index: number) => {
    const paths = [
      'M0,70 Q150,20 300,50 T600,60 T1000,40',
      'M0,80 Q200,90 400,30 T700,40 T1000,20',
      'M0,40 Q100,60 250,20 T500,80 T1000,50',
      'M0,90 Q300,30 500,70 T800,20 T1000,60',
      'M0,30 Q150,80 350,40 T650,90 T1000,30',
    ];
    return paths[index % paths.length];
  };

  const kpiCards: Array<{
    title: string;
    numericValue: number | null;
    unit?: 'kWh' | 'kgCO₂e';
    period?: string;
    isEstimated?: boolean;
    sub: string;
  }> = [
    {
      title: 'Consumo total',
      numericValue: 128,
      unit: 'kWh',
      period: selectedPeriod,
      isEstimated: false,
      sub: '▲ 4% vs. período anterior',
    },
    {
      title: 'Emissão total',
      numericValue: 54,
      unit: 'kgCO₂e',
      period: selectedPeriod,
      isEstimated: true,
      sub: '▲ 3% vs. período anterior',
    },
    {
      title: 'Serviços ativos',
      numericValue: 94,
      period: 'Tempo real',
      sub: '73% do total',
    },
    {
      title: 'Indisponíveis',
      numericValue: 21,
      period: 'Tempo real',
      sub: 'Sem comunicação recente',
    },
  ];

  return (
    <div className="min-h-screen bg-[#060D09] text-white p-4 sm:p-6 md:p-8 font-sans pb-24 md:pb-20">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Dashboards</h1>
          <h2 className="text-base sm:text-xl font-semibold mb-2">Resultados cumulativos</h2>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
            Última atualização: <span className="text-gray-200 font-medium">{formatDateTime(lastUpdatedAt)}</span> · coleta a cada{' '}
            <span className="text-gray-200">{formatIntervalLabel(collectionIntervalSec)}</span> · painel atualiza a cada{' '}
            <span className="text-gray-200">{formatIntervalLabel(refreshIntervalSec)}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Seletor de Período Global (T24.2/US18) */}
          <div className="flex items-center justify-between bg-[#0B150F] border border-[#1A2E20] rounded-lg p-1 text-xs">
            {['Última 1h', 'Últimas 24h', 'Últimos 7 dias'].map((periodOption) => (
              <button
                key={periodOption}
                type="button"
                onClick={() => setSelectedPeriod(periodOption)}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  selectedPeriod === periodOption
                    ? 'bg-[#1D6B3A] text-white font-medium border border-[#2FA862]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {periodOption}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquise por um serviço aqui"
              className="bg-[#0B150F] border border-[#1A2E20] rounded-lg pl-9 pr-4 py-2 w-full text-xs focus:outline-none focus:border-[#2FA862] text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Filtros Mobile-first acima dos KPIs no celular, abaixo no desktop */}
      <div className="flex flex-col md:flex-row md:items-end gap-3 mb-8 w-full relative z-30">
        <CustomDropdown label="País" placeholder="Todos os países" options={['Brasil', 'Estados Unidos', 'Reino Unido', 'Canadá', 'Coreia do sul']} />
        <CustomDropdown label="Região" placeholder="Todas as regiões" options={['Região Sudeste', 'Região Norte', 'Região Sul', 'Região Nordeste', 'Região Centro-oeste']} />
        <CustomDropdown label="Estado" placeholder="Todos os estados" options={['São Paulo', 'Rio de Janeiro', 'Minas Gerais']} />
        <CustomDropdown label="Cidade" placeholder="Todas as cidades" options={['Jacareí', 'Caçapava', 'Taubaté', 'São Paulo', 'Mogi das cruzes']} />

        <div className="flex items-center justify-between md:justify-start gap-4 md:ml-4 h-[38px] pt-1 md:pt-0">
          <button type="button" className="text-white text-[11px] underline hover:text-gray-300 transition-colors whitespace-nowrap">
            Limpar filtros
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 bg-[#2FA862] hover:bg-[#258248] text-white px-4 h-full rounded-md text-[11px] font-medium transition-colors whitespace-nowrap"
          >
            Exportar{' '}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-lg sm:text-xl font-bold">Consumo de KPIs em tempo real</h3>
        <span className="text-xs text-gray-400">
          Período: <strong className="text-gray-200">{selectedPeriod}</strong>
        </span>
      </div>

      {/* KPIs: 2 colunas no celular, 4 no desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {kpiCards.map((kpi, i) => {
          const metric = kpi.unit ? formatEnvironmentalMetric(kpi.numericValue, kpi.unit) : null;
          const isUnavailable = kpi.numericValue === null || kpi.numericValue === undefined;

          return (
            <div key={i} className="bg-[#0C1711] border border-[#1A2E20] p-4 sm:p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                  <h4 className="text-gray-400 text-xs sm:text-sm">{kpi.title}</h4>
                  {kpi.isEstimated && !isUnavailable && <EstimatedTag />}
                </div>

                {isUnavailable ? (
                  <div className="text-base sm:text-xl font-semibold text-gray-400 mb-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    Indisponível
                  </div>
                ) : metric ? (
                  <div className="text-2xl sm:text-3xl font-bold mb-1.5 break-words">
                    {metric.formattedValue}{' '}
                    <span className="text-sm sm:text-lg font-semibold text-[#2FA862]">{kpi.unit}</span>
                  </div>
                ) : (
                  <div className="text-2xl sm:text-3xl font-bold mb-1.5">{kpi.numericValue}</div>
                )}

                {kpi.period && (
                  <div className="text-[10px] sm:text-[11px] text-[#A6DEBD] mb-1.5">Período: {kpi.period}</div>
                )}
              </div>

              {kpi.sub && <div className="text-[11px] sm:text-xs text-gray-400">{kpi.sub}</div>}
            </div>
          );
        })}
      </div>

      {/* Título do Gráfico */}
      <h3 className="text-xl sm:text-2xl font-bold mb-4">
        {selectedServices.length === 1
          ? `Serviço - ${selectedServices[0]}`
          : selectedServices.length > 1
          ? `Comparando ${selectedServices.length} serviços`
          : 'Nenhum serviço selecionado'}
      </h3>

      {/* Gráfico Dinâmico */}
      <div className="bg-[#0C1711] border border-[#1A2E20] p-4 sm:p-6 rounded-xl mb-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="font-bold text-base sm:text-lg">Uso em tempo real</h4>
              {hasEstimatedInSelection && <EstimatedTag />}
            </div>
            <p className="text-gray-400 text-xs">Compare até 5 serviços · consumo em kWh · janela dos últimos 60 min</p>
            <div className="text-2xl sm:text-3xl font-bold mt-2 flex items-baseline gap-2 flex-wrap">
              {formattedChartTotal.isAvailable ? (
                <>
                  <span>{formattedChartTotal.displayWithUnit}</span>
                  <span className="text-xs sm:text-sm font-normal text-gray-400">
                    total dos {selectedServices.length} serviço(s) · {selectedPeriod}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg sm:text-xl text-gray-400 font-semibold">Resultados indisponíveis</span>
                  <span className="text-xs sm:text-sm font-normal text-gray-500">
                    ({selectedServices.length} serviço(s) sem leituras no período)
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 h-fit">
            <span className="border border-[#1A2E20] text-gray-300 px-3 py-1 rounded-full text-xs">
              {selectedServices.length} de 5 serviços
            </span>
            <span className="border border-[#1A2E20] text-[#2FA862] px-3 py-1 rounded-full text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2FA862] animate-pulse"></span> Ao vivo · {formatIntervalLabel(refreshIntervalSec)}
            </span>
          </div>
        </div>

        <div className="h-44 sm:h-48 relative border-b border-[#1A2E20] mb-4">
          {selectedServices.length > 0 ? (
            <svg className="w-full h-full relative z-10" preserveAspectRatio="none" viewBox="0 0 1000 100">
              {activeServices.map((service, index) => (
                <path
                  key={service.id}
                  d={getGraphPath(index)}
                  fill="none"
                  stroke={service.color}
                  strokeWidth="2"
                  className="animate-[dash_2s_ease-out_forwards]"
                  style={{ strokeDasharray: 1200, strokeDashoffset: 1200 }}
                />
              ))}
            </svg>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs sm:text-sm text-center px-4 z-10">
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

        <div className="flex justify-between text-[11px] sm:text-xs text-gray-500">
          <span>-60 min</span>
          <span>-45 min</span>
          <span>-30 min</span>
          <span>-15 min</span>
          <span>agora</span>
        </div>
      </div>

      {/* Lista / Tabela de Serviços */}
      <div className="bg-[#0C1711] border border-[#1A2E20] p-4 sm:p-6 rounded-xl relative z-0">
        <div className="flex flex-wrap justify-between items-start gap-2 mb-5">
          <div>
            <h4 className="font-bold text-base sm:text-lg">Todos os serviços</h4>
            <p className="text-gray-400 text-xs">128 serviços · marque até 5 para comparar</p>
          </div>
          <span className="border border-[#1A2E20] text-gray-300 px-3 py-1 rounded-full text-xs h-fit">
            {selectedServices.length} de 5 selecionados
          </span>
        </div>

        {/* Controles de Ordenação responsivos */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div>
              <div className="text-gray-400 text-xs mb-2">Ordenar por</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-3 sm:px-4 py-1.5 border border-[#1A2E20] rounded text-xs text-gray-300 hover:bg-[#15241A] transition"
                >
                  Ordem alfabética (A–Z)
                </button>
                <button
                  type="button"
                  className="px-3 sm:px-4 py-1.5 bg-[#1B5E36] text-white rounded text-xs font-medium border border-[#2FA862]"
                >
                  Maior valor
                </button>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-2">Ordenar por métrica</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-3 sm:px-4 py-1.5 border border-[#2FA862] text-[#4ADE80] rounded text-xs hover:bg-[#15241A] transition"
                >
                  Emissão (CO₂e)
                </button>
                <button
                  type="button"
                  className="px-3 sm:px-4 py-1.5 bg-[#9A7217] text-white border border-[#D97706] rounded text-xs font-medium"
                >
                  Energia (kWh)
                </button>
              </div>
            </div>
          </div>
          <div className="text-gray-500 text-xs">Mostrando {filteredServices.length} de 128 serviços</div>
        </div>

        {/* =========================================================
            MOBILE (< 768px): Cards empilhados conforme protótipo Figma
            ========================================================= */}
        <div className="md:hidden space-y-3">
          {filteredServices.map((row) => {
            const isChecked = selectedServices.includes(row.id);
            const isDisabled = !isChecked && selectedServices.length >= 5;
            const consFormatted = formatEnvironmentalMetric(row.consKwh, 'kWh');
            const emFormatted = formatEnvironmentalMetric(row.emKgCo2, 'kgCO₂e');

            const consPct = row.consKwh !== null ? Math.min(100, Math.max(6, (row.consKwh / maxCons) * 100)) : 0;
            const emPct = row.emKgCo2 !== null ? Math.min(100, Math.max(6, (row.emKgCo2 / maxEm) * 100)) : 0;

            return (
              <div
                key={row.id}
                onClick={() => !isDisabled && toggleSelection(row.id)}
                className={`p-3.5 rounded-xl border transition-colors cursor-pointer ${
                  isChecked
                    ? 'bg-[#174F2E] border-[#22D55B]'
                    : isDisabled
                    ? 'bg-[#09120D] border-[#1A2E20] opacity-50 cursor-not-allowed'
                    : 'bg-[#09120D] border-[#1A2E20]'
                }`}
              >
                {/* Linha 1: Checkbox + Nome + StatusBadge */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      disabled={isDisabled}
                      className="mt-1 accent-[#2FA862] w-4 h-4 rounded-sm shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-white truncate">{row.id}</div>
                      <div className="text-[11px] text-gray-400">{row.sub}</div>
                    </div>
                  </div>
                  <StatusBadge status={row.status} size="sm" />
                </div>

                {/* Linha 2: Localização + Período */}
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#1A2E20]/80">
                  <span className="text-gray-400">Localização</span>
                  <span className="text-gray-200 font-medium">{row.loc}</span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#1A2E20]/80">
                  <span className="text-gray-400">Período</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#A6DEBD]">{row.period}</span>
                    {row.isEstimated && (consFormatted.isAvailable || emFormatted.isAvailable) && <EstimatedTag />}
                  </div>
                </div>

                {/* Linha 3: Consumo com barra visual */}
                <div className="pt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Consumo no período (kWh)</span>
                    <span className={consFormatted.isAvailable ? 'font-semibold text-white' : 'text-gray-400 italic'}>
                      {consFormatted.displayWithUnit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#1A2E20] overflow-hidden">
                    {consFormatted.isAvailable && (
                      <div className="h-full bg-[#2FA862] rounded-full" style={{ width: `${consPct}%` }} />
                    )}
                  </div>
                </div>

                {/* Linha 4: Emissão com barra visual */}
                <div className="pt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Emissão no período (kgCO₂e)</span>
                    <span className={emFormatted.isAvailable ? 'font-semibold text-white' : 'text-gray-400 italic'}>
                      {emFormatted.displayWithUnit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#1A2E20] overflow-hidden">
                    {emFormatted.isAvailable && (
                      <div className="h-full bg-[#22D55B] rounded-full" style={{ width: `${emPct}%` }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* =========================================================
            DESKTOP (>= 768px): Tabela completa original
            ========================================================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-[#9BAE9E] text-[#0C1711] text-xs font-semibold">
                <th className="py-2.5 px-4 rounded-l-md w-10 text-center"></th>
                <th className="py-2.5 px-4 border-l border-[#7A8C7C]">
                  <div className="flex items-center justify-between">
                    Serviço <span className="text-[10px]">▼</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 border-l border-[#7A8C7C]">
                  <div className="flex items-center justify-between">
                    Localização <span className="text-[10px]">▼</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 border-l border-[#7A8C7C]">
                  <div className="flex items-center justify-between">
                    Status <span className="text-[10px]">▼</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 border-l border-[#7A8C7C]">
                  <div className="flex items-center justify-between">
                    Consumo (kWh) <span className="text-[10px]">▼</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 border-l border-[#7A8C7C] rounded-r-md">
                  <div className="flex items-center justify-between">
                    Emissão (kgCO₂e) <span className="text-[10px]">▼</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-2"></tr>
              {filteredServices.map((row) => {
                const isChecked = selectedServices.includes(row.id);
                const isDisabled = !isChecked && selectedServices.length >= 5;
                const consFormatted = formatEnvironmentalMetric(row.consKwh, 'kWh');
                const emFormatted = formatEnvironmentalMetric(row.emKgCo2, 'kgCO₂e');

                return (
                  <tr
                    key={row.id}
                    onClick={() => !isDisabled && toggleSelection(row.id)}
                    className={`border-b border-[#1A2E20] transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-[#1E663B]'
                        : isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-[#111F16]'
                    }`}
                  >
                    <td className={`py-3 px-4 rounded-l-md text-center ${isChecked ? 'border-none' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        disabled={isDisabled}
                        className="accent-[#2FA862] w-4 h-4 rounded-sm border-gray-600 bg-transparent cursor-pointer"
                      />
                    </td>
                    <td className={`py-3 px-4 ${isChecked ? 'border-none' : ''}`}>
                      <div className="font-semibold text-white">{row.id}</div>
                      <div className={`text-xs ${isChecked ? 'text-gray-300' : 'text-gray-500'}`}>{row.sub}</div>
                    </td>
                    <td className={`py-3 px-4 ${isChecked ? 'text-white border-none' : 'text-gray-300'}`}>{row.loc}</td>
                    <td className={`py-3 px-4 ${isChecked ? 'border-none' : ''}`}>
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                    <td className={`py-3 px-4 ${isChecked ? 'text-white border-none' : 'text-gray-300'}`}>
                      {consFormatted.isAvailable ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white">{consFormatted.displayWithUnit}</span>
                            {row.isEstimated && <EstimatedTag />}
                          </div>
                          <span className={`text-[11px] ${isChecked ? 'text-gray-200' : 'text-gray-400'}`}>
                            Período: {row.period}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Indisponível ({row.period})</span>
                      )}
                    </td>
                    <td className={`py-3 px-4 rounded-r-md ${isChecked ? 'text-white border-none' : 'text-gray-300'}`}>
                      {emFormatted.isAvailable ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white">{emFormatted.displayWithUnit}</span>
                            {row.isEstimated && <EstimatedTag />}
                          </div>
                          <span className={`text-[11px] ${isChecked ? 'text-gray-200' : 'text-gray-400'}`}>
                            Período: {row.period}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Indisponível ({row.period})</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-gray-500">Mostrando 1–{filteredServices.length} dos serviços encontrados</div>
      </div>
    </div>
  );
};