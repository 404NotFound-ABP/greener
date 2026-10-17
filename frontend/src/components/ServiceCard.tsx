import React from 'react';

interface ServiceCardProps {
  data: {
    id: number;
    name: string;
    isActive: boolean;
    location: { country: string; region: string; city: string; };
    metrics: { kwh: number; co2: string; };
  };
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ data }) => {
  return (
    <div className="bg-[#166A3E]/20 border border-[#166A3E] rounded-2xl p-4 shadow-lg transition flex flex-col gap-4">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" defaultChecked={data.isActive}
            className="w-4 h-4 rounded cursor-pointer accent-[#2FA862]"
          />
          <span className="font-semibold text-sm text-white">{data.name}</span>
        </div>
        
        <span className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 border ${
          data.isActive 
            ? 'bg-[#2FA862]/20 text-[#2FA862] border-[#2FA862]' 
            : 'bg-[#9C2A2A]/20 text-[#9C2A2A] border-[#9C2A2A]'
        }`}>
          {data.isActive ? '✓ Ativo' : '✕ Indisponível'}
        </span>
      </div>

      <div>
        <span className="text-xs font-medium text-gray-300 block mb-2">Localização</span>
        <div className="flex gap-2 text-xs">
          <div className="bg-white/5 border border-white/10 rounded px-2.5 py-1 text-gray-200">País: {data.location.country}</div>
          <div className="bg-white/5 border border-white/10 rounded px-2.5 py-1 text-gray-200">Região: {data.location.region}</div>
          <div className="bg-white/5 border border-white/10 rounded px-2.5 py-1 text-gray-200">Cidade: {data.location.city}</div>
        </div>
      </div>

      <div>
        <span className="text-xs font-medium text-gray-300 block mb-2">Valores</span>
        <div className="bg-black/20 border border-white/10 rounded p-3 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs text-gray-200">
            <span>{data.metrics.kwh} kWh</span>
            <div className="w-32 bg-black/40 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#FFD32C] h-full w-3/4 rounded-full"></div>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-200">
            <span>{data.metrics.co2}</span>
            <div className="w-32 bg-black/40 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#2FA862] h-full w-1/2 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};