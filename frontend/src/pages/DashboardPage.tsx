import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { formatEnvironmentalMetric } from '../utils/environmentalMetrics';

interface DashboardServiceRow {
  id: string;
  sub: string;
  loc: string;
  pais: string;
  regiao: string;
  estado: string;
  cidade: string;
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
    loc: 'São Francisco - EUA',
    pais: 'Estados Unidos',
    regiao: 'América do Norte',
    estado: 'Califórnia',
    cidade: 'São Francisco',
    status: 'Ativo',
    consKwh: 1240,
    emKgCo2: 459,
    period: 'Últimos 30 dias',
    isEstimated: false,
    color: '#2FA862',
  },
  {
    id: 'ASTAH-ABC',
    sub: 'ID 0102',
    loc: 'São Paulo - BR',
    pais: 'Brasil',
    regiao: 'Região Sudeste',
    estado: 'São Paulo',
    cidade: 'São Paulo',
    status: 'Ativo',
    consKwh: 1105,
    emKgCo2: 88,
    period: 'Últimos 30 dias',
    isEstimated: true,
    color: '#3B82F6',
  },
  {
    id: 'ASTAH-DEF',
    sub: 'ID 0087',
    loc: 'Berlim - DE',
    pais: 'Alemanha',
    regiao: 'Europa Central',
    estado: 'Berlim',
    cidade: 'Berlim',
    status: 'Ativo',
    consKwh: 962,
    emKgCo2: 366,
    period: 'Últimos 30 dias',
    isEstimated: false,
    color: '#FBBF24',
  },
  {
    id: 'ASTAH-GHI',
    sub: 'ID 0230',
    loc: 'Sydney - AU',
    pais: 'Austrália',
    regiao: 'Oceania',
    estado: 'Nova Gales do Sul',
    cidade: 'Sydney',
    status: 'Ativo',
    consKwh: 874,
    emKgCo2: 481,
    period: 'Últimos 30 dias',
    isEstimated: true,
    color: '#F97316',
  },
  {
    id: 'ASTAH-JKL',
    sub: 'ID 0315',
    loc: 'Toronto - CA',
    pais: 'Canadá',
    regiao: 'América do Norte',
    estado: 'Ontário',
    cidade: 'Toronto',
    status: 'Ativo',
    consKwh: 731,
    emKgCo2: 88,
    period: 'Últimos 30 dias',
    isEstimated: false,
    color: '#EF4444',
  },
  {
    id: 'ASTAH-MNO',
    sub: 'ID 0412',
    loc: 'Lisboa - PT',
    pais: 'Portugal',
    regiao: 'Europa Ocidental',
    estado: 'Lisboa',
    cidade: 'Lisboa',
    status: 'Ativo',
    consKwh: 0.0042,
    emKgCo2: 0.0018,
    period: 'Última 1h',
    isEstimated: false,
    color: '#8B5CF6',
  },
  {
    id: 'ASTAH-PQR',
    sub: 'ID 0466',
    loc: 'Tóquio - JP',
    pais: 'Japão',
    regiao: 'Ásia Oriental',
    estado: 'Tóquio',
    cidade: 'Tóquio',
    status: 'Indisponível',
    consKwh: 512,
    emKgCo2: 236,
    period: 'Último registro (10/10)',
    isEstimated: false,
    color: '#EC4899',
  },
  {
    id: 'ASTAH-STU',
    sub: 'ID 0501',
    loc: 'Cidade do México - MX',
    pais: 'México',
    regiao: 'América do Norte',
    estado: 'Cidade do México',
    cidade: 'Cidade do México',
    status: 'Sem métricas',
    consKwh: null,
    emKgCo2: null,
    period: 'Últimos 30 dias',
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
  searchPlaceholder,
  value,
  options,
  onChange,
  allowClear = true,
}: {
  label?: string;
  placeholder: string;
  searchPlaceholder?: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  allowClear?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, query]);

  const computedSearchPlaceholder =
    searchPlaceholder ||
    placeholder
      .replace(/^Todos os /i, 'Digite um ')
      .replace(/^Todas as /i, 'Digite uma ');

  return (
    <div className="relative w-full md:flex-1" ref={dropdownRef}>
      {label && <label className="block text-gray-300 text-[11px] mb-1.5">{label}</label>}

      <button
        type="button"
        onClick={() => {
          setQuery('');
          setIsOpen(true);
        }}
        className={`w-full flex justify-between items-center bg-[#0C1D13] border ${
          value ? 'border-white' : 'border-white/40'
        } text-white text-xs px-3.5 py-2.5 rounded-lg hover:border-white transition-colors cursor-pointer`}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg className="w-3 h-3 shrink-0 ml-2 text-white" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 9.5L1.5 3h9L6 9.5z" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 ${
            label ? 'top-[22px]' : 'top-0'
          } bg-[#0C1D13] border border-white rounded-xl p-3 z-50 shadow-[0_16px_36px_rgba(0,0,0,0.75)] flex flex-col gap-2.5`}
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={computedSearchPlaceholder}
              className="w-full bg-transparent text-white placeholder-gray-100 text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setQuery('');
              }}
              aria-label="Fechar filtro"
              className="p-0.5 text-white hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 2.5L10.5 9h-9L6 2.5z" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/35 hover:[&::-webkit-scrollbar-thumb]:bg-white/60 [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.35)_transparent]">
            {allowClear && value && !query && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  setQuery('');
                }}
                className="w-full text-left text-gray-200 text-xs px-3 py-2 border border-white/75 rounded-lg hover:bg-[#152E20] hover:border-white transition-colors cursor-pointer"
              >
                {placeholder}
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = value === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left text-xs px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1D6B3A] border-white text-white font-semibold'
                        : 'bg-transparent border-white/80 text-white hover:bg-[#152E20] hover:border-white'
                    }`}
                  >
                    {option}
                  </button>
                );
              })
            ) : (
              <div className="text-center text-gray-300 text-xs py-3">
                Nenhum resultado encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'ASTAH-XYZ',
    'ASTAH-ABC',
    'ASTAH-DEF',
    'ASTAH-GHI',
    'ASTAH-JKL',
  ]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Últimos 30 dias');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [countryFilter, setCountryFilter] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');

  const [sortMode, setSortMode] = useState<'alpha' | 'value'>('value');
  const [sortMetric, setSortMetric] = useState<'co2' | 'kwh'>('kwh');
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  const toggleSelection = (id: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(id)) return prev.filter((serviceId) => serviceId !== id);
      if (prev.length < 5) return [...prev, id];
      return prev;
    });
  };

  const handleClearFilters = () => {
    setCountryFilter('');
    setRegionFilter('');
    setStateFilter('');
    setCityFilter('');
    setSearchTerm('');
  };

  const countryOptions = useMemo(() => Array.from(new Set(servicesData.map((s) => s.pais))), []);
  const regionOptions = useMemo(
    () =>
      Array.from(
        new Set(servicesData.filter((s) => !countryFilter || s.pais === countryFilter).map((s) => s.regiao))
      ),
    [countryFilter]
  );
  const stateOptions = useMemo(
    () =>
      Array.from(
        new Set(
          servicesData
            .filter(
              (s) =>
                (!countryFilter || s.pais === countryFilter) &&
                (!regionFilter || s.regiao === regionFilter)
            )
            .map((s) => s.estado)
        )
      ),
    [countryFilter, regionFilter]
  );
  const cityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          servicesData
            .filter(
              (s) =>
                (!countryFilter || s.pais === countryFilter) &&
                (!regionFilter || s.regiao === regionFilter) &&
                (!stateFilter || s.estado === stateFilter)
            )
            .map((s) => s.cidade)
        )
      ),
    [countryFilter, regionFilter, stateFilter]
  );

  const filteredAndSortedServices = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = servicesData.filter((s) => {
      const matchesSearch =
        !term ||
        s.id.toLowerCase().includes(term) ||
        s.sub.toLowerCase().includes(term) ||
        s.loc.toLowerCase().includes(term);
      const matchesCountry = !countryFilter || s.pais === countryFilter;
      const matchesRegion = !regionFilter || s.regiao === regionFilter;
      const matchesState = !stateFilter || s.estado === stateFilter;
      const matchesCity = !cityFilter || s.cidade === cityFilter;
      return matchesSearch && matchesCountry && matchesRegion && matchesState && matchesCity;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'alpha') {
        return a.id.localeCompare(b.id);
      }
      const valA = sortMetric === 'kwh' ? a.consKwh ?? -1 : a.emKgCo2 ?? -1;
      const valB = sortMetric === 'kwh' ? b.consKwh ?? -1 : b.emKgCo2 ?? -1;
      return valB - valA;
    });
  }, [searchTerm, countryFilter, regionFilter, stateFilter, cityFilter, sortMode, sortMetric]);

  const handleExportCsv = () => {
    const headers = ['Servico', 'ID', 'Localizacao', 'Status', 'Consumo_kWh', 'Emissao_kgCO2e', 'Periodo'];
    const rows = filteredAndSortedServices.map((s) => [
      s.id,
      s.sub,
      `"${s.loc}"`,
      s.status,
      s.consKwh ?? 'Indisponivel',
      s.emKgCo2 ?? 'Indisponivel',
      `"${selectedPeriod}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `greener-dashboards-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeServices = servicesData.filter((s) => selectedServices.includes(s.id));

  const availableSelectedCons = activeServices
    .map((s) => s.consKwh)
    .filter((v): v is number => v !== null && v !== undefined);

  const totalSelectedCons =
    activeServices.length === 0 || availableSelectedCons.length === 0
      ? null
      : availableSelectedCons.reduce((acc, curr) => acc + curr, 0);

  const hasEstimatedInSelection = activeServices.some((s) => s.isEstimated && s.consKwh !== null);
  const formattedChartTotal = formatEnvironmentalMetric(totalSelectedCons, 'kWh');

  const maxCons = Math.max(...servicesData.map((s) => s.consKwh ?? 0), 1);
  const maxEm = Math.max(...servicesData.map((s) => s.emKgCo2 ?? 0), 1);

  const graphCurves = [
    { d: 'M0,44 Q180,22 360,38 T720,30 T1000,26', endY: 26 },
    { d: 'M0,56 Q220,54 420,40 T760,44 T1000,38', endY: 38 },
    { d: 'M0,66 Q160,64 340,60 T680,56 T1000,52', endY: 52 },
    { d: 'M0,78 Q250,74 480,68 T820,64 T1000,66', endY: 66 },
    { d: 'M0,86 Q200,82 440,78 T780,76 T1000,80', endY: 80 },
  ];

  const kpiCards: Array<{
    title: string;
    numericValue: number | null;
    unit?: 'kWh' | 'kgCO₂e';
    isEstimated?: boolean;
    sub: string;
  }> = [
    {
      title: 'Consumo total',
      numericValue: 128,
      unit: 'kWh',
      isEstimated: false,
      sub: '▲ 4% vs. período anterior',
    },
    {
      title: 'Emissão total',
      numericValue: 54,
      unit: 'kgCO₂e',
      isEstimated: true,
      sub: '▲ 3% vs. período anterior',
    },
    {
      title: 'Serviços ativos',
      numericValue: 94,
      sub: '73% do total',
    },
    {
      title: 'Indisponíveis',
      numericValue: 21,
      sub: 'Sem comunicação recente',
    },
  ];

  const hasActiveGeoFilters = Boolean(countryFilter || regionFilter || stateFilter || cityFilter || searchTerm);

  return (
    <div className="min-h-screen bg-[#060D09] text-white p-4 sm:p-6 md:p-8 font-sans pb-24 md:pb-20">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Dashboards</h1>
          <h2 className="text-base sm:text-xl font-semibold mb-1.5">Resultados cumulativos</h2>
          <p className="text-gray-400 text-xs sm:text-sm">
            Última atualização: <span className="text-gray-200">{formatDateTime(lastUpdatedAt)}</span> · atualiza a cada{' '}
            {refreshIntervalSec} s
          </p>
        </div>

        <div className="relative w-full lg:w-80">
          <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquise por um serviço aqui"
            className="bg-[#0B150F] border border-[#1A2E20] rounded-lg pl-9 pr-4 py-2 w-full text-xs sm:text-sm focus:outline-none focus:border-[#2FA862] text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* Seção 1: Consumo de KPIs em tempo real */}
      <h3 className="text-base sm:text-lg font-bold mb-3.5">Consumo de KPIs em tempo real</h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
                  <div className="text-base sm:text-xl font-semibold text-gray-400 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    Indisponível
                  </div>
                ) : metric ? (
                  <div className="text-2xl sm:text-3xl font-bold mb-2 break-words">
                    {metric.formattedValue}{' '}
                    <span className="text-sm sm:text-xl font-bold text-white">{kpi.unit}</span>
                  </div>
                ) : (
                  <div className="text-2xl sm:text-3xl font-bold mb-2">{kpi.numericValue}</div>
                )}
              </div>

              <div className="text-[11px] sm:text-xs text-gray-400">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Seção 2: Filtros Geográficos + Limpar filtros + Exportar */}
      <div className="flex flex-col md:flex-row md:items-end gap-3 mb-7 w-full relative z-30">
        <CustomDropdown
          label="País"
          placeholder="Todos os países"
          value={countryFilter}
          options={countryOptions}
          onChange={(val) => {
            setCountryFilter(val);
            setRegionFilter('');
            setStateFilter('');
            setCityFilter('');
          }}
        />
        <CustomDropdown
          label="Região"
          placeholder="Todas as regiões"
          value={regionFilter}
          options={regionOptions}
          onChange={(val) => {
            setRegionFilter(val);
            setStateFilter('');
            setCityFilter('');
          }}
        />
        <CustomDropdown
          label="Estado"
          placeholder="Todos os estados"
          value={stateFilter}
          options={stateOptions}
          onChange={(val) => {
            setStateFilter(val);
            setCityFilter('');
          }}
        />
        <CustomDropdown
          label="Cidade"
          placeholder="Todas as cidades"
          value={cityFilter}
          options={cityOptions}
          onChange={setCityFilter}
        />

        <div className="flex items-center justify-between md:justify-start gap-4 md:ml-2 h-[38px] pt-1 md:pt-0">
          <button
            type="button"
            onClick={handleClearFilters}
            className={`text-xs transition-colors whitespace-nowrap cursor-pointer ${
              hasActiveGeoFilters
                ? 'text-[#4ADE80] underline hover:text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Limpar filtros
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-2 bg-[#2FA862] hover:bg-[#258248] text-white px-4 h-full rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>Exportar</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Seção 3: Gráfico Dinâmico "Uso em tempo real" */}
      <div className="bg-[#0C1711] border border-[#1A2E20] p-4 sm:p-6 rounded-xl mb-7 relative z-10">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="font-bold text-base sm:text-lg">Uso em tempo real</h4>
              {hasEstimatedInSelection && <EstimatedTag />}
            </div>
            <p className="text-gray-400 text-xs mt-0.5">Compare até 5 serviços · consumo em kWh</p>
            <div className="text-2xl sm:text-3xl font-bold mt-3 flex items-baseline gap-2 flex-wrap">
              {formattedChartTotal.isAvailable ? (
                <>
                  <span>{formattedChartTotal.displayWithUnit}</span>
                  <span className="text-xs sm:text-sm font-normal text-gray-400">
                    total dos {selectedServices.length} {selectedServices.length === 1 ? 'serviço' : 'serviços'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg sm:text-xl text-gray-400 font-semibold">Indisponível</span>
                  <span className="text-xs sm:text-sm font-normal text-gray-500">
                    ({selectedServices.length} serviço(s) sem leituras)
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2.5">
            <div className="flex flex-wrap gap-2">
              <span className="border border-[#1A2E20] bg-[#09120D] text-gray-300 px-3 py-1 rounded-full text-xs">
                {selectedServices.length} de 5 serviços
              </span>
              <span className="border border-[#1A2E20] bg-[#09120D] text-[#2FA862] px-3 py-1 rounded-full text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2FA862] animate-pulse"></span> Ao vivo · atualiza a cada{' '}
                {refreshIntervalSec} s
              </span>
            </div>

            {activeServices.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {activeServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleSelection(service.id)}
                    title={`Remover ${service.id} da comparação`}
                    style={{
                      borderColor: service.color,
                      backgroundColor: `${service.color}22`,
                    }}
                    className="px-2.5 py-1 rounded border text-[11px] font-semibold text-white hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    {service.id}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col justify-between text-[10px] sm:text-[11px] text-gray-500 pb-1 select-none text-right w-6 shrink-0">
            <span>60</span>
            <span>45</span>
            <span>30</span>
            <span>15</span>
            <span>0</span>
          </div>

          <div className="flex-1 h-44 sm:h-48 relative border-b border-[#1A2E20]">
            {selectedServices.length > 0 ? (
              <svg className="w-full h-full relative z-10 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 100">
                {activeServices.map((service, index) => {
                  const curve = graphCurves[index % graphCurves.length];
                  return (
                    <g key={service.id}>
                      <path
                        d={curve.d}
                        fill="none"
                        stroke={service.color}
                        strokeWidth="2.2"
                        className="animate-[dash_1.5s_ease-out_forwards]"
                        style={{ strokeDasharray: 1200, strokeDashoffset: 1200 }}
                      />
                      <circle
                        cx="1000"
                        cy={curve.endY}
                        r="4.5"
                        fill={service.color}
                        stroke="#060D09"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs sm:text-sm text-center px-4 z-10">
                Selecione até 5 serviços na tabela abaixo para comparar no gráfico.
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
        </div>

        <div className="flex justify-between text-[11px] sm:text-xs text-gray-500 pl-9 mt-2.5">
          <span>-60 min</span>
          <span>-45 min</span>
          <span>-30 min</span>
          <span>-15 min</span>
          <span>agora</span>
        </div>
      </div>

      {/* Seção 4: Lista / Tabela "Todos os serviços" */}
      <div className="bg-[#0C1711] border border-[#1A2E20] p-4 sm:p-6 rounded-xl relative z-0">
        <div className="flex flex-wrap justify-between items-start gap-2 mb-5">
          <div>
            <h4 className="font-bold text-base sm:text-lg">Todos os serviços</h4>
            <p className="text-gray-400 text-xs mt-0.5">128 serviços · marque até 5 para comparar</p>
          </div>
          <span className="border border-[#1A2E20] bg-[#09120D] text-gray-300 px-3 py-1 rounded-full text-xs h-fit">
            {selectedServices.length} de 5 selecionados
          </span>
        </div>

        {/* Controles de Período e Ordenação */}
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-4 mb-5">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-5 items-stretch sm:items-end">
            <div className="w-full sm:w-44">
              <CustomDropdown
                label="Período"
                placeholder="Últimos 30 dias"
                searchPlaceholder="Buscar período"
                value={selectedPeriod}
                options={['Última 1h', 'Últimas 24h', 'Últimos 7 dias', 'Últimos 30 dias']}
                onChange={(val) => setSelectedPeriod(val || 'Últimos 30 dias')}
                allowClear={false}
              />
            </div>

            <div>
              <div className="text-gray-300 text-[11px] mb-1.5">Ordenar por</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSortMode('alpha')}
                  className={`px-3.5 py-2 rounded-md text-xs transition cursor-pointer ${
                    sortMode === 'alpha'
                      ? 'bg-[#1B5E36] text-white font-medium border border-[#2FA862]'
                      : 'border border-[#1A2E20] text-gray-300 hover:bg-[#15241A]'
                  }`}
                >
                  Ordem alfabética (A–Z)
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode('value')}
                  className={`px-3.5 py-2 rounded-md text-xs transition cursor-pointer ${
                    sortMode === 'value'
                      ? 'bg-[#1B5E36] text-white font-medium border border-[#2FA862]'
                      : 'border border-[#1A2E20] text-gray-300 hover:bg-[#15241A]'
                  }`}
                >
                  Maior valor
                </button>
              </div>
            </div>

            <div>
              <div className="text-gray-300 text-[11px] mb-1.5">Ordenar por métrica</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSortMetric('co2')}
                  className={`px-3.5 py-2 rounded-md text-xs transition cursor-pointer ${
                    sortMetric === 'co2'
                      ? 'bg-[#EAB308] text-[#060D09] border border-[#FACC15] font-semibold'
                      : 'border border-[#2FA862] text-[#4ADE80] hover:bg-[#15241A]'
                  }`}
                >
                  Emissão (CO₂e)
                </button>
                <button
                  type="button"
                  onClick={() => setSortMetric('kwh')}
                  className={`px-3.5 py-2 rounded-md text-xs transition cursor-pointer ${
                    sortMetric === 'kwh'
                      ? 'bg-[#EAB308] text-[#060D09] border border-[#FACC15] font-semibold'
                      : 'border border-[#2FA862] text-[#4ADE80] hover:bg-[#15241A]'
                  }`}
                >
                  Energia (kWh)
                </button>
              </div>
            </div>
          </div>

          <div className="text-gray-400 text-xs">Mostrando {filteredAndSortedServices.length} de 128 serviços</div>
        </div>

        {/* =========================================================
            MOBILE (< 768px): Cards empilhados
            ========================================================= */}
        <div className="md:hidden space-y-3">
          {filteredAndSortedServices.map((row) => {
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

                <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#1A2E20]/80">
                  <span className="text-gray-400">Localização</span>
                  <span className="text-gray-200 font-medium">{row.loc || 'Não informada'}</span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#1A2E20]/80">
                  <span className="text-gray-400">Período</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#A6DEBD]">
                      {row.status === 'Indisponível' ? row.period : selectedPeriod}
                    </span>
                    {row.isEstimated && (consFormatted.isAvailable || emFormatted.isAvailable) && <EstimatedTag />}
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Consumo no período (kWh)</span>
                    <span className={consFormatted.isAvailable ? 'font-semibold text-white' : 'text-gray-400'}>
                      {consFormatted.isAvailable
                        ? `${consFormatted.formattedValue}${row.status === 'Indisponível' ? ' (último)' : ''}`
                        : '-'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#1A2E20] overflow-hidden">
                    {consFormatted.isAvailable && (
                      <div className="h-full bg-[#2FA862] rounded-full" style={{ width: `${consPct}%` }} />
                    )}
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Emissão no período (kgCO₂e)</span>
                    <span className={emFormatted.isAvailable ? 'font-semibold text-white' : 'text-gray-400'}>
                      {emFormatted.isAvailable
                        ? `${emFormatted.formattedValue}${row.status === 'Indisponível' ? ' (último)' : ''}`
                        : '-'}
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
            DESKTOP (>= 768px): Tabela completa
            ========================================================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-[#9BAE9E] text-[#0C1711] text-xs font-semibold">
                <th className="py-2.5 px-4 rounded-l-md w-10 text-center"></th>
                <th
                  onClick={() => setSortMode('alpha')}
                  className="py-2.5 px-4 border-l border-[#7A8C7C] cursor-pointer hover:bg-[#8DA290] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>Serviço</span>
                    <span className="text-[10px]">▼</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 border-l border-[#7A8C7C]">
                  <div className="flex items-center justify-between">
                    <span>Localização</span>
                    <span className="text-[10px]">▼</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 border-l border-[#7A8C7C]">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="text-[10px]">▼</span>
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortMode('value');
                    setSortMetric('kwh');
                  }}
                  className="py-2.5 px-4 border-l border-[#7A8C7C] cursor-pointer hover:bg-[#8DA290] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>Consumo no período (kWh)</span>
                    <span className="text-[10px]">▼</span>
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortMode('value');
                    setSortMetric('co2');
                  }}
                  className="py-2.5 px-4 border-l border-[#7A8C7C] rounded-r-md cursor-pointer hover:bg-[#8DA290] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>Emissão no período (kgCO₂e)</span>
                    <span className="text-[10px]">▼</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-2"></tr>
              {filteredAndSortedServices.map((row) => {
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
                        ? 'bg-[#174F2E]'
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
                    <td className={`py-3 px-4 ${isChecked ? 'text-white border-none' : 'text-gray-300'}`}>
                      {row.loc || 'Não informada'}
                    </td>
                    <td className={`py-3 px-4 ${isChecked ? 'border-none' : ''}`}>
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                    <td className={`py-3 px-4 ${isChecked ? 'text-white border-none' : 'text-gray-300'}`}>
                      {consFormatted.isAvailable ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {consFormatted.formattedValue}
                            {row.status === 'Indisponível' ? ' (último)' : ''}
                          </span>
                          {row.isEstimated && <EstimatedTag />}
                        </div>
                      ) : (
                        <span title="Métrica indisponível no período" className="text-gray-400">
                          -
                        </span>
                      )}
                    </td>
                    <td className={`py-3 px-4 rounded-r-md ${isChecked ? 'text-white border-none' : 'text-gray-300'}`}>
                      {emFormatted.isAvailable ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {emFormatted.formattedValue}
                            {row.status === 'Indisponível' ? ' (último)' : ''}
                          </span>
                          {row.isEstimated && <EstimatedTag />}
                        </div>
                      ) : (
                        <span title="Métrica indisponível no período" className="text-gray-400">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela com paginação */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-5 text-xs text-gray-400">
          <span>
            Mostrando 1–{filteredAndSortedServices.length} de 128 serviços ({selectedPeriod})
          </span>
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
              onClick={() => setCurrentPage(16)}
              className={`w-7 h-7 flex items-center justify-center rounded transition cursor-pointer ${
                currentPage === 16
                  ? 'bg-[#1E663B] text-white border border-[#2FA862] font-medium'
                  : 'border border-[#1A2E20] hover:bg-[#1A2E20]'
              }`}
            >
              16
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(16, p + 1))}
              className="w-7 h-7 flex items-center justify-center border border-[#1A2E20] rounded hover:bg-[#1A2E20] transition cursor-pointer"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};