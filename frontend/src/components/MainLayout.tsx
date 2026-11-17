import React, { useState } from 'react';
import { MapPage } from '../pages/MapPage';
import { DashboardPage } from '../pages/DashboardPage';
import { HistoricoPage } from '../pages/HistoricoPage';

export type MainTab = 'mapa' | 'dashboards' | 'historico' | 'config';


export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('mapa');

  if (activeTab === 'mapa') {
    return <MapPage onSelectTab={setActiveTab} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#060D09] overflow-hidden font-sans">
      <nav className="w-[80px] bg-[#060D09] flex flex-col items-center py-6 z-50 shrink-0 border-r border-[#1A2E20]">
        <div className="bg-[#091A0F] p-1.5 rounded-[32px] flex flex-col gap-1 shadow-2xl border border-[#132B1A]">
          <button
            onClick={() => setActiveTab('mapa')}
            className="flex flex-col items-center justify-center w-[52px] h-[60px] rounded-t-[26px] rounded-b-[8px] transition-colors cursor-pointer bg-[#1D6B3A] hover:bg-[#258248]"
          >
            <div className="w-[28px] h-[28px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
              <svg className="w-4 h-4 text-[#0C2214]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <span className="text-[8px] font-medium text-white tracking-tight">Mapa</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboards')}
            className={`flex flex-col items-center justify-center w-[52px] h-[60px] rounded-[8px] transition-colors cursor-pointer ${
              activeTab === 'dashboards' ? 'bg-[#22D55B]' : 'bg-[#1D6B3A] hover:bg-[#258248]'
            }`}
          >
            <div className="w-[28px] h-[28px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
              <svg className="w-[14px] h-[14px] text-[#0C2214]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="7" cy="16" r="2.5" />
                <rect x="12.5" y="10" width="3" height="8.5" rx="1.5" />
                <rect x="17.5" y="5" width="3" height="13.5" rx="1.5" />
              </svg>
            </div>
            <span className="text-[8px] font-medium text-white tracking-tight">Dashboards</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex flex-col items-center justify-center w-[52px] h-[60px] rounded-[8px] transition-colors cursor-pointer ${
              activeTab === 'historico' ? 'bg-[#22D55B]' : 'bg-[#1D6B3A] hover:bg-[#258248]'
            }`}
          >
            <div className="w-[28px] h-[28px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
              <svg className="w-[16px] h-[16px] text-[#0C2214]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[8px] font-medium text-white tracking-tight">Histórico</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex flex-col items-center justify-center w-[52px] h-[60px] rounded-t-[8px] rounded-b-[26px] transition-colors cursor-pointer ${
              activeTab === 'config' ? 'bg-[#22D55B]' : 'bg-[#1D6B3A] hover:bg-[#258248]'
            }`}
          >
            <div className="w-[28px] h-[28px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
              <svg className="w-[16px] h-[16px] text-[#0C2214]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-[8px] font-medium text-white tracking-tight">Config.</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 relative overflow-y-auto">
        {activeTab === 'dashboards' && <DashboardPage />}
        {activeTab === 'historico' && <HistoricoPage />}
        {activeTab === 'config' && <div className="text-white p-8">Configurações...</div>}
      </main>
    </div>
  );
};