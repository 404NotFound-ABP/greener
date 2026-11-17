import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

import { ServiceModal } from './ServiceModal';
import type { ModalServiceData } from './ServiceModal';
import { Sidebar } from './Sidebar';


export interface MapBackgroundProps {
  onLogout?: () => void;
}

// 1. CONFIGURAÇÃO DOS TEMAS DO MAPA (Escuro vs Satélite)
// O modo escuro utiliza o OpenStreetMap padrão invertido via filtro CSS (sem necessidade de API Key)
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

// 2. IMAGENS DE PRÉ-VISUALIZAÇÃO DO BOTÃO DE CAMADAS (Miniatura 100x100px)
// Usa os servidores da Esri para evitar erros 403 de bloqueio em localhost
const previewTiles = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/4655/3050',
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/13/4655/3050'
};

// 3. DADOS MOCKADOS DOS MARCADORES NO MAPA (Bolinhas dos Serviços)
const mapMarkersData: (ModalServiceData & { coords: [number, number] })[] = [
  { id: 1, name: 'ASTAH-XYZ', status: 'ativo', location: 'Jacareí', coords: [-23.3053, -45.9658] },
  { id: 2, name: 'ASTAH-PQR', status: 'indisponível', location: 'Caçapava', coords: [-23.1000, -45.7000] },
  { id: 3, name: 'ASTAH-STU', status: 'sem_metricas', location: 'Taubaté', coords: [-23.0333, -45.5500] }
];

