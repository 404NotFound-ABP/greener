import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

import { ServiceModal } from './ServiceModal';
import type { ModalServiceData } from './ServiceModal';
import { Sidebar } from './Sidebar';
import type { MobileSheetView } from './Sidebar';
import type { MainTab } from './MainLayout';
import type { ServiceData } from '../types/service';
import { matchesServiceStatus } from '../config/statusConfig';
import {
  CallbackServiceRepository,
  HttpServiceRepository,
  type ServiceRepository
} from '../adapters/serviceAdapter';
import { useServicesPolling } from '../hooks/useServicesPolling';

export interface MapBackgroundProps {
  onLogout?: () => void;
  onSelectTab?: (tab: MainTab) => void;
  repository?: ServiceRepository;
  onFetchServices?: () => Promise<ServiceData[]>;
}

const DEFAULT_CENTER: [number, number] = [-23.3053, -45.9658];
const DEFAULT_ZOOM = 13;
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/+$/, '');
const mapServiceRepository = new HttpServiceRepository(`${API_BASE_URL}/servidores`);

const themes = {
  dark: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    cssClass: 'theme-dark'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    cssClass: ''
  }
};

function getPreviewTileUrls(lat: number, lng: number, zoom: number) {
  const z = Math.min(17, Math.max(1, Math.round(zoom)));
  const n = Math.pow(2, z);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );

  return {
    // Esri World Imagery usa ordem {z}/{y}/{x}
    satellite: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    // OpenStreetMap usa ordem {z}/{x}/{y}
    dark: `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
  };
}

function parseCoordNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Extrai e valida coordenadas de múltiplos formatos possíveis vindos da API.
 * Retorna null quando ausentes, nulas, vazias ou fora da faixa geográfica válida.
 */
function extractValidCoordinates(service: ServiceData): [number, number] | null {
  const raw = service as ServiceData & {
    coordenadas?:
      | {
          lat?: number | string | null;
          lng?: number | string | null;
          latitude?: number | string | null;
          longitude?: number | string | null;
        }
      | [number | string, number | string]
      | null;
    coords?: [number | string, number | string] | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    lat?: number | string | null;
    lng?: number | string | null;
    localizacao?: {
      lat?: number | string | null;
      lng?: number | string | null;
      latitude?: number | string | null;
      longitude?: number | string | null;
    } | null;
  };

  let rawLat: unknown;
  let rawLng: unknown;

  if (Array.isArray(raw.coords)) {
    [rawLat, rawLng] = raw.coords;
  } else if (Array.isArray(raw.coordenadas)) {
    [rawLat, rawLng] = raw.coordenadas;
  } else if (raw.coordenadas && typeof raw.coordenadas === 'object' && !Array.isArray(raw.coordenadas)) {
    rawLat = raw.coordenadas.lat ?? raw.coordenadas.latitude;
    rawLng = raw.coordenadas.lng ?? raw.coordenadas.longitude;
  } else if (
    raw.localizacao &&
    (raw.localizacao.lat !== undefined ||
      raw.localizacao.latitude !== undefined ||
      raw.localizacao.lng !== undefined ||
      raw.localizacao.longitude !== undefined)
  ) {
    rawLat = raw.localizacao.lat ?? raw.localizacao.latitude;
    rawLng = raw.localizacao.lng ?? raw.localizacao.longitude;
  } else {
    rawLat = raw.latitude ?? raw.lat;
    rawLng = raw.longitude ?? raw.lng;
  }

  const lat = parseCoordNumber(rawLat);
  const lng = parseCoordNumber(rawLng);

  if (
    lat === null ||
    lng === null ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return [lat, lng];
}

/**
 * Formata a localização textual tratando ausência parcial ou total de cidade, região e país (T23.2/US10).
 */
function formatServiceLocation(localizacao?: {
  cidade?: string | null;
  regiao?: string | null;
  pais?: string | null;
} | null): { text: string; isIncomplete: boolean } {
  const cidade = localizacao?.cidade?.trim() || '';
  const regiao = localizacao?.regiao?.trim() || '';
  const pais = localizacao?.pais?.trim() || '';

  const parts = [cidade, regiao, pais].filter(Boolean);

  if (parts.length === 0) {
    return { text: 'Localização não informada', isIncomplete: true };
  }

  if (parts.length < 3) {
    const missing: string[] = [];
    if (!cidade) missing.push('cidade');
    if (!regiao) missing.push('região');
    if (!pais) missing.push('país');

    return {
      text: `${parts.join(', ')} (${missing.join('/')} não informado)`,
      isIncomplete: true
    };
  }

  return { text: parts.join(', '), isIncomplete: false };
}

function mapStatusToModalStatus(status: string): ModalServiceData['status'] {
  const normalized = status?.toLowerCase().trim();
  if (normalized === 'ativo' || normalized === 'online' || normalized === 'active') {
    return 'ativo';
  }
  if (
    normalized === 'indisponivel' ||
    normalized === 'indisponível' ||
    normalized === 'offline' ||
    normalized === 'inactive'
  ) {
    return 'indisponível';
  }
  return 'sem_metricas';
}

function toModalServiceData(service: ServiceData): ModalServiceData {
  const loc = formatServiceLocation(service.localizacao);
  return {
    id: service.id,
    name: service.nome || 'Serviço sem nome',
    status: mapStatusToModalStatus(service.status),
    location: loc.text,
    country: service.localizacao?.pais ?? null,
    region: service.localizacao?.regiao ?? null,
    city: service.localizacao?.cidade ?? null,
    localizacao: service.localizacao,
    kwh: service.valores?.kwh ?? null,
    co2: service.valores?.gco2e ?? service.valores?.kgco2e ?? null,
    period: service.valores?.periodo ?? service.periodo,
    isEstimated: service.valores?.estimado ?? service.estimado,
    lastUpdate: service.ultimaAtualizacao
  };
}

export const MapBackground: React.FC<MapBackgroundProps> = ({
  onLogout,
  onSelectTab,
  repository,
  onFetchServices
}) => {
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'satellite'>('dark');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [mobileSheetView, setMobileSheetView] = useState<MobileSheetView>('filters');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const markerRefs = useRef<Record<string, L.CircleMarker | null>>({});

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const hasAutoFocusedServices = useRef(false);
  const [previewTiles, setPreviewTiles] = useState(() =>
    getPreviewTileUrls(DEFAULT_CENTER[0], DEFAULT_CENTER[1], DEFAULT_ZOOM)
  );
  const [tileErrorCount, setTileErrorCount] = useState(0);
  const [tileRetryKey, setTileRetryKey] = useState(0);
  const [selectedListService, setSelectedListService] = useState<ServiceData | null>(null);
  const [isEmptyBannerDismissed, setIsEmptyBannerDismissed] = useState(false);
  const [hiddenServiceIds, setHiddenServiceIds] = useState<ReadonlySet<string>>(() => new Set());

  const [activeFilters, setActiveFilters] = useState({
    ativo: true,
    indisponível: true,
    sem_metricas: true
  });

  const resolvedRepository = useMemo<ServiceRepository>(() => {
    if (repository) return repository;
    if (onFetchServices) return new CallbackServiceRepository(onFetchServices);
    return mapServiceRepository;
  }, [repository, onFetchServices]);

  const pollingState = useServicesPolling({
    repository: resolvedRepository,
    initialServices: [],
    loadPollingIntervalFromApi: true
  });
  const { services, isRefreshing, hasError, triggerRefresh } = pollingState;

  useEffect(() => {
    if (!mapInstance) return;

    const syncPreviewTiles = () => {
      const center = mapInstance.getCenter();
      setPreviewTiles(getPreviewTileUrls(center.lat, center.lng, mapInstance.getZoom()));
    };

    syncPreviewTiles();
    mapInstance.on('moveend', syncPreviewTiles);
    return () => {
      mapInstance.off('moveend', syncPreviewTiles);
    };
  }, [mapInstance]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleFilter = (status: 'ativo' | 'indisponível' | 'sem_metricas') => {
    if (mapInstance) {
      mapInstance.closePopup();
    }
    setIsEmptyBannerDismissed(false);
    setTimeout(() => {
      setActiveFilters(prev => ({ ...prev, [status]: !prev[status] }));
    }, 50);
  };

  const resetFilters = () => {
    if (mapInstance) {
      mapInstance.closePopup();
    }
    setIsEmptyBannerDismissed(false);
    setActiveFilters({
      ativo: true,
      indisponível: true,
      sem_metricas: true
    });
  };

  const toggleTheme = () => {
    setTileErrorCount(0);
    setCurrentTheme(prev => (prev === 'dark' ? 'satellite' : 'dark'));
  };

  const handleRetryMap = () => {
    setTileErrorCount(0);
    setTileRetryKey(prev => prev + 1);
    void triggerRefresh();
  };

  const getMarkerColor = (status: ModalServiceData['status']) => {
    if (status === 'ativo') return '#2FA862';
    if (status === 'indisponível') return '#9C2A2A';
    return '#B8B7B8';
  };

  const filteredServices = useMemo(
    () => services.filter(service => matchesServiceStatus(service.status, activeFilters)),
    [services, activeFilters]
  );

  const { mappableMarkers, servicesWithoutCoordsCount } = useMemo(() => {
    const valid: { service: ServiceData; modalData: ModalServiceData; coords: [number, number] }[] = [];
    let missingCoords = 0;

    for (const service of filteredServices) {
      const coords = extractValidCoordinates(service);
      if (coords) {
        valid.push({
          service,
          modalData: toModalServiceData(service),
          coords
        });
      } else {
        missingCoords += 1;
      }
    }

    return { mappableMarkers: valid, servicesWithoutCoordsCount: missingCoords };
  }, [filteredServices]);
  const visibleMarkers = mappableMarkers.filter(({ service }) => !hiddenServiceIds.has(service.id));

  useEffect(() => {
    if (
      selectedListService &&
      !filteredServices.some(service => service.id === selectedListService.id)
    ) {
      setSelectedListService(null);
    }
  }, [filteredServices, selectedListService]);

  useEffect(() => {
    if (!mapInstance || hasAutoFocusedServices.current || mappableMarkers.length === 0) return;

    const bounds = L.latLngBounds(mappableMarkers.map(({ coords }) => coords));
    mapInstance.fitBounds(bounds, { padding: [36, 36], maxZoom: DEFAULT_ZOOM });
    hasAutoFocusedServices.current = true;
  }, [mapInstance, mappableMarkers]);

  const handleToggleServiceMarker = (service: ServiceData) => {
    setHiddenServiceIds(current => {
      const next = new Set(current);
      if (next.has(service.id)) {
        next.delete(service.id);
      } else {
        next.add(service.id);
      }
      return next;
    });
  };

  const handleSelectServiceFromList = (service: ServiceData) => {
    const coords = extractValidCoordinates(service);
    if (coords && mapInstance) {
      setSelectedListService(null);
      mapInstance.flyTo(coords, Math.max(mapInstance.getZoom(), 13), { duration: 0.7 });
      const marker = markerRefs.current[String(service.id)];
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 350);
      }
    } else {
      setSelectedListService(service);
    }
  };

  const handleOpenServicesList = () => {
    setIsSidebarMinimized(false);
    setMobileSheetView('list');
  };

  const handleMobileBackClick = () => {
    if (mobileSheetView === 'list') {
      setMobileSheetView('filters');
    } else if (mobileSheetView === 'filters') {
      setMobileSheetView('collapsed');
    } else {
      setMobileSheetView('filters');
    }
  };

  const mobileFloatingBottomClass =
    mobileSheetView === 'list'
      ? 'bottom-[calc(58vh+12px)]'
      : mobileSheetView === 'filters'
      ? 'bottom-[348px]'
      : 'bottom-[68px]';

  const hasMapLayerFailure = tileErrorCount >= 4;
  const isInitialLoading = isRefreshing && services.length === 0;
  const showEmptyMarkersBanner =
    !isInitialLoading && mappableMarkers.length === 0 && !isEmptyBannerDismissed;

  return (
    <div className={`relative w-full h-full bg-neutro-900 ${themes[currentTheme].cssClass}`}>
      {/* =========================================================
          COMPONENTE 1: BARRA LATERAL (Desktop) / BOTTOM SHEET (Mobile)
          ========================================================= */}
      <Sidebar
        currentTheme={currentTheme}
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
        resetFilters={resetFilters}
        isMinimized={isSidebarMinimized}
        setIsMinimized={setIsSidebarMinimized}
        mobileSheetView={mobileSheetView}
        setMobileSheetView={setMobileSheetView}
        repository={resolvedRepository}
        pollingState={pollingState}
        onSelectService={handleSelectServiceFromList}
        hiddenServiceIds={hiddenServiceIds}
        onToggleServiceMarker={handleToggleServiceMarker}
      />

      <style>{`
        .leaflet-popup { max-width: calc(100vw - 24px) !important; }
        .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; max-width: 100% !important; }
        .leaflet-popup-tip-container { display: none !important; }
        .leaflet-container { background: #0b1116 !important; }
        
        .theme-dark .leaflet-tile {
          filter: invert(100%) hue-rotate(180deg) brightness(90%) contrast(105%) saturate(85%) !important;
        }
      `}</style>

      {/* =========================================================
          COMPONENTE 2: CONTAINER PRINCIPAL DO MAPA (LEAFLET)
          ========================================================= */}
      <MapContainer
        ref={setMapInstance}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          key={`${currentTheme}-${tileRetryKey}`}
          attribution={themes[currentTheme].attribution}
          url={themes[currentTheme].url}
          maxZoom={19}
          updateWhenZooming={false}
          keepBuffer={2}
          eventHandlers={{
            tileerror: () => setTileErrorCount(prev => prev + 1),
            tileload: () => {
              if (tileErrorCount > 0) setTileErrorCount(0);
            }
          }}
        />

        {visibleMarkers.map(({ service, modalData, coords }) => (
          <CircleMarker
            key={service.id}
            ref={el => {
              markerRefs.current[String(service.id)] = el;
            }}
            center={coords}
            pathOptions={{
              color: getMarkerColor(modalData.status),
              fillColor: getMarkerColor(modalData.status),
              fillOpacity: 0.85
            }}
            radius={14}
          >
            <Tooltip>{modalData.name} (Clique para abrir)</Tooltip>
            <Popup
              closeButton={false}
              maxWidth={460}
              autoPanPaddingTopLeft={[16, 76]}
              autoPanPaddingBottomRight={[16, 90]}
              offset={[0, -8]}
            >
              <ServiceModal
                service={modalData}
                onClose={() => mapInstance?.closePopup()}
                onOpenDashboard={() => {
                  mapInstance?.closePopup();
                  onSelectTab?.('dashboards');
                }}
              />
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* =========================================================
          AVISOS INFORMATIVOS NÃO-BLOQUEANTES DO MAPA (T25.3/US17 #102)
          ========================================================= */}
      <div
        className={`pointer-events-none absolute top-20 sm:top-4 right-4 sm:right-20 z-[1000] flex flex-col items-center sm:items-end gap-2 transition-all duration-300 ${
          isSidebarMinimized ? 'left-4 sm:left-[290px]' : 'left-4 sm:left-[452px]'
        }`}
      >
        {isInitialLoading && (
          <div
            role="status"
            className="pointer-events-auto px-3.5 py-2 rounded-full bg-[#081C12]/90 backdrop-blur-xl border border-[#2FA862]/60 text-[#F2FAF5] text-[12px] sm:text-[13px] flex items-center gap-2 shadow-xl"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#22D55B] animate-ping shrink-0" />
            <span>Carregando serviços e marcadores no mapa...</span>
          </div>
        )}

        {(hasMapLayerFailure || hasError) && (
          <div
            role="alert"
            className="pointer-events-auto max-w-md px-4 py-2.5 rounded-[14px] bg-[#240B0B]/92 backdrop-blur-xl border border-[#F34F0E]/80 text-[#F2FAF5] text-[12px] sm:text-[13px] flex items-center justify-between gap-3 shadow-2xl"
          >
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-[#FCA5A5]">
                {hasMapLayerFailure
                  ? 'Falha ao carregar camadas do mapa'
                  : 'Falha ao sincronizar serviços'}
              </span>
              <span className="text-[#F2FAF5]/85 text-[11px] sm:text-[12px]">
                A lista de serviços e os dashboards continuam disponíveis normalmente.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRetryMap}
              className="px-3 py-1.5 rounded-[10px] bg-[#9C2A2A] hover:bg-[#B83232] text-white text-[12px] font-medium shrink-0 transition-colors cursor-pointer"
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={handleOpenServicesList}
              className="underline text-amber-300 hover:text-amber-200 text-[11px] font-medium shrink-0 cursor-pointer"
            >
              Acessar serviços
            </button>
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('dashboards')}
                className="underline text-amber-300 hover:text-amber-200 text-[11px] font-medium shrink-0 cursor-pointer"
              >
                Abrir dashboards
              </button>
            )}
          </div>
        )}

        {!isInitialLoading && servicesWithoutCoordsCount > 0 && mappableMarkers.length > 0 && (
          <div className="pointer-events-auto px-3.5 py-2 rounded-[12px] bg-[#081C12]/90 backdrop-blur-xl border border-amber-400/50 text-[#F2FAF5] text-[12px] flex items-center gap-2.5 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>
              {servicesWithoutCoordsCount}{' '}
              {servicesWithoutCoordsCount === 1
                ? 'serviço sem coordenadas no mapa'
                : 'serviços sem coordenadas no mapa'}
            </span>
            <button
              type="button"
              onClick={handleOpenServicesList}
              className="underline text-amber-300 hover:text-amber-200 font-medium cursor-pointer whitespace-nowrap"
            >
              Acessar na lista
            </button>
          </div>
        )}

        {showEmptyMarkersBanner && (
          <div
            role="status"
            className="pointer-events-auto max-w-md px-4 py-3 rounded-[16px] bg-[#081C12]/92 backdrop-blur-xl border border-[#F2FAF5]/40 text-[#F2FAF5] text-[12px] sm:text-[13px] flex flex-col gap-2 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span className="font-semibold">
                  {services.length === 0
                    ? 'Nenhum serviço disponível no momento'
                    : filteredServices.length === 0
                    ? 'Nenhum marcador corresponde aos filtros selecionados'
                    : 'Nenhum serviço filtrado possui coordenadas para exibição no mapa'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsEmptyBannerDismissed(true)}
                aria-label="Fechar aviso"
                title="Fechar aviso"
                className="w-6 h-6 -mt-0.5 -mr-1 rounded-full flex items-center justify-center text-[#DDF1E5]/70 hover:text-[#F2FAF5] hover:bg-[#F2FAF5]/15 transition-colors shrink-0 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 3L11 11M11 3L3 11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <p className="text-[#DDF1E5]/85 text-[11px] sm:text-[12px] leading-relaxed">
              {filteredServices.length > 0
                ? `Há ${filteredServices.length} ${
                    filteredServices.length === 1 ? 'serviço disponível' : 'serviços disponíveis'
                  } para consulta na lista lateral e nos dashboards.`
                : 'Ajuste os filtros de status ou consulte os demais painéis pelo menu.'}
            </p>
            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
              {filteredServices.length === 0 && services.length > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-1.5 rounded-[10px] bg-[#1F8A4C] hover:bg-[#2FA862] text-white text-[12px] font-medium transition-colors cursor-pointer"
                >
                  Restaurar filtros
                </button>
              )}
              {filteredServices.length > 0 && (
                <button
                  type="button"
                  onClick={handleOpenServicesList}
                  className="px-3 py-1.5 rounded-[10px] bg-[#1F8A4C] hover:bg-[#2FA862] text-white text-[12px] font-medium transition-colors cursor-pointer"
                >
                  Abrir lista de serviços ({filteredServices.length})
                </button>
              )}
              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => onSelectTab('dashboards')}
                  className="px-3 py-1.5 rounded-[10px] bg-[#F2FAF5]/15 hover:bg-[#F2FAF5]/25 border border-[#F2FAF5]/30 text-[#F2FAF5] text-[12px] font-medium transition-colors cursor-pointer"
                >
                  Ir para Dashboards
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          MODAL DE DETALHES PARA SERVIÇOS SELECIONADOS PELA LISTA
          ========================================================= */}
      {selectedListService && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes de ${selectedListService.nome}`}
          onClick={() => setSelectedListService(null)}
          className="fixed inset-0 z-[1050] bg-black/20 flex items-center justify-center p-3 sm:p-4"
        >
          <div onClick={e => e.stopPropagation()} className="relative max-w-full">
            <ServiceModal
              service={toModalServiceData(selectedListService)}
              onClose={() => setSelectedListService(null)}
              onOpenDashboard={() => {
                setSelectedListService(null);
                onSelectTab?.('dashboards');
              }}
            />
          </div>
        </div>
      )}

      {/* =========================================================
          BOTÃO VOLTAR CIRCULAR MOBILE - Canto Superior Esquerdo
          ========================================================= */}
      <button
        type="button"
        onClick={handleMobileBackClick}
        title={mobileSheetView === 'list' ? 'Voltar aos filtros' : 'Alternar painel'}
        className="flex sm:hidden absolute top-4 left-4 z-[1001] w-[52px] h-[52px] rounded-full bg-[#0E3B25]/25 hover:bg-[#0E3B25]/45 backdrop-blur-xl border-l border-t border-[#F2FAF5] items-center justify-center text-[#F2FAF5] transition-all shadow-[inset_-4px_-4px_10px_rgba(14,59,37,0.35),0_8px_20px_rgba(0,0,0,0.25)] cursor-pointer"
      >
        <svg className="w-[24px] h-[24px]" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 6L9 12L15 18"
            stroke="#F2FAF5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* =========================================================
          COMPONENTE 3: BOTÃO MENU HAMBÚRGUER + DROPDOWN (Glassmorphism)
          ========================================================= */}
      <div
        ref={menuContainerRef}
        translate="no"
        className="notranslate absolute top-4 right-4 z-[1001] flex flex-col items-end"
      >
        <button
          type="button"
          onClick={() => setIsMenuOpen(prev => !prev)}
          aria-expanded={isMenuOpen}
          title="Menu"
          className="w-[52px] h-[52px] rounded-full bg-[#0E3B25]/25 hover:bg-[#0E3B25]/45 backdrop-blur-xl border-l border-t border-[#F2FAF5] flex items-center justify-center text-[#F2FAF5] transition-all shadow-[inset_-4px_-4px_10px_rgba(14,59,37,0.35),0_8px_20px_rgba(0,0,0,0.25)] cursor-pointer"
        >
          {isMenuOpen ? (
            <svg className="w-[24px] h-[24px]" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M18 6L6 18" stroke="#F2FAF5" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="w-[26px] h-[26px]" viewBox="0 0 40 40" fill="none">
              <path d="M7 10H33M7 20H33M7 30H33" stroke="#F2FAF5" strokeWidth="6.5" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {isMenuOpen && (
          <nav
            aria-label="Menu de navegação"
            className="mt-2.5 w-[210px] p-[14px] bg-[#0E3B25]/25 backdrop-blur-xl overflow-hidden rounded-tl-[20px] rounded-tr-none rounded-br-[20px] rounded-bl-[20px] border-l border-b border-[#F2FAF5] shadow-[inset_-4px_-4px_12px_rgba(14,59,37,0.35),0_12px_28px_rgba(0,0,0,0.35)] inline-flex flex-col justify-start items-start gap-[9px]"
          >
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onSelectTab?.('historico');
              }}
              className="self-stretch p-[10px] overflow-hidden rounded-[50px] border border-transparent border-b-[#F2FAF5] hover:border-[#F2FAF5] hover:bg-[#F2FAF5]/10 flex justify-start items-center gap-[10px] text-[#F2FAF5] text-[16px] font-normal leading-[24px] transition-all cursor-pointer"
            >
              <svg className="w-[25px] h-[25px] text-[#F2FAF5] shrink-0" viewBox="0 0 25 25" fill="none">
                <path
                  d="M3.125 12.5C3.125 17.6777 7.32233 21.875 12.5 21.875C17.6777 21.875 21.875 17.6777 21.875 12.5C21.875 7.32233 17.6777 3.125 12.5 3.125C9.04822 3.125 6.03326 4.99124 4.4126 7.77083M3.125 4.16667V8.33333H7.29167M12.5 7.8125V12.5L15.625 14.5833"
                  stroke="currentColor"
                  strokeWidth="2.08"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Histórico</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onSelectTab?.('dashboards');
              }}
              className="self-stretch p-[10px] overflow-hidden rounded-[50px] border border-transparent border-b-[#F2FAF5] hover:border-[#F2FAF5] hover:bg-[#F2FAF5]/10 flex justify-start items-center gap-[6px] text-white text-[16px] font-normal leading-[24px] transition-all cursor-pointer"
            >
              <svg className="w-[25px] h-[25px] text-[#F2FAF5] shrink-0" viewBox="0 0 25 25" fill="currentColor">
                <rect x="3.13" y="16.67" width="5.21" height="5.21" rx="1.5" />
                <rect x="9.90" y="9.38" width="5.21" height="12.50" rx="1.5" />
                <rect x="16.67" y="3.13" width="5.21" height="18.75" rx="1.5" />
              </svg>
              <span>Dashboards</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onSelectTab?.('config');
              }}
              className="self-stretch p-[10px] overflow-hidden rounded-[50px] border border-transparent border-b-[#F2FAF5] hover:border-[#F2FAF5] hover:bg-[#F2FAF5]/10 flex justify-start items-center gap-[6px] text-[#F2FAF5] text-[16px] font-normal leading-[24px] text-left transition-all cursor-pointer"
            >
              <svg className="w-[25px] h-[25px] text-[#F2FAF5] shrink-0" viewBox="0 0 25 25" fill="none">
                <path
                  d="M12.5 2.6L20.8 7.4V17.6L12.5 22.4L4.2 17.6V7.4L12.5 2.6Z"
                  stroke="currentColor"
                  strokeWidth="2.08"
                  strokeLinejoin="round"
                />
                <circle cx="12.5" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="2.08" />
              </svg>
              <span className="flex-1">Configurações</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onLogout?.();
              }}
              className="group self-stretch px-[10px] py-[6px] bg-[#FB0B0B]/20 hover:bg-[#FB0B0B] overflow-hidden rounded-[50px] border border-[#FB0B0B] flex justify-start items-center gap-[10px] text-[#F2FAF5] hover:text-black text-[16px] font-normal leading-[24px] text-left transition-all cursor-pointer"
            >
              <svg
                className="w-[25px] h-[25px] text-[#FC8080] group-hover:text-black shrink-0 transition-colors"
                viewBox="0 0 25 25"
                fill="none"
              >
                <path
                  d="M12.5 3.125H18.75C19.3025 3.125 19.8324 3.34449 20.2231 3.73519C20.6138 4.12589 20.8333 4.6558 20.8333 5.20833V19.7917C20.8333 20.3442 20.6138 20.8741 20.2231 21.2648C19.8324 21.6555 19.3025 21.875 18.75 21.875H12.5M8.33333 17.7083L3.125 12.5M3.125 12.5L8.33333 7.29167M3.125 12.5H15.625"
                  stroke="currentColor"
                  strokeWidth="2.08"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="flex-1">Sair</span>
            </button>
          </nav>
        )}
      </div>

      {/* =========================================================
          COMPONENTE 4: MINIATURA ALTERNADORA ESCURO / SATÉLITE
          ========================================================= */}
      <button
        type="button"
        onClick={toggleTheme}
        title={currentTheme === 'dark' ? 'Mudar para Satélite' : 'Mudar para Escuro'}
        className={`group absolute ${mobileFloatingBottomClass} sm:bottom-4 left-4 z-[1000] w-[72px] h-[72px] sm:w-[100px] sm:h-[100px] rounded-[6px] overflow-hidden border border-neutro-50 bg-[#0b1116] shadow-2xl transition-all duration-300 cursor-pointer ${
          isSidebarMinimized ? 'sm:left-4' : 'sm:left-[452px]'
        }`}
      >
        <img
          src={currentTheme === 'dark' ? previewTiles.satellite : previewTiles.dark}
          alt={currentTheme === 'dark' ? 'Prévia Satélite' : 'Prévia Escuro'}
          style={
            currentTheme === 'satellite'
              ? { filter: 'invert(100%) hue-rotate(180deg) brightness(90%) contrast(105%) saturate(85%)' }
              : undefined
          }
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] right-[4px] bottom-[4px] absolute bg-[#DDF1E5]/20 backdrop-blur-xs rounded-[22px] border border-verde-50 flex items-center justify-center overflow-hidden">
          <svg
            className="w-[13px] h-[13px] sm:w-[15px] sm:h-[15px] text-neutro-50 shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
          </svg>
        </div>
      </button>

      {/* =========================================================
          COMPONENTE 5: CONTROLE DE ZOOM CUSTOMIZADO (- | +)
          ========================================================= */}
      <div
        className={`absolute ${mobileFloatingBottomClass} sm:bottom-4 right-4 z-[1000] px-[12px] py-[8px] sm:px-[15px] sm:py-[10px] bg-[#06401D]/25 backdrop-blur-xl overflow-hidden rounded-[35px] border-l border-t border-[#F2FAF5]/60 shadow-[inset_-4px_-4px_10px_rgba(6,64,29,0.35),0_8px_20px_rgba(0,0,0,0.25)] inline-flex justify-start items-center gap-[8px] sm:gap-[10px] transition-all duration-300`}
      >
        <button
          type="button"
          onClick={() => mapInstance?.zoomOut()}
          className="w-[26px] h-[26px] sm:w-[30px] sm:h-[30px] relative overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="Diminuir zoom"
        >
          <svg width="27" height="27" viewBox="0 0 27 27" fill="none" className="w-[22px] h-[22px] sm:w-[27px] sm:h-[27px]">
            <path
              d="M25 25L19.393 19.383M19.393 19.383L19.3925 19.3825M19.393 19.383C21.3825 17.3909 22.5 14.6906 22.5 11.875C22.5 9.05707 21.3806 6.35456 19.388 4.36199C17.3954 2.36942 14.6929 1.25 11.875 1.25C9.05707 1.25 6.35456 2.36942 4.36199 4.36199C2.36942 6.35456 1.25 9.05707 1.25 11.875C1.25 14.6929 2.36942 17.3954 4.36199 19.388C6.35456 21.3806 9.05707 22.5 11.875 22.5C14.6929 22.5 17.3954 21.3806 19.388 19.388C19.3897 19.3863 19.3913 19.3847 19.393 19.383ZM15 11.875H8.75"
              stroke="#F2FAF5"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="w-[2px] self-stretch bg-[#F2FAF5] rounded-[10px]" />

        <button
          type="button"
          onClick={() => mapInstance?.zoomIn()}
          className="w-[26px] h-[26px] sm:w-[30px] sm:h-[30px] relative overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="Aumentar zoom"
        >
          <svg width="27" height="27" viewBox="0 0 27 27" fill="none" className="w-[22px] h-[22px] sm:w-[27px] sm:h-[27px]">
            <path
              d="M25 25L19.393 19.383M19.393 19.383L19.3925 19.3825M19.393 19.383C21.3825 17.3909 22.5 14.6906 22.5 11.875C22.5 9.05707 21.3806 6.35456 19.388 4.36199C17.3954 2.36942 14.6929 1.25 11.875 1.25C9.05707 1.25 6.35456 2.36942 4.36199 4.36199C2.36942 6.35456 1.25 9.05707 1.25 11.875C1.25 14.6929 2.36942 17.3954 4.36199 19.388C6.35456 21.3806 9.05707 22.5 11.875 22.5C14.6929 22.5 17.3954 21.3806 19.388 19.388C19.3897 19.3863 19.3913 19.3847 19.393 19.383ZM11.875 7.5V11.875M11.875 11.875V16.25M11.875 11.875H16.25M11.875 11.875H7.5"
              stroke="#F2FAF5"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
