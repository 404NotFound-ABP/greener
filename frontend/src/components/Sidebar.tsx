import React, { useState, useMemo } from 'react';
import { ServiceCard } from './ServiceCard';
import type { ServiceData } from '../types/service';
import {
  matchesServiceStatus,
  type ServiceFilterKey
} from '../config/statusConfig';
import {
  CallbackServiceRepository,
  defaultServiceRepository,
  type ServiceRepository
} from '../adapters/serviceAdapter';
import { useServicesPolling } from '../hooks/useServicesPolling';
import { extractValidCoordinates, formatServiceLocation } from './mapServiceUtils';

export type MobileSheetView = 'filters' | 'list' | 'collapsed';

export interface SidebarProps {
  currentTheme: 'dark' | 'satellite';
  activeFilters: {
    ativo: boolean;
    indisponível: boolean;
    sem_metricas: boolean;
  };
  toggleFilter: (status: ServiceFilterKey) => void;
  resetFilters?: () => void;
  isMinimized: boolean;
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  mobileSheetView?: MobileSheetView;
  setMobileSheetView?: React.Dispatch<React.SetStateAction<MobileSheetView>>;
  repository?: ServiceRepository;
  onFetchServices?: () => Promise<ServiceData[]>;
  pollingState?: ReturnType<typeof useServicesPolling>;
  onSelectService?: (service: ServiceData) => void;
  hiddenServiceIds?: ReadonlySet<string>;
  onToggleServiceMarker?: (service: ServiceData) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeFilters,
  toggleFilter,
  resetFilters,
  isMinimized,
  setIsMinimized,
  mobileSheetView,
  setMobileSheetView,
  repository,
  onFetchServices,
  pollingState,
  onSelectService,
  hiddenServiceIds,
  onToggleServiceMarker
}) => {
  const [internalSheetView, setInternalSheetView] = useState<MobileSheetView>('filters');
  const currentSheetView = mobileSheetView ?? internalSheetView;
  const updateSheetView = setMobileSheetView ?? setInternalSheetView;

  const [searchTerm, setSearchTerm] = useState('');
  const [mapMetrics, setMapMetrics] = useState({
    co2: true,
    agua: true,
    kwh: true
  });

  // Resolve a dependência injetada via interface ServiceRepository (DIP + Adapter)
  const resolvedRepository = useMemo<ServiceRepository>(() => {
    if (repository) return repository;
    if (onFetchServices) return new CallbackServiceRepository(onFetchServices);
    return defaultServiceRepository;
  }, [repository, onFetchServices]);

  const internalPolling = useServicesPolling({ repository: resolvedRepository });
  const {
    services,
    lastUpdate,
    isPaused,
    isRefreshing,
    hasError,
    isStale,
    togglePause,
    triggerRefresh
  } = pollingState ?? internalPolling;

  const handleClearMobileFilters = () => {
    setSearchTerm('');
    setMapMetrics({ co2: true, agua: true, kwh: true });
    if (resetFilters) {
      resetFilters();
    } else {
      if (!activeFilters.ativo) toggleFilter('ativo');
      if (!activeFilters.indisponível) toggleFilter('indisponível');
      if (!activeFilters.sem_metricas) toggleFilter('sem_metricas');
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesStatus = matchesServiceStatus(service.status, activeFilters);

    const term = searchTerm.toLowerCase().trim();
    const nome = (service.nome ?? '').toLowerCase();
    const cidade = (service.localizacao?.cidade ?? '').toLowerCase();
    const regiao = (service.localizacao?.regiao ?? '').toLowerCase();
    const pais = (service.localizacao?.pais ?? '').toLowerCase();

    const matchesSearch =
      !term ||
      nome.includes(term) ||
      cidade.includes(term) ||
      regiao.includes(term) ||
      pais.includes(term) ||
      (term.includes('sem coordenada') && !extractValidCoordinates(service)) ||
      (term.includes('não informad') && formatServiceLocation(service.localizacao).isIncomplete);

    return matchesStatus && matchesSearch;
  });

  const statusIndicatorColor = hasError
    ? 'bg-[#F34F0E]'
    : isStale || isPaused
    ? 'bg-amber-400'
    : 'bg-[#2FA862] animate-pulse';

  const statusText = hasError
    ? 'Falha ao atualizar · dados antigos'
    : isPaused
    ? isStale
      ? 'Dados antigos · atualização pausada'
      : 'Atualização pausada'
    : isStale
    ? 'Dados antigos · reconectando...'
    : 'Atualizando a cada 5s';

  const renderServiceItem = (service: ServiceData) => {
    const hasCoords = Boolean(extractValidCoordinates(service));
    const locationInfo = formatServiceLocation(service.localizacao);

    return (
      <div
        key={service.id}
        onClick={() => onSelectService?.(service)}
        className={`self-stretch flex flex-col gap-1 ${onSelectService ? 'cursor-pointer' : ''}`}
      >
        <ServiceCard
          service={service}
          markerVisible={!hiddenServiceIds?.has(service.id)}
          onToggleMarker={() => onToggleServiceMarker?.(service)}
        />

        {/* Indicadores explícitos para localização incompleta (#96) ou ausência de coordenadas (#102) */}
        {(locationInfo.isIncomplete || !hasCoords) && (
          <div className="px-2.5 py-1 rounded-[8px] bg-[#081C12]/70 border border-[#F2FAF5]/15 flex items-center justify-between gap-2 text-[11px] text-[#DDF1E5]/85">
            {locationInfo.isIncomplete && (
              <span className="truncate" title={locationInfo.text}>
                Localização: {locationInfo.text}
              </span>
            )}
            {!hasCoords && (
              <span className="px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/40 text-amber-300 font-medium whitespace-nowrap shrink-0">
                Sem coordenadas no mapa
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* =========================================================
          MOBILE (< 640px): BOTTOM SHEET RECOLHIDO
          ========================================================= */}
      {currentSheetView === 'collapsed' && (
        <div
          translate="no"
          className="notranslate flex sm:hidden fixed bottom-0 left-0 right-0 z-[1001] px-4 py-3 bg-[#081C12]/90 backdrop-blur-xl rounded-t-[20px] border-t border-[#F2FAF5]/40 shadow-2xl flex-col items-center gap-2"
        >
          <button
            type="button"
            onClick={() => updateSheetView('filters')}
            className="w-full flex flex-col items-center gap-2 cursor-pointer"
          >
            <div className="w-[42px] h-[4px] bg-[#F2FAF5] rounded-full" />
            <span className="text-[#F2FAF5] text-[13px] font-medium">
              Mostrar filtros e serviços ({filteredServices.length})
            </span>
          </button>
        </div>
      )}

      {/* =========================================================
          MOBILE (< 640px): BOTTOM SHEET PRINCIPAL (Filtros / Lista)
          ========================================================= */}
      {currentSheetView !== 'collapsed' && (
        <section
          translate="no"
          aria-label="Filtros e serviços mobile"
          className={`notranslate flex sm:hidden fixed bottom-0 left-0 right-0 z-[1001] px-[18px] pt-[12px] pb-[18px] bg-[#081C12]/92 backdrop-blur-xl rounded-t-[24px] border-t border-[#F2FAF5]/40 shadow-[0_-12px_32px_rgba(0,0,0,0.5)] flex-col justify-start items-start gap-[14px] transition-all duration-300 ${
            currentSheetView === 'list' ? 'h-[58vh]' : 'max-h-[75vh]'
          }`}
        >
          <button
            type="button"
            onClick={() =>
              updateSheetView(currentSheetView === 'filters' ? 'list' : 'filters')
            }
            aria-label="Alternar altura do painel"
            className="w-full py-1 flex justify-center items-center cursor-pointer shrink-0"
          >
            <div className="w-[44px] h-[4px] bg-[#F2FAF5] rounded-full" />
          </button>

          <div className="self-stretch px-[12px] py-[10px] bg-[#166A3E]/35 rounded-[12px] border border-[#2FA862] flex justify-start items-center gap-[8px] shrink-0">
            <svg
              className="w-[20px] h-[20px] text-[#F2FAF5] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquise por nome, cidade, região ou país"
              className="w-full bg-transparent text-white placeholder-white/85 text-[14px] font-normal leading-[20px] focus:outline-none"
            />
          </div>

          {currentSheetView === 'filters' && (
            <>
              <div className="self-stretch flex flex-col gap-[8px]">
                <span className="text-white text-[18px] font-medium leading-[24px]">
                  Mostrar no mapa
                </span>
                <div className="flex items-center gap-[8px] flex-wrap">
                  <button
                    type="button"
                    onClick={() => setMapMetrics((prev) => ({ ...prev, co2: !prev.co2 }))}
                    className={`px-[12px] py-[6px] rounded-[10px] border border-[#2FA862] text-[14px] text-[#F2FAF5] transition-all cursor-pointer ${
                      mapMetrics.co2 ? 'bg-[#1F8A4C]/45 opacity-100' : 'bg-[#1F8A4C]/10 opacity-45'
                    }`}
                  >
                    CO2
                  </button>

                  <button
                    type="button"
                    onClick={() => setMapMetrics((prev) => ({ ...prev, agua: !prev.agua }))}
                    className={`px-[12px] py-[6px] rounded-[10px] border border-[#2563EB] text-[14px] text-[#F2FAF5] transition-all cursor-pointer ${
                      mapMetrics.agua ? 'bg-[#1D4ED8]/45 opacity-100' : 'bg-[#1D4ED8]/10 opacity-45'
                    }`}
                  >
                    gasto de água
                  </button>

                  <button
                    type="button"
                    onClick={() => setMapMetrics((prev) => ({ ...prev, kwh: !prev.kwh }))}
                    className={`px-[12px] py-[6px] rounded-[10px] border border-[#CA8A04] text-[14px] text-[#F2FAF5] transition-all cursor-pointer ${
                      mapMetrics.kwh ? 'bg-[#A16207]/45 opacity-100' : 'bg-[#A16207]/10 opacity-45'
                    }`}
                  >
                    gasto de kWh
                  </button>
                </div>
              </div>

              <div className="self-stretch flex flex-col gap-[8px]">
                <span className="text-white text-[18px] font-medium leading-[24px]">
                  Estado do serviço
                </span>
                <div className="flex items-center gap-[8px] flex-wrap">
                  <button
                    type="button"
                    onClick={() => toggleFilter('ativo')}
                    className={`px-[12px] py-[6px] rounded-[10px] border border-[#2FA862] flex items-center gap-[6px] transition-all cursor-pointer ${
                      activeFilters.ativo
                        ? 'bg-[#1F8A4C]/25 opacity-100'
                        : 'bg-[#1F8A4C]/5 opacity-40'
                    }`}
                  >
                    <svg className="w-[18px] h-[18px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="1.8" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                    </svg>
                    <span className="text-[#F7F7F5] text-[14px] font-normal">Ativo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFilter('indisponível')}
                    className={`px-[12px] py-[6px] rounded-[10px] border border-[#9C2A2A] flex items-center gap-[6px] transition-all cursor-pointer ${
                      activeFilters.indisponível
                        ? 'bg-[#9C2A2A]/25 opacity-100'
                        : 'bg-[#9C2A2A]/5 opacity-40'
                    }`}
                  >
                    <svg className="w-[18px] h-[18px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="1.8" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 10l4 4m0-4l-4 4" />
                    </svg>
                    <span className="text-[#F7F7F5] text-[14px] font-normal">Indisponível</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFilter('sem_metricas')}
                    className={`px-[12px] py-[6px] rounded-[10px] border border-[#B8B7B8] flex items-center gap-[6px] transition-all cursor-pointer ${
                      activeFilters.sem_metricas
                        ? 'bg-[#B8B7B8]/25 opacity-100'
                        : 'bg-[#B8B7B8]/5 opacity-40'
                    }`}
                  >
                    <svg className="w-[18px] h-[18px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="1.8" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8" />
                    </svg>
                    <span className="text-[#F7F7F5] text-[14px] font-normal">Sem métricas</span>
                  </button>
                </div>
              </div>

              <div className="self-stretch pt-[4px] flex justify-between items-center gap-[12px]">
                <button
                  type="button"
                  onClick={handleClearMobileFilters}
                  className="text-[#F2FAF5]/90 hover:text-white text-[14px] font-normal py-2 cursor-pointer"
                >
                  Limpar filtros
                </button>

                <button
                  type="button"
                  onClick={() => updateSheetView('list')}
                  className="px-[22px] py-[11px] bg-[#1F8A4C] hover:bg-[#2FA862] rounded-[12px] text-white text-[15px] font-medium transition-colors cursor-pointer"
                >
                  Ver {filteredServices.length}{' '}
                  {filteredServices.length === 1 ? 'serviço' : 'serviços'}
                </button>
              </div>
            </>
          )}

          {currentSheetView === 'list' && (
            <>
              <div className="self-stretch flex justify-between items-center shrink-0">
                <span className="text-white text-[18px] font-medium leading-[24px]">
                  Serviços
                </span>
                <span className="text-[#DDF1E5]/80 text-[13px] font-normal">
                  {filteredServices.length} de {services.length}
                </span>
              </div>

              <div className="self-stretch flex-1 overflow-y-auto flex flex-col gap-[8px] pr-[2px]">
                {filteredServices.length > 0 ? (
                  filteredServices.map(renderServiceItem)
                ) : (
                  <div className="self-stretch py-6 px-4 rounded-[12px] bg-[#166A3E]/15 border border-[#2FA862]/30 text-center text-[#DDF1E5]/85 text-[13px]">
                    Nenhum serviço encontrado para os filtros ou busca atuais.
                  </div>
                )}
              </div>

              <div className="self-stretch pt-[2px] flex justify-between items-center gap-2 text-[12px] shrink-0">
                <div className="flex flex-col min-w-0">
                  <span className="text-[#DDF1E5]/90 truncate">
                    Última atualização: {lastUpdate}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${statusIndicatorColor}`} />
                    <span
                      className={`truncate ${
                        hasError
                          ? 'text-[#FCA5A5]'
                          : isStale
                          ? 'text-amber-300'
                          : 'text-[#DDF1E5]/80'
                      }`}
                    >
                      {statusText}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={togglePause}
                    title={isPaused ? 'Retomar atualização automática' : 'Pausar atualização automática'}
                    aria-label={isPaused ? 'Retomar atualização automática' : 'Pausar atualização automática'}
                    className="w-[28px] h-[28px] rounded-[8px] bg-[#1F8A4C]/30 border border-[#2FA862] flex items-center justify-center text-[#F2FAF5] cursor-pointer"
                  >
                    {isPaused ? (
                      <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : (
                      <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void triggerRefresh()}
                    title="Atualizar agora"
                    aria-label="Atualizar agora"
                    className={`w-[28px] h-[28px] rounded-[8px] border flex items-center justify-center text-[#F2FAF5] cursor-pointer ${
                      hasError
                        ? 'bg-[#9C2A2A]/40 border-[#F34F0E]'
                        : 'bg-[#1F8A4C]/30 border-[#2FA862]'
                    }`}
                  >
                    <svg
                      className={`w-[14px] h-[14px] transition-transform duration-300 ${
                        isRefreshing ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* =========================================================
          DESKTOP (>= 640px): BARRA COMPACTA QUANDO MINIMIZADA
          ========================================================= */}
      {isMinimized && (
        <div
          translate="no"
          className="notranslate hidden sm:flex absolute top-4 left-4 z-[1000] w-[260px] p-[10px] bg-[#0E3B25]/25 backdrop-blur-xl overflow-hidden rounded-[16px] border-l border-t border-[#F2FAF5] shadow-[inset_-4px_-4px_10px_rgba(14,59,37,0.35),0_8px_20px_rgba(0,0,0,0.25)] justify-start items-center gap-[10px] transition-all duration-300"
        >
          <div className="flex-1 px-[10px] py-[8px] bg-[#F2FAF5]/25 overflow-hidden rounded-[14px] border border-[#1F8A4C] flex justify-start items-center gap-[6px]">
            <svg
              className="w-[18px] h-[18px] text-[#F2FAF5] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsMinimized(false)}
              placeholder="Busque o serviço"
              className="w-full bg-transparent text-white placeholder-white/90 text-[12px] font-normal leading-[16px] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            title="Expandir barra lateral"
            className="w-[35px] h-[35px] relative bg-[#1F8A4C]/50 hover:bg-[#1F8A4C]/80 overflow-hidden rounded-[14px] border border-[#2FA862] flex items-center justify-center text-[#F2FAF5] transition-colors cursor-pointer shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12.5 2.5H17.5V7.5M7.5 17.5H2.5V12.5M17.5 2.5L11.6667 8.33333M2.5 17.5L8.33333 11.6667"
                stroke="#F2FAF5"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* =========================================================
          DESKTOP (>= 640px): CONTAINER PRINCIPAL DA SIDEBAR
          ========================================================= */}
      <aside
        translate="no"
        className={`notranslate hidden sm:flex absolute top-4 bottom-4 left-4 z-[1000] w-[420px] p-[15px] bg-[#0E3B25]/25 backdrop-blur-xl overflow-hidden rounded-[16px] border-l border-t border-[#F2FAF5] flex-col justify-start items-start gap-[10px] transition-all duration-300 ease-in-out shadow-2xl ${
          isMinimized
            ? '-translate-x-[460px] opacity-0 pointer-events-none'
            : 'translate-x-0 opacity-100'
        }`}
      >
        {/* 1. TOPO: BARRA DE BUSCA + 3 BOTÕES DE AÇÃO */}
        <div className="self-stretch flex justify-start items-center gap-[16px]">
          <div className="flex-1 px-[10px] py-[8px] bg-[#F2FAF5]/25 overflow-hidden rounded-[14px] border border-[#1F8A4C] flex justify-start items-center gap-[5px]">
            <svg
              className="w-[20px] h-[20px] text-[#F2FAF5] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Busque por serviço ou localização"
              className="w-full bg-transparent text-white placeholder-white/90 text-[12px] font-normal leading-[16px] focus:outline-none"
            />
          </div>

          <div className="flex justify-end items-center gap-[5px]">
            <button
              type="button"
              title="Enviar arquivo"
              className="w-[35px] h-[35px] relative bg-[#1F8A4C]/50 hover:bg-[#1F8A4C]/80 overflow-hidden rounded-[14px] border border-[#2FA862] flex items-center justify-center text-[#F2FAF5] transition-colors cursor-pointer shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5.5075 1.6775C6.75685 0.600169 8.3503 0.00517314 10 0C13.3625 0 16.1538 2.5 16.4575 5.72375C18.4475 6.005 20 7.67125 20 9.71625C20 11.9612 18.1275 13.75 15.8588 13.75H12.5C12.3342 13.75 12.1753 13.6842 12.0581 13.5669C11.9408 13.4497 11.875 13.2908 11.875 13.125C11.875 12.9592 11.9408 12.8003 12.0581 12.6831C12.1753 12.5658 12.3342 12.5 12.5 12.5H15.86C17.4737 12.5 18.75 11.235 18.75 9.71625C18.75 8.19625 17.475 6.93125 15.8588 6.93125H15.2338V6.30625C15.235 3.53125 12.91 1.25 10 1.25C8.64985 1.25539 7.34605 1.74304 6.32375 2.625C5.3775 3.44 4.8825 4.4225 4.8825 5.19375V5.75375L4.32625 5.815C2.58 6.00625 1.25 7.44 1.25 9.1475C1.25 10.9812 2.7875 12.5 4.72625 12.5H7.5C7.66576 12.5 7.82473 12.5658 7.94194 12.6831C8.05915 12.8003 8.125 12.9592 8.125 13.125C8.125 13.2908 8.05915 13.4497 7.94194 13.5669C7.82473 13.6842 7.66576 13.75 7.5 13.75H4.72625C2.135 13.75 0 11.7075 0 9.1475C0 6.94375 1.5825 5.11875 3.6775 4.65625C3.85625 3.5775 4.55 2.5025 5.5075 1.6775Z"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  fill="#F2FAF5"
                />
                <path
                  d="M9.5575 5.18252C9.61556 5.12431 9.68453 5.07814 9.76046 5.04663C9.83639 5.01512 9.91779 4.9989 10 4.9989C10.0822 4.9989 10.1636 5.01512 10.2395 5.04663C10.3155 5.07814 10.3844 5.12431 10.4425 5.18252L14.1925 8.93252C14.3099 9.04988 14.3758 9.20905 14.3758 9.37502C14.3758 9.54099 14.3099 9.70016 14.1925 9.81752C14.0751 9.93488 13.916 10.0008 13.75 10.0008C13.584 10.0008 13.4249 9.93488 13.3075 9.81752L10.625 7.13377V18.125C10.625 18.2908 10.5592 18.4497 10.4419 18.567C10.3247 18.6842 10.1658 18.75 10 18.75C9.83424 18.75 9.67527 18.6842 9.55806 18.567C9.44085 18.4497 9.375 18.2908 9.375 18.125V7.13377L6.6925 9.81752C6.57514 9.93488 6.41597 10.0008 6.25 10.0008C6.08403 10.0008 5.92486 9.93488 5.8075 9.81752C5.69014 9.70016 5.62421 9.54099 5.62421 9.37502C5.62421 9.20905 5.69014 9.04988 5.8075 8.93252L9.5575 5.18252Z"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  fill="#F2FAF5"
                />
              </svg>
            </button>

            <button
              type="button"
              title="Copiar"
              className="w-[35px] h-[35px] relative bg-[#1F8A4C]/50 hover:bg-[#1F8A4C]/80 overflow-hidden rounded-[14px] border border-[#2FA862] flex items-center justify-center text-[#F2FAF5] transition-colors cursor-pointer shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.14286 6.78574H4.82143C4.39519 6.78574 3.9864 6.95506 3.68501 7.25646C3.38361 7.55786 3.21429 7.96664 3.21429 8.39288V15.1786C3.21429 15.6048 3.38361 16.0136 3.68501 16.315C3.9864 16.6164 4.39519 16.7857 4.82143 16.7857H9.46429C9.89053 16.7857 10.2993 16.6164 10.6007 16.315C10.9021 16.0136 11.0714 15.6048 11.0714 15.1786V15H12.1429V15.1786C12.1429 15.889 11.8607 16.5703 11.3583 17.0726C10.856 17.575 10.1747 17.8572 9.46429 17.8572H4.82143C4.11103 17.8572 3.42972 17.575 2.92739 17.0726C2.42506 16.5703 2.14286 15.889 2.14286 15.1786V8.39288C2.14286 7.68248 2.42506 7.00118 2.92739 6.49885C3.42972 5.99652 4.11103 5.71431 4.82143 5.71431H7.14286V6.78574ZM15.1786 2.14288C15.889 2.14288 16.5703 2.42509 17.0726 2.92742C17.5749 3.42975 17.8571 4.11105 17.8571 4.82145V11.6072C17.8571 12.3176 17.5749 12.9989 17.0726 13.5012C16.5703 14.0035 15.889 14.2857 15.1786 14.2857H10.5357C9.82531 14.2857 9.14401 14.0035 8.64168 13.5012C8.13935 12.9989 7.85714 12.3176 7.85714 11.6072V4.82145C7.85714 4.11105 8.13935 3.42975 8.64168 2.92742C9.14401 2.42509 9.82531 2.14288 10.5357 2.14288H15.1786ZM10.5357 3.21431C10.1095 3.21431 9.70069 3.38364 9.39929 3.68503C9.09789 3.98643 8.92857 4.39521 8.92857 4.82145V11.6072C8.92857 12.0334 9.09789 12.4422 9.39929 12.7436C9.70069 13.045 10.1095 13.2143 10.5357 13.2143H15.1786C15.6048 13.2143 16.0136 13.045 16.315 12.7436C16.6164 12.4422 16.7857 12.0334 16.7857 11.6072V4.82145C16.7857 4.39521 16.6164 3.98643 16.315 3.68503C16.0136 3.38364 15.6048 3.21431 15.1786 3.21431H10.5357Z"
                  fill="#F2FAF5"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              title="Minimizar"
              className="w-[35px] h-[35px] relative bg-[#1F8A4C]/50 hover:bg-[#1F8A4C]/80 overflow-hidden rounded-[14px] border border-[#2FA862] flex items-center justify-center text-[#F2FAF5] transition-colors cursor-pointer shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11.6667 8.33333L17.5 2.5M11.6667 3.33333V8.33333H16.6667M2.5 17.5L8.33333 11.6667M3.33333 11.6667H8.33333V16.6667"
                  stroke="#F2FAF5"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 2. SEÇÃO: ESTADO DO SERVIÇO */}
        <div className="self-stretch px-[10px] flex flex-col justify-center items-start gap-[10px]">
          <div className="overflow-hidden flex justify-start items-center gap-[6px]">
            <span className="text-white text-[20px] font-medium leading-[28px]">
              Estado do serviço
            </span>
            <div className="w-[20px] h-[20px] overflow-hidden rounded-[10px] border-[1.5px] border-[#F2FAF5] flex justify-center items-center">
              <span className="text-[#F2FAF5] text-[12px] font-bold leading-none">
                i
              </span>
            </div>
          </div>

          <div className="self-stretch flex justify-start items-center gap-[8px] flex-wrap content-center">
            <button
              type="button"
              onClick={() => toggleFilter('ativo')}
              className={`px-[10px] py-[5px] overflow-hidden rounded-[10px] border border-[#2FA862] flex justify-start items-center gap-[4px] transition-all cursor-pointer ${
                activeFilters.ativo
                  ? 'bg-[#1F8A4C]/20 opacity-100'
                  : 'bg-[#1F8A4C]/5 opacity-40 hover:opacity-75'
              }`}
            >
              <div className="w-[25px] h-[25px] relative overflow-hidden flex items-center justify-center">
                <svg className="w-[20px] h-[20px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="1.8" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" className="text-[#F2FAF5]" />
                </svg>
              </div>
              <span className="text-[#F7F7F5] text-[16px] font-normal leading-[24px] whitespace-nowrap">
                Ativo
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleFilter('indisponível')}
              className={`px-[10px] py-[5px] overflow-hidden rounded-[10px] border border-[#9C2A2A] flex justify-start items-center gap-[4px] transition-all cursor-pointer ${
                activeFilters.indisponível
                  ? 'bg-[#9C2A2A]/20 opacity-100'
                  : 'bg-[#9C2A2A]/5 opacity-40 hover:opacity-75'
              }`}
            >
              <div className="w-[25px] h-[25px] relative overflow-hidden flex items-center justify-center">
                <svg className="w-[20px] h-[20px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="1.8" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 10l4 4m0-4l-4 4" />
                </svg>
              </div>
              <span className="text-[#F7F7F5] text-[16px] font-normal leading-[24px] whitespace-nowrap">
                Indisponível
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleFilter('sem_metricas')}
              className={`px-[10px] py-[5px] overflow-hidden rounded-[10px] border border-[#B8B7B8] flex justify-start items-center gap-[4px] transition-all cursor-pointer ${
                activeFilters.sem_metricas
                  ? 'bg-[#B8B7B8]/20 opacity-100'
                  : 'bg-[#B8B7B8]/5 opacity-40 hover:opacity-75'
              }`}
            >
              <div className="w-[25px] h-[25px] relative overflow-hidden flex items-center justify-center">
                <svg className="w-[20px] h-[20px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="1.8" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8" className="text-[#F2FAF5]" />
                </svg>
              </div>
              <span className="text-[#F7F7F5] text-[16px] font-normal leading-[24px] whitespace-nowrap">
                Sem métrica
              </span>
            </button>
          </div>
        </div>

        {/* 3. SEÇÃO: LISTA DE SERVIÇOS */}
        <div className="self-stretch flex-1 px-[10px] overflow-hidden flex flex-col justify-start items-start gap-[10px]">
          <div className="self-stretch flex items-center justify-between">
            <span className="text-white text-[20px] font-medium leading-[28px]">
              Serviços
            </span>
            <span className="text-[#DDF1E5]/80 text-[12px]">
              {filteredServices.length} de {services.length}
            </span>
          </div>

          <div className="self-stretch flex-1 overflow-y-auto flex flex-col justify-start items-start gap-[10px] pr-[6px] [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#2FA862]/50 hover:[&::-webkit-scrollbar-thumb]:bg-[#2FA862] [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin] [scrollbar-color:rgba(47,168,98,0.5)_transparent]">
            {filteredServices.length > 0 ? (
              filteredServices.map(renderServiceItem)
            ) : (
              <div className="self-stretch py-6 px-4 rounded-[12px] bg-[#166A3E]/15 border border-[#2FA862]/30 text-center text-[#DDF1E5]/85 text-[13px]">
                Nenhum serviço encontrado para os filtros ou busca atuais.
              </div>
            )}
          </div>
        </div>

        {/* 4. RODAPÉ COM INDICADOR DE CICLO E RESILIÊNCIA */}
        <div className="self-stretch px-[10px] pt-[4px] flex justify-between items-center gap-[10px] shrink-0">
          <div className="flex-1 min-w-0 flex flex-col justify-center items-start gap-[2px]">
            <span className="text-white text-[15px] font-normal leading-[20px]">
              Última atualização: {lastUpdate}
            </span>
            <div className="flex items-center gap-[6px]">
              <span className={`w-[8px] h-[8px] rounded-full shrink-0 ${statusIndicatorColor}`} />
              <span
                className={`text-[12px] font-normal leading-[16px] truncate ${
                  hasError
                    ? 'text-[#FCA5A5]'
                    : isStale
                    ? 'text-amber-300'
                    : 'text-[#DDF1E5]/85'
                }`}
              >
                {statusText}
              </span>
            </div>
          </div>

          <div className="flex justify-start items-center gap-[10px] shrink-0">
            <button
              type="button"
              onClick={togglePause}
              title={isPaused ? 'Retomar atualização automática' : 'Pausar atualização automática'}
              aria-label={isPaused ? 'Retomar atualização automática' : 'Pausar atualização automática'}
              className="w-[40px] h-[40px] relative bg-[#1F8A4C]/30 hover:bg-[#1F8A4C]/60 overflow-hidden rounded-[10px] border border-[#2FA862] flex items-center justify-center text-[#F2FAF5] transition-colors cursor-pointer"
            >
              {isPaused ? (
                <svg className="w-[22px] h-[22px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="w-[22px] h-[22px]" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => void triggerRefresh()}
              title={hasError ? 'Tentar atualizar novamente' : 'Atualizar agora'}
              aria-label={hasError ? 'Tentar atualizar novamente' : 'Atualizar agora'}
              className={`w-[40px] h-[40px] relative overflow-hidden rounded-[10px] border flex items-center justify-center text-[#F2FAF5] transition-colors cursor-pointer ${
                hasError
                  ? 'bg-[#9C2A2A]/40 hover:bg-[#9C2A2A]/70 border-[#F34F0E]'
                  : 'bg-[#1F8A4C]/30 hover:bg-[#1F8A4C]/60 border-[#2FA862]'
              }`}
            >
              <svg
                className={`w-[22px] h-[22px] transition-transform duration-300 ${
                  isRefreshing ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;