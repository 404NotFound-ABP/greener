import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { MapBackground } from '../components/MapBackground';

export const DashboardPage: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <MapBackground />
      <Sidebar />
      
      {/* Botão Menu Superior Direito */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button className="w-12 h-12 bg-gray-900/80 backdrop-blur-md rounded-full border border-gray-700 flex items-center justify-center text-white hover:bg-gray-800 transition shadow-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};