export const MapBackground: React.FC = () => {
  // Estado que controla o tema atual do mapa ('dark' ou 'satellite')
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'satellite'>('dark');

  // Estado compartilhado que controla se a Sidebar está minimizada ou expandida
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  // Estado dos filtros de status dos serviços (Ativo, Indisponível, Sem métricas)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null); 
  
  const [activeFilters, setActiveFilters] = useState({
    ativo: true,
    indisponível: true,
    sem_metricas: true
  });

  // Função para ativar/desativar filtros clicando nos botões da Sidebar
  const toggleFilter = (status: 'ativo' | 'indisponível' | 'sem_metricas') => {
    if (mapInstance) {
      mapInstance.closePopup();
    }
    setTimeout(() => {
      setActiveFilters(prev => ({ ...prev, [status]: !prev[status] }));
    }, 50);
  };

  // Função para alternar entre o tema Escuro e o tema Satélite
  const toggleTheme = () => {
    setCurrentTheme(prev => (prev === 'dark' ? 'satellite' : 'dark'));
  };

  // Define a cor da bolinha no mapa de acordo com o status do serviço
  const getMarkerColor = (status: string) => {
    if (status === 'ativo') return '#2FA862'; // Verde
    if (status === 'indisponível') return '#9C2A2A'; // Vermelho
    return '#B8B7B8'; // Cinza (Sem métricas)
  };

  // Filtra os marcadores que devem aparecer no mapa com base nos filtros ativos
  const filteredMarkers = mapMarkersData.filter(
    marker => activeFilters[marker.status as keyof typeof activeFilters]
  );

  return (
    <div className={`relative w-full h-full bg-neutro-900 ${themes[currentTheme].cssClass}`}>
      
      {/* =========================================================
          COMPONENTE 1: BARRA LATERAL (SIDEBAR)
          Recebe os filtros e o controle de minimizar/expandir
         ========================================================= */}
      <Sidebar
        currentTheme={currentTheme}
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
        isMinimized={isSidebarMinimized}
        setIsMinimized={setIsSidebarMinimized}
      />

      {/* =========================================================
          ESTILOS GLOBAIS DO LEAFLET E FILTRO DO MODO ESCURO
          Remove o fundo branco padrão dos popups e aplica o tema escuro nos tiles
         ========================================================= */}
      <style>{`
        .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; }
        .leaflet-popup-tip-container { display: none !important; }
        .leaflet-container { background: #0b1116 !important; }
        
        /* Aplica a inversão de cores apenas nas imagens do mapa quando em modo escuro */
        .theme-dark .leaflet-tile {
          filter: invert(100%) hue-rotate(180deg) brightness(90%) contrast(105%) saturate(85%) !important;
        }
      `}</style>

      {/* =========================================================
          COMPONENTE 2: CONTAINER PRINCIPAL DO MAPA (LEAFLET)
          Renderiza os tiles geográficos e as bolinhas de cada serviço
         ========================================================= */}
      <MapContainer
        ref={setMapInstance}
        center={[-23.3053, -45.9658]}
        zoom={13}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        {/* Camada de imagens do mapa (muda conforme o tema atual) */}
        <TileLayer
          key={currentTheme}
          attribution={themes[currentTheme].attribution}
          url={themes[currentTheme].url}
        />

        {/* Renderização dos marcadores circulares (bolinhas) filtrados */}
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
            {/* Modal Glassmorphism que abre ao clicar na bolinha */}
            <Popup closeButton={false} offset={[0, -10]}>
              <ServiceModal service={marker} />
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* =========================================================
          COMPONENTE 3: BOTÃO MENU HAMBÚRGUER (Canto Superior Direito)
         ========================================================= */}
     {/* =========================================================
          COMPONENTE 3: BOTÃO MENU HAMBÚRGUER (Canto Superior Direito)
          ========================================================= */}
      <button
        type="button"
        title="Menu"
        className="absolute top-4 right-4 z-[1000] w-[52px] h-[52px] rounded-full bg-[#0E3B25]/25 hover:bg-[#0E3B25]/45 backdrop-blur-xl border-l border-t border-[#F2FAF5] flex items-center justify-center text-[#F2FAF5] transition-all shadow-[inset_-4px_-4px_10px_rgba(14,59,37,0.35),0_8px_20px_rgba(0,0,0,0.25)] cursor-pointer"
      >
        <svg
          className="w-[26px] h-[26px]"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 10H33M7 20H33M7 30H33"
            stroke="#F2FAF5"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* =========================================================
          COMPONENTE 4: MINIATURA ALTERNADORA ESCURO / SATÉLITE
          Canto Inferior Esquerdo - 100x100px fiel ao código do Figma.
          Desliza automaticamente quando a Sidebar é minimizada ou expandida.
         ========================================================= */}
      <button
        type="button"
        onClick={toggleTheme}
        title={currentTheme === 'dark' ? 'Mudar para Satélite' : 'Mudar para Escuro'}
        className={`group absolute bottom-4 z-[1000] w-[100px] h-[100px] rounded-[6px] overflow-hidden border border-neutro-50 shadow-2xl transition-all duration-300 cursor-pointer ${
          isSidebarMinimized ? 'left-4' : 'left-[452px]'
        }`}
      >
        {/* Imagem de fundo mostrando a prévia do outro tema */}
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

        {/* Selo circular de 20x20px com ícone de camadas (left: 76px, top: 76px) */}
        <div className="w-[20px] h-[20px] left-[76px] top-[76px] absolute bg-[#DDF1E5]/20 backdrop-blur-xs rounded-[22px] border border-verde-50 flex items-center justify-center overflow-hidden">
          <svg
            className="w-[15px] h-[15px] text-neutro-50 shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
          </svg>
        </div>
      </button>

      {/* =========================================================
          COMPONENTE 5: CONTROLE DE ZOOM CUSTOMIZADO (- | +)
          Canto Inferior Direito com lupas de diminuir e aumentar zoom
          ========================================================= */}
      <div className="absolute bottom-4 right-4 z-[1000] px-[15px] py-[10px] bg-[#06401D]/25 backdrop-blur-xl overflow-hidden rounded-[35px] border-l border-t border-[#F2FAF5]/60 shadow-[inset_-4px_-4px_10px_rgba(6,64,29,0.35),0_8px_20px_rgba(0,0,0,0.25)] inline-flex justify-start items-center gap-[10px]">
        {/* Botão Zoom Out (-) */}
        <button
          type="button"
          onClick={() => mapInstance?.zoomOut()}
          className="w-[30px] h-[30px] relative overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="Diminuir zoom"
        >
          <svg
            width="27"
            height="27"
            viewBox="0 0 27 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M25 25L19.393 19.383M19.393 19.383L19.3925 19.3825M19.393 19.383C21.3825 17.3909 22.5 14.6906 22.5 11.875C22.5 9.05707 21.3806 6.35456 19.388 4.36199C17.3954 2.36942 14.6929 1.25 11.875 1.25C9.05707 1.25 6.35456 2.36942 4.36199 4.36199C2.36942 6.35456 1.25 9.05707 1.25 11.875C1.25 14.6929 2.36942 17.3954 4.36199 19.388C6.35456 21.3806 9.05707 22.5 11.875 22.5C14.6929 22.5 17.3954 21.3806 19.388 19.388C19.3897 19.3863 19.3913 19.3847 19.393 19.383ZM15 11.875H8.75"
              stroke="#F2FAF5"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Linha divisória vertical (2px de largura e pontas arredondadas) */}
        <div className="w-[2px] self-stretch bg-[#F2FAF5] rounded-[10px]" />

        {/* Botão Zoom In (+) */}
        <button
          type="button"
          onClick={() => mapInstance?.zoomIn()}
          className="w-[30px] h-[30px] relative overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="Aumentar zoom"
        >
          <svg
            width="27"
            height="27"
            viewBox="0 0 27 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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