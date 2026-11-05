import React from 'react';
import { useMap } from 'react-leaflet'; 

export type ServiceStatus = 'ativo' | 'indisponível' | 'sem_metricas';

export interface ModalServiceData {
  id: number;
  name: string;
  status: ServiceStatus;
  location: string;
}


interface ServiceModalProps {
  service: ModalServiceData;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({ service }) => {
  const map = useMap(); 

  const isAtivo = service.status === 'ativo';
  const isIndisponivel = service.status === 'indisponível';
  const isSemMetricas = service.status === 'sem_metricas';

  return (
   
    <div className="w-72 bg-[#121A16]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white shadow-2xl flex flex-col gap-2.5 max-h-[85vh] overflow-y-auto custom-scrollbar cursor-default">
      
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight">{service.name}</h2>
        <button 
          onClick={() => map.closePopup()} 
          className="w-6 h-6 rounded-full bg-[#166A3E]/20 text-[#2FA862] border border-[#2FA862]/40 flex items-center justify-center hover:bg-[#2FA862]/30 transition shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {isAtivo && (
          <span className="px-2 py-0.5 rounded bg-transparent border border-[#2FA862] text-white flex items-center gap-1">
            <span className="text-[#2FA862]">✓</span> Ativo
          </span>
        )}
        {isIndisponivel && (
          <span className="px-2 py-0.5 rounded bg-transparent border border-[#9C2A2A] text-white flex items-center gap-1">
            <span className="text-[#9C2A2A]">✕</span> Indisponível
          </span>
        )}
        {isSemMetricas && (
          <span className="px-2 py-0.5 rounded bg-transparent border border-gray-400 text-white flex items-center gap-1">
            <span className="text-gray-400">─</span> Sem métricas
          </span>
        )}
        <span className="px-2 py-0.5 rounded bg-transparent border border-[#166A3E] text-white">
          Cidade: {service.location}
        </span>
      </div>

      {!isSemMetricas && (
        <div className="flex flex-wrap gap-1">
          <button className="px-1.5 py-0.5 rounded text-[10px] bg-transparent border border-[#2FA862] text-white">CO2</button>
          <button className="px-1.5 py-0.5 rounded text-[10px] bg-[#1875DE]/20 border border-[#1875DE] text-white">gasto de água</button>
          <button className="px-1.5 py-0.5 rounded text-[10px] bg-[#FFD32C] border border-[#FFD32C] text-black font-semibold">gasto de kWh</button>
        </div>
      )}

      {isIndisponivel && (
        <div className="w-full bg-[#9C2A2A]/90 text-white text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
          <span>!</span> Sem conexão desde 10/10, 14h32
        </div>
      )}

      {!isSemMetricas ? (
        <div className="flex flex-col gap-2">
          <div className="leading-tight">
            <h1 className="text-3xl font-extrabold tracking-tighter">100 <span className="text-lg font-medium text-gray-300">kWh</span></h1>
            {isAtivo && <p className="text-[#2FA862] text-[10px] font-medium">▲ 8% em relação à semana anterior</p>}
            {isIndisponivel && <p className="text-[#2FA862] text-[10px] font-medium">Último valor conhecido</p>}
          </div>

          <span className="text-[9px] text-gray-400 uppercase tracking-wider">{isAtivo ? 'Métricas disponíveis' : 'Métricas do último registro'}</span>
          <div className="flex flex-wrap gap-1">
            {['CPU', 'Memória', 'Armação', 'Rede'].map(metric => (
              <span key={metric} className="px-1.5 py-0.5 text-[9px] border border-[#166A3E] rounded text-gray-200">
                ✓ {metric}
              </span>
            ))}
          </div>

          <div className="w-full h-20 border border-[#166A3E]/70 rounded-lg relative p-2 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-[40%] left-0 w-full border-t border-white/5"></div>
            <div className="absolute top-[70%] left-0 w-full border-t border-white/5"></div>
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path d="M10,70 C40,65 60,75 100,55 C140,40 160,20 200,30 C240,40 260,60 280,35" fill="none" stroke={isAtivo ? "#2FA862" : "#B8B7B8"} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="w-full h-full flex items-end justify-between text-[8px] text-gray-400 z-10 relative">
              <span>7 dias atrás</span>
              <span>hoje</span>
            </div>
          </div>
          
          <button className="w-full bg-[#1A8048] hover:bg-[#2FA862] text-white text-xs font-semibold py-2 rounded-lg transition mt-1">
            Ver dashboard completo
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider">Métricas disponíveis</span>
          <span className="px-2 py-1 text-[10px] border border-[#166A3E] rounded text-white w-fit">
            — Nenhuma métrica recebida
          </span>

          <div className="w-full bg-white rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-[#CFD8D3]/80"></div>
            <p className="text-gray-200 text-xs font-medium opacity-20">Este serviço ainda não envia dados</p>
            <p className="text-[#2FA862]/60 text-[9px]">Verifique o sensor ou veja o dashboard.</p>
          </div>

          <button className="w-full bg-transparent border border-[#166A3E] hover:bg-[#166A3E]/20 text-white text-xs font-semibold py-2 rounded-lg transition mt-1">
            Ver dashboard completo
          </button>
        </div>
      )}
      
    </div>
  );
};