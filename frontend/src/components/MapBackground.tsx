import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// opções de mapas
const themes = {
  dark: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap',
    cssClass: "theme-dark" 
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; Esri',
    cssClass: ""
  },
  light: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap',
    cssClass: ""
  }
};

export const MapBackground: React.FC = () => {
  
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'satellite' | 'light'>('dark');

  return (
    
    <div className={`relative w-full h-full ${themes[currentTheme].cssClass}`}>
      
      <MapContainer 
        center={[-23.3053, -45.9658]} 
        zoom={12} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          key={currentTheme} 
          attribution={themes[currentTheme].attribution}
          url={themes[currentTheme].url}
        />
        
        {/* Exemplo de Marcador Ativo */}
        <CircleMarker 
          center={[-23.3053, -45.9658]} 
          pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.6 }} 
          radius={12}
        >
          <Popup>Serviço 1: Ativo (Jacareí)</Popup>
        </CircleMarker>

        {/* Exemplo de Marcador Indisponível */}
        <CircleMarker 
          center={[-23.1000, -45.7000]} 
          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.6 }} 
          radius={12}
        >
          <Popup>Serviço 2: Indisponível (Caçapava)</Popup>
        </CircleMarker>
      </MapContainer>

      {/* Botões de Tema */}
      <div className="absolute bottom-6 right-6 z-[1000] flex gap-2 bg-gray-900/80 backdrop-blur-md p-2 rounded-xl border border-gray-700 shadow-lg">
        <button 
          onClick={() => setCurrentTheme('dark')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentTheme === 'dark' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
        >
          Escuro
        </button>
        <button 
          onClick={() => setCurrentTheme('satellite')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentTheme === 'satellite' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
        >
          Satélite
        </button>
        <button 
          onClick={() => setCurrentTheme('light')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentTheme === 'light' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
        >
          Claro
        </button>
      </div>

    </div>
  );
};