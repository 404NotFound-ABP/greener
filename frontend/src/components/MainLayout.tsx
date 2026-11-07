import React, { useState } from 'react';
import { MapPage } from '../pages/MapPage';
import { DashboardPage } from '../pages/DashboardPage';
import { HistoricoPage } from '../pages/HistoricoPage';

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mapa' | 'dashboards' | 'historico' | 'config'>('mapa');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

 
  if (activeTab === 'mapa') {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <MapPage />
        
        
        <div className="absolute top-4 right-4 z-[2000]">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-12 h-12 bg-gray-900/80 backdrop-blur-md rounded-full border border-gray-700 flex items-center justify-center text-white hover:bg-gray-800 transition shadow-lg"
          >
            
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>

          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#0C1711] border border-[#1A2E20] rounded-xl shadow-xl overflow-hidden backdrop-blur-md">
              <button 
                onClick={() => { setActiveTab('dashboards'); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-white hover:bg-[#15241A] transition flex items-center gap-3 border-b border-[#1A2E20]"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Dashboards
              </button>
              <button 
                onClick={() => { setActiveTab('historico'); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-white hover:bg-[#15241A] transition flex items-center gap-3 border-b border-[#1A2E20]"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Histórico
              </button>
              <button 
                onClick={() => { setActiveTab('config'); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-white hover:bg-[#15241A] transition flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                Configuração
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

 
  return (
    <div className="flex h-screen w-full bg-[#060D09] overflow-hidden font-sans">
     
      <nav className="w-[80px] bg-[#060D09] flex flex-col items-center py-6 z-50 shrink-0 border-r border-[#1A2E20]">
        
       
        <div className="bg-[#091A0F] p-1.5 rounded-[32px] flex flex-col gap-1 shadow-2xl border border-[#132B1A]">
          
          <button 
            onClick={() => setActiveTab('mapa')} 
            className={`flex flex-col items-center justify-center w-[52px] h-[60px] rounded-t-[26px] rounded-b-[8px] transition-colors ${activeTab === 'mapa' ? 'bg-[#22D55B]' : 'bg-[#1D6B3A] hover:bg-[#258248]'}`}
          >
            <div className="w-[28px] h-[28px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
              <svg className="w-4 h-4 text-[#0C2214]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            </div>
            <span className="text-[8px] font-medium text-white tracking-tight">Mapa</span>
          </button>

          
          <button 
            onClick={() => setActiveTab('dashboards')} 
            className={`flex flex-col items-center justify-center w-[52px] h-[60px] rounded-[8px] transition-colors ${activeTab === 'dashboards' ? 'bg-[#22D55B]' : 'bg-[#1D6B3A] hover:bg-[#258248]'}`}
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
            className={`flex flex-col items-center justify-center w-[52px] h-[60px] rounded-[8px] transition-colors ${activeTab === 'historico' ? 'bg-[#22D55B]' : 'bg-[#1D6B3A] hover:bg-[#258248]'}`}
          >
            <div className="w-[28px] h-[28px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
              <svg className="w-[16px] h-[16px] text-[#0C2214]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-[8px] font-medium text-white tracking-tight">Histórico</span>
          </button>

          
          <button 
            onClick={() => setActiveTab('config')} 
            className={`flex flex-col items-center justify-center w-[52px] h-[60px] rounded-t-[8px] rounded-b-[26px] transition-colors ${activeTab === 'config' ? 'bg-[#22D55B]' : 'bg-[#1D6B3A] hover:bg-[#258248]'}`}
          >
            <div className="w-[28px] h-[28px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
              <svg className="w-[16px] h-[16px] text-[#0C2214]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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