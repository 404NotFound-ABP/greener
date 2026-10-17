import React, { useState } from 'react';
// IMPORTAÇÃO NOVA: Adicionado o "Popup" do react-leaflet
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { ServiceModal } from './ServiceModal';
import type { ModalServiceData } from './ServiceModal';

const themes = {
  dark: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; OpenStreetMap', cssClass: "theme-dark" },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: '&copy; Esri', cssClass: "" },
  light: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; OpenStreetMap', cssClass: "" }
};

const mapMarkersData: (ModalServiceData & { coords: [number, number] })[] = [
  { id: 1, name: 'Serviço Jacareí', status: 'ativo', location: 'Jacareí', coords: [-23.3053, -45.9658] },
  { id: 2, name: 'Serviço Caçapava', status: 'indisponível', location: 'Caçapava', coords: [-23.1000, -45.7000] },
  { id: 3, name: 'Serviço Taubaté', status: 'sem_metricas', location: 'Taubaté', coords: [-23.0333, -45.5500] }
];

export const MapBackground: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'satellite' | 'light'>('dark');
  
  const getMarkerColor = (status: string) => {
    if (status === 'ativo') return '#2FA862';
    if (status === 'indisponível') return '#9C2A2A';
    return '#B8B7B8';
  };

  return (
    <div className={`relative w-full h-full ${themes[currentTheme].cssClass}`}>
      
      
      <style>{`
        .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; }
        .leaflet-popup-tip-container { display: none !important; }
      `}</style>

      <MapContainer center={[-23.2000, -45.8000]} zoom={11} className="w-full h-full z-0" zoomControl={false}>
        <TileLayer key={currentTheme} attribution={themes[currentTheme].attribution} url={themes[currentTheme].url} />
        
        {mapMarkersData.map((marker) => (
          <CircleMarker 
            key={marker.id}
            center={marker.coords} 
            pathOptions={{ color: getMarkerColor(marker.status), fillColor: getMarkerColor(marker.status), fillOpacity: 0.8 }} 
            radius={14}
          >
            <Tooltip>{marker.name} (Clique para abrir)</Tooltip>
            
            
            <Popup closeButton={false} offset={[0, -10]}>
              <ServiceModal service={marker} />
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="absolute bottom-6 right-6 z-[1000] flex gap-2 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg">
        <button onClick={() => setCurrentTheme('dark')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentTheme === 'dark' ? 'bg-[#2FA862]/20 text-[#2FA862] border border-[#2FA862]' : 'text-gray-400 hover:text-white'}`}>Escuro</button>
        <button onClick={() => setCurrentTheme('satellite')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentTheme === 'satellite' ? 'bg-[#2FA862]/20 text-[#2FA862] border border-[#2FA862]' : 'text-gray-400 hover:text-white'}`}>Satélite</button>
        <button onClick={() => setCurrentTheme('light')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentTheme === 'light' ? 'bg-[#2FA862]/20 text-[#2FA862] border border-[#2FA862]' : 'text-gray-400 hover:text-white'}`}>Claro</button>
      </div>

    </div>
  );
};