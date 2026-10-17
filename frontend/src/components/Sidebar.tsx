import React, { useState } from 'react';
import { ServiceCard } from './ServiceCard';

const servicesData = [
  {
    id: 1,
    name: 'Serviço 1',
    isActive: true,
    location: { country: 'Brasil', region: 'Sudeste', city: 'Caçapava' },
    metrics: { kwh: 100, co2: 'gCO₂e' }
  },
  {
    id: 2,
    name: 'Serviço 2',
    isActive: false,
    location: { country: 'Brasil', region: 'Sudeste', city: 'Caçapava' },
    metrics: { kwh: 100, co2: 'gCO₂e' }
  }
];

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="absolute top-6 left-6 z-[1000] w-12 h-12 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-white/10 transition"
        >
          <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      )}

      <div className={`absolute top-4 left-4 bottom-4 w-96 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col text-white z-[1000] shadow-2xl transition-all duration-300 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-[110%] opacity-0 pointer-events-none'}`}>
        
        
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 bg-black/40 rounded-full px-4 py-2.5 border border-white/10 flex items-center shadow-inner">
            <span className="text-gray-400 mr-2 text-sm">🔍</span>
            <input type="text" placeholder="Busque o serviço" className="bg-transparent border-none outline-none w-full text-sm text-gray-200 placeholder-gray-500" />
          </div>
          
          <button className="w-10 h-10 rounded-full bg-[#2FA862]/20 border border-[#2FA862] text-[#2FA862] flex items-center justify-center shrink-0 hover:bg-[#2FA862]/30 transition shadow-sm">☁️</button>
          <button className="w-10 h-10 rounded-full bg-[#2FA862]/20 border border-[#2FA862] text-[#2FA862] flex items-center justify-center shrink-0 hover:bg-[#2FA862]/30 transition shadow-sm">📂</button>
          <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full border border-white/20 bg-transparent flex items-center justify-center shrink-0 hover:bg-white/10 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        </div>

        
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Mostrar no mapa</h2>
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#2FA862]/20 text-[#2FA862] border border-[#2FA862] hover:bg-[#2FA862]/30 transition">CO2</button>
            <button className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#1875DE]/20 text-[#1875DE] border border-[#1875DE] hover:bg-[#1875DE]/30 transition">gasto de água</button>
            <button className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#FFD32C]/20 text-[#FFD32C] border border-[#FFD32C] hover:bg-[#FFD32C]/30 transition">gasto de kWh</button>
          </div>
        </div>

        
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Estado do serviço</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <label className="flex items-center gap-2 cursor-pointer bg-[#2FA862]/20 px-3 py-1.5 rounded-full border border-[#2FA862] text-xs hover:bg-[#2FA862]/30 transition">
              <input type="checkbox" defaultChecked className="accent-[#2FA862] w-3.5 h-3.5" />
              <span className="text-white">Ativo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-[#9C2A2A]/20 px-3 py-1.5 rounded-full border border-[#9C2A2A] text-xs hover:bg-[#9C2A2A]/30 transition">
              <input type="checkbox" defaultChecked className="accent-[#9C2A2A] w-3.5 h-3.5" />
              <span className="text-white">Indisponível</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-[#B8B7B8]/20 px-3 py-1.5 rounded-full border border-[#B8B7B8] text-xs hover:bg-[#B8B7B8]/30 transition">
              <input type="checkbox" className="accent-[#B8B7B8] w-3.5 h-3.5" />
              <span className="text-white">Sem Métricas</span>
            </label>
          </div>
        </div>

        <div className="mb-4">
          <h1 className="text-lg font-semibold tracking-tight text-white">Serviços</h1>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
          {servicesData.map(service => (
            <ServiceCard key={service.id} data={service} />
          ))}
        </div>

        {/* Rodapé */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <span>Última atualização: 12:00</span>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white transition">⏸</button>
            <button className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white transition">🔄</button>
          </div>
        </div>

      </div>
    </>
  );
};