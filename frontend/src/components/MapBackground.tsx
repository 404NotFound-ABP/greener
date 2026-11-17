import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

import { ServiceModal } from './ServiceModal';
import type { ModalServiceData } from './ServiceModal';
import { Sidebar } from './Sidebar';
import type { MobileSheetView } from './Sidebar';
import type { MainTab } from './MainLayout';

export interface MapBackgroundProps {
  onLogout?: () => void;
  onSelectTab?: (tab: MainTab) => void;
}

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

const previewTiles = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/4655/3050',
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/13/4655/3050'
};

const mapMarkersData: (ModalServiceData & { coords: [number, number] })[] = [
  { id: 1, name: 'ASTAH-XYZ', status: 'ativo', location: 'Jacareí', coords: [-23.3053, -45.9658] },
  { id: 2, name: 'ASTAH-PQR', status: 'indisponível', location: 'Caçapava', coords: [-23.1000, -45.7000] },
  { id: 3, name: 'ASTAH-STU', status: 'sem_metricas', location: 'Taubaté', coords: [-23.0333, -45.5500] }
];

export const MapBackground: React.FC<MapBackgroundProps> = ({ onLogout, onSelectTab }) => {
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'satellite'>('dark');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [mobileSheetView, setMobileSheetView] = useState<MobileSheetView>('filters');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const [activeFilters, setActiveFilters] = useState({
    ativo: true,
    indisponível: true,
    sem_metricas: true
  });

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
    setTimeout(() => {
      setActiveFilters(prev => ({ ...prev, [status]: !prev[status] }));
    }, 50);
  };

  const resetFilters = () => {
    if (mapInstance) {
      mapInstance.closePopup();
    }
    setActiveFilters({
      ativo: true,
      indisponível: true,
      sem_metricas: true
    });
  };

  const toggleTheme = () => {
    setCurrentTheme(prev => (prev === 'dark' ? 'satellite' : 'dark'));
  };

  const getMarkerColor = (status: string) => {
    if (status === 'ativo') return '#2FA862';
    if (status === 'indisponível') return '#9C2A2A';
    return '#B8B7B8';
  };

  const filteredMarkers = mapMarkersData.filter(
    marker => activeFilters[marker.status as keyof typeof activeFilters]
  );

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
      />

      <style>{`
        .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; }
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
        center={[-23.3053, -45.9658]}
        zoom={13}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          key={currentTheme}
          attribution={themes[currentTheme].attribution}
          url={themes[currentTheme].url}
        />

        {filteredMarkers.map(marker => (
          <CircleMarker
            key={marker.id}
            center={marker.coords}
            pathOptions={{
              color: getMarkerColor(marker.status),
              fillColor: getMarkerColor(marker.status),
              fillOpacity: 0.8
            }}
            radius={14}
          >
            <Tooltip>{marker.name} (Clique para abrir)</Tooltip>
            <Popup closeButton={false} offset={[0, -10]}>
              <ServiceModal service={marker} />
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

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
        className={`group absolute ${mobileFloatingBottomClass} sm:bottom-4 left-4 z-[1000] w-[72px] h-[72px] sm:w-[100px] sm:h-[100px] rounded-[6px] overflow-hidden border border-neutro-50 shadow-2xl transition-all duration-300 cursor-pointer ${
          isSidebarMinimized ? 'sm:left-4' : 'sm:left-[452px]'
        }`}
      >
        <img
          src={currentTheme === 'dark' ? previewTiles.satellite : previewTiles.dark}
          alt={currentTheme === 'dark' ? 'Prévia Satélite' : 'Prévia Escuro'}
          style={
            currentTheme === 'satellite'
              ? { filter: 'invert(100%) hue-rotate(180deg) brightness(90%) contrast(105%)' }
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