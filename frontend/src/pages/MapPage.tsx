import React from 'react';
import { MapBackground } from '../components/MapBackground';
import type { MainTab } from '../components/MainLayout';

export interface MapPageProps {
  onSelectTab?: (tab: MainTab) => void;
}

export const MapPage: React.FC<MapPageProps> = ({ onSelectTab }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <MapBackground onSelectTab={onSelectTab} />
    </div>
  );
};