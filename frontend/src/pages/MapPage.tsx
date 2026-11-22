import React from 'react';
import { MapBackground } from '../components/MapBackground';
import type { MainTab } from '../components/MainLayout';

export interface MapPageProps {
  onSelectTab?: (tab: MainTab) => void;
  onLogout?: () => void;
}

export const MapPage: React.FC<MapPageProps> = ({ onSelectTab, onLogout }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <MapBackground onSelectTab={onSelectTab} onLogout={onLogout} />
    </div>
  );
};