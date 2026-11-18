import React, { useState, useMemo, useRef, useEffect } from 'react';

import { ServiceModal } from '../components/ServiceModal';

import type { ModalServiceData } from '../components/ServiceModal';

import { useServicesPolling } from '../hooks/useServicesPolling';

import { PollingStatusBanner } from '../components/PollingStatusBanner';



type ServiceStatus = 'Ativo' | 'Indisponível' | 'Sem métricas';



interface DashboardServiceRow {

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



const SERVICES_DATA: DashboardServiceRow[] = [

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



const SUGGESTED_CITIES = [

  'Jacareí',

  'Caçapava',

  'Taubaté',

  'São Paulo',

  'Mogi das cruzes',

  'São Francisco',

  'Berlim',

  'Sydney',

  'Toronto',

  'Lisboa',

  'Tóquio',

  'Cidade do México',

];



const SERIES_COLORS = [

  { stroke: '#2FA862', border: 'border-[#2FA862]' },

  { stroke: '#3B82F6', border: 'border-[#3B82F6]' },

  { stroke: '#EAB308', border: 'border-[#EAB308]' },

  { stroke: '#F35B1B', border: 'border-[#F35B1B]' },

  { stroke: '#E05252', border: 'border-[#E05252]' },

];



function mapServiceRowToModalData(row: DashboardServiceRow): ModalServiceData {

  const normalizedStatus: ModalServiceData['status'] =

    row.status === 'Ativo'

      ? 'ativo'

      : row.status === 'Indisponível'

      ? 'indisponível'

      : 'sem_metricas';



  return {

    id: row.numericId,

    name: row.code,

    status: normalizedStatus,

    location: row.location,

  };

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



/**

 * Dropdown customizado emoldurado seguindo o visual do campo Cidade,

 * com destaque/hover em branco (#F2FAF5) ao passar o mouse ou selecionar.

 */

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



export const DashboardPage: React.FC = () => {

  const [searchTerm, setSearchTerm] = useState('');

  const [countryFilter, setCountryFilter] = useState('');

  const [regionFilter, setRegionFilter] = useState('');

  const [stateFilter, setStateFilter] = useState('');

  const [cityQuery, setCityQuery] = useState('');

  const [openFilterMenu, setOpenFilterMenu] = useState<

    'country' | 'region' | 'state' | 'city' | 'period' | null

  >(null);



  const [selectedServiceCodes, setSelectedServiceCodes] = useState<string[]>([

    'ASTAH-XYZ',

    'ASTAH-ABC',

    'ASTAH-DEF',

    'ASTAH-GHI',

    'ASTAH-JKL',

  ]);

  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | '90d'>('30d');

  const [sortMode, setSortMode] = useState<'alpha' | 'value'>('value');

  const [sortMetric, setSortMetric] = useState<'emission' | 'energy'>('energy');

  const [currentPage, setCurrentPage] = useState(1);

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

  const periodDropdownRef = useRef<HTMLDivElement | null>(null);



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



  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {

      const target = event.target as Node;

      const insideGeo = filtersContainerRef.current?.contains(target);

      const insidePeriod = periodDropdownRef.current?.contains(target);

      if (!insideGeo && !insidePeriod) {

        setOpenFilterMenu(null);

      }

    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);

  }, []);



  const countryOptions = useMemo(

    () => [

      { label: 'Todos os países', value: '' },

      ...Array.from(new Set(SERVICES_DATA.map((s) => s.country))).map((c) => ({

        label: c,

        value: c,

      })),

    ],

    []

  );



  const regionOptions = useMemo(

    () => [

      { label: 'Todas as regiões', value: '' },

      ...Array.from(new Set(SERVICES_DATA.map((s) => s.region))).map((r) => ({

        label: r,

        value: r,

      })),

    ],

    []

  );



  const stateOptions = useMemo(

    () => [

      { label: 'Todos os estados', value: '' },

      ...Array.from(new Set(SERVICES_DATA.map((s) => s.state))).map((st) => ({

        label: st,

        value: st,

      })),

    ],

    []

  );



  const periodOptions = [

    { label: 'Últimos 7 dias', value: '7d' },

    { label: 'Últimos 30 dias', value: '30d' },

    { label: 'Últimos 90 dias', value: '90d' },

  ];



  const filteredCityOptions = useMemo(() => {

    const q = cityQuery.toLowerCase().trim();

    if (!q) return SUGGESTED_CITIES.slice(0, 5);

    return SUGGESTED_CITIES.filter((city) => city.toLowerCase().includes(q));

  }, [cityQuery]);



  const filteredServices = useMemo(() => {

    const term = searchTerm.toLowerCase().trim();

    const cityTerm = cityQuery.toLowerCase().trim();



    const filtered = SERVICES_DATA.filter((row) => {

      const matchesSearch =

        !term ||

        row.code.toLowerCase().includes(term) ||

        row.subId.toLowerCase().includes(term) ||

        row.location.toLowerCase().includes(term);

      const matchesCountry = !countryFilter || row.country === countryFilter;

      const matchesRegion = !regionFilter || row.region === regionFilter;

      const matchesState = !stateFilter || row.state === stateFilter;

      const matchesCity = !cityTerm || row.city.toLowerCase().includes(cityTerm);



      return matchesSearch && matchesCountry && matchesRegion && matchesState && matchesCity;

    });



    return [...filtered].sort((a, b) => {

      if (sortMode === 'alpha') {

        return a.code.localeCompare(b.code);

      }

      const valA = sortMetric === 'energy' ? (a.consumptionKwh ?? -1) : (a.emissionKg ?? -1);

      const valB = sortMetric === 'energy' ? (b.consumptionKwh ?? -1) : (b.emissionKg ?? -1);

      return valB - valA;

    });

  }, [searchTerm, countryFilter, regionFilter, stateFilter, cityQuery, sortMode, sortMetric]);



  const selectedServicesForChart = useMemo(

    () =>

      selectedServiceCodes

        .map((code) => SERVICES_DATA.find((s) => s.code === code))

        .filter((item): item is DashboardServiceRow => Boolean(item)),

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

    setStateFilter('');

    setCityQuery('');

    setSearchTerm('');

    setOpenFilterMenu(null);

  };



  const handleExportCsv = () => {

    const header = 'Serviço,ID,Localização,Status,Consumo (kWh),Emissão (kgCO2e)\n';

    const rows = filteredServices

      .map(

        (s) =>

          `${s.code},${s.subId},"${s.location}",${s.status},"${s.consumptionLabel}","${s.emissionLabel}"`

      )

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



  return (

    <div className="min-h-screen bg-[#07150E] text-[#F2FAF5] p-4 sm:p-6 md:p-8 font-sans pb-24 md:pb-20">

      {/* Cabeçalho */}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 sm:mb-7">

        <div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-[#F2FAF5]">Dashboards</h1>

          <h2 className="text-base sm:text-xl font-semibold mb-1.5 text-[#F2FAF5]">

            Resultados cumulativos

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

        onRetry={triggerRefresh}

      />



      {/* Seção: Consumo de KPIs em tempo real */}

      <div className="mb-6">

        <h3 className="text-lg sm:text-xl font-bold text-[#F2FAF5] mb-3.5">

          Consumo de KPIs em tempo real

        </h3>



        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

          {[

            { title: 'Consumo total', value: '128 kWh', sub: '▲ 4% vs. período anterior' },

            { title: 'Emissão total', value: '54 kgCO₂e', sub: '▲ 3% vs. período anterior' },

            { title: 'Serviços ativos', value: '94', sub: '73% do total' },

            { title: 'Indisponíveis', value: '21', sub: '' },

          ].map((kpi, i) => (

            <div

              key={i}

              className="bg-[#0D2115] border-2 border-[#385E47] hover:border-[#2FA862] p-4 sm:p-5 rounded-2xl transition-colors"

            >

              <h4 className="text-[#D4E3DA] text-xs sm:text-sm font-medium mb-2">{kpi.title}</h4>

              <div className="text-2xl sm:text-3xl font-bold text-[#F2FAF5] mb-2">{kpi.value}</div>

              <div className="text-[11px] sm:text-xs text-[#9DB0A4] min-h-[16px]">{kpi.sub}</div>

            </div>

          ))}

        </div>

      </div>



      {/* Barra de Filtros Geográficos padronizados com dropdown emoldurado e hover branco */}

      <div

        ref={filtersContainerRef}

        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end mb-7"

      >

        {/* País */}

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



        {/* Região */}

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



        {/* Estado */}

        <div className="lg:col-span-2">

          <CustomFilterSelect

            label="Estado"

            value={stateFilter}

            placeholder="Todos os estados"

            options={stateOptions}

            isOpen={openFilterMenu === 'state'}

            onToggle={() =>

              setOpenFilterMenu((prev) => (prev === 'state' ? null : 'state'))

            }

            onSelect={(val) => {

              setStateFilter(val);

              setOpenFilterMenu(null);

            }}

          />

        </div>



        {/* Cidade */}

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



        {/* Limpar filtros + Exportar */}

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

            <h3 className="font-bold text-lg sm:text-xl text-[#F2FAF5]">Uso em tempo real</h3>

            <p className="text-[#9DB0A4] text-xs sm:text-sm mt-0.5">

              Compare até 5 serviços · consumo em kWh

            </p>

          </div>



          <div className="flex flex-wrap items-center gap-2">

            <span className="px-3.5 py-1 rounded-full bg-[#0B1C12] border-2 border-[#385E47] text-xs text-[#9DB0A4] font-medium">

              {selectedServicesForChart.length} de 5 serviços

            </span>

            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B1C12] border-2 border-[#385E47] text-xs text-[#D4E3DA] font-medium">

              <span className="w-2.5 h-2.5 rounded-full bg-[#2FA862]" />

              Ao vivo · atualiza a cada 5 s

            </span>

          </div>

        </div>



        {/* Linha de destaque da métrica + Pílulas dos serviços comparados */}

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

                  title="Clique para remover da comparação"

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

            {/* Título do eixo Y */}
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

            {/* Grade e escala do eixo Y */}
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

            {/* Marcações do eixo X */}
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

            {/* Título do eixo X */}
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

            {/* Séries dos serviços */}
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
                  {/* Animação independente para cada serviço */}
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

                  {/* Pontos interativos para consultar cada medição */}
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

                  {/* Marcador do último valor */}
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

            {/* Tooltip da medição selecionada */}
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

              128 serviços · marque até 5 para comparar

            </p>

          </div>



          <span className="self-start px-3.5 py-1 rounded-full bg-[#0B1C12] border-2 border-[#385E47] text-xs text-[#9DB0A4] font-medium">

            {selectedServiceCodes.length} de 5 selecionados

          </span>

        </div>



        {/* Barra de controles: Período, Ordenar por, Ordenar por métrica */}

        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-5">

          <div className="flex flex-wrap items-end gap-4">

            {/* Período com o mesmo dropdown customizado e hover branco */}

            <div ref={periodDropdownRef}>

              <CustomFilterSelect

                label="Período"

                value={periodFilter}

                placeholder="Últimos 30 dias"

                options={periodOptions}

                isOpen={openFilterMenu === 'period'}

                onToggle={() =>

                  setOpenFilterMenu((prev) => (prev === 'period' ? null : 'period'))

                }

                onSelect={(val) => {

                  setPeriodFilter(val as '7d' | '30d' | '90d');

                  setOpenFilterMenu(null);

                }}

                minWidthClass="min-w-[175px]"

              />

            </div>



            {/* Ordenar por */}

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



            {/* Ordenar por métrica */}

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

            Mostrando {filteredServices.length} de 128 serviços

          </span>

        </div>



        {/* Estado vazio */}

        {filteredServices.length === 0 ? (

          <div className="py-12 px-4 text-center border-2 border-dashed border-[#385E47] rounded-xl bg-[#09180F]">

            <p className="text-sm font-medium text-[#F2FAF5] mb-1">Nenhum serviço encontrado</p>

            <p className="text-xs text-[#9DB0A4] mb-4">

              Não existem serviços correspondentes aos filtros aplicados.

            </p>

            <button

              type="button"

              onClick={clearAllFilters}

              className="px-3.5 py-1.5 rounded-lg bg-[#1F8A4C] hover:bg-[#2FA862] text-white text-xs font-medium transition-colors cursor-pointer"

            >

              Limpar filtros

            </button>

          </div>

        ) : (

          <>

            {/* MOBILE (< 768px): Cards */}

            <div className="md:hidden space-y-3">

              {filteredServices.map((row) => {

                const isChecked = selectedServiceCodes.includes(row.code);

                const disableNewSelection = !isChecked && selectedServiceCodes.length >= 5;



                return (

                  <div

                    key={row.code}

                    onClick={() => setSelectedServiceModal(mapServiceRowToModalData(row))}

                    className="p-3.5 rounded-xl bg-[#09180F] border-2 border-[#385E47] hover:border-[#14C45A] transition-colors cursor-pointer"

                  >

                    <div className="flex items-start justify-between gap-2 mb-2.5">

                      <div className="flex items-center gap-2.5">

                        <button

                          type="button"

                          disabled={disableNewSelection}

                          onClick={(e) => {

                            e.stopPropagation();

                            toggleServiceSelection(row.code);

                          }}

                          aria-label={`Selecionar ${row.code} para comparação`}

                          className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors cursor-pointer ${

                            isChecked

                              ? 'bg-[#2FA862] border-[#14C45A] text-white'

                              : 'bg-transparent border-[#8FA89B] disabled:opacity-40'

                          }`}

                        >

                          {isChecked && (

                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.8">

                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10.5l3.2 3.2L15 7" />

                            </svg>

                          )}

                        </button>

                        <div>

                          <div className="font-semibold text-sm text-[#F2FAF5]">{row.code}</div>

                          <div className="text-[11px] text-[#9DB0A4]">{row.subId}</div>

                        </div>

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

                        <span className="text-[#D4E3DA]">{row.consumptionLabel}</span>

                      </div>

                      <div className="flex items-center justify-between pt-1">

                        <span className="text-[#9DB0A4]">Emissão (kgCO₂e)</span>

                        <span className="text-[#D4E3DA] font-medium">{row.emissionLabel}</span>

                      </div>

                    </div>

                  </div>

                );

              })}

            </div>



            {/* DESKTOP (>= 768px): Tabela completa */}

            <div className="hidden md:block overflow-x-auto">

              <table className="w-full text-left text-sm whitespace-nowrap border-collapse">

                <thead>
                  <tr className="bg-[#96AA9E] text-[#07150E] text-xs font-semibold">
                    <th className="py-3 pl-4 pr-2 rounded-l-lg w-10"></th>
                    <th className="py-3 px-3 border-r border-[#07150E]/20">Serviço</th>
                    <th className="py-3 px-4 border-r border-[#07150E]/20">Localização</th>
                    <th className="py-3 px-4 border-r border-[#07150E]/20">Status</th>
                    <th className="py-3 px-4 border-r border-[#07150E]/20">
                      Consumo no período (kWh)
                    </th>
                    <th className="py-3 px-4 rounded-r-lg">
                      Emissão no período (kgCO₂e)
                    </th>
                  </tr>
                </thead>

                <tbody>

                  <tr className="h-2"></tr>



                  {filteredServices.map((row) => {

                    const isChecked = selectedServiceCodes.includes(row.code);

                    const disableNewSelection = !isChecked && selectedServiceCodes.length >= 5;



                    return (

                      <tr

                        key={row.code}

                        onClick={() => setSelectedServiceModal(mapServiceRowToModalData(row))}

                        className="border-b border-[#243F2F] hover:bg-[#122B1C] transition-colors cursor-pointer"

                      >

                        <td

                          className="py-3.5 pl-4 pr-2"

                          onClick={(e) => e.stopPropagation()}

                        >

                          <button

                            type="button"

                            disabled={disableNewSelection}

                            onClick={() => toggleServiceSelection(row.code)}

                            aria-label={`Selecionar ${row.code} para comparação`}

                            className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors cursor-pointer ${

                              isChecked

                                ? 'bg-[#2FA862] border-[#14C45A] text-white'

                                : 'bg-transparent border-[#8FA89B] hover:border-[#F2FAF5] disabled:opacity-35 disabled:cursor-not-allowed'

                            }`}

                          >

                            {isChecked && (

                              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.8">

                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10.5l3.2 3.2L15 7" />

                              </svg>

                            )}

                          </button>

                        </td>

                        <td className="py-3.5 px-3">

                          <div className="font-semibold text-[#F2FAF5]">{row.code}</div>

                          <div className="text-xs text-[#9DB0A4]">{row.subId}</div>

                        </td>

                        <td className="py-3.5 px-4 text-[#D4E3DA]">{row.location}</td>

                        <td className="py-3.5 px-4">

                          <DashboardStatusPill status={row.status} />

                        </td>

                        <td className="py-3.5 px-4 text-[#D4E3DA]">{row.consumptionLabel}</td>

                        <td className="py-3.5 px-4 text-[#D4E3DA]">{row.emissionLabel}</td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

          </>

        )}



        {/* Rodapé da tabela com paginação e SVGs oficiais do Figma */}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 text-xs text-[#9DB0A4]">

          <span>Mostrando 1–{filteredServices.length} de 128 serviços</span>

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

              onClick={() => setCurrentPage(16)}

              className={`w-9 h-9 flex items-center justify-center rounded-xl border-2 text-xs transition cursor-pointer ${

                currentPage === 16

                  ? 'bg-[#2FA862] text-[#F2FAF5] border-[#14C45A] font-bold'

                  : 'bg-[#0B1C12] border-[#385E47] text-[#8FA89B] font-medium hover:bg-[#183825]'

              }`}

            >

              16

            </button>

            <button

              type="button"

              onClick={() => setCurrentPage((p) => Math.min(16, p + 1))}

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