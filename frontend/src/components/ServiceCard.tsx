import React from 'react';
import type { ServiceData } from '../types/service';

interface ServiceCardProps {
  service: ServiceData;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const isAtivo = service.status === 'Ativo';

  return (
    <div className={`p-4 rounded-xl border ${isAtivo ? 'border-green-800 bg-green-900/40' : 'border-red-800 bg-red-900/40'} mb-4 backdrop-blur-md`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" className="rounded bg-transparent border-gray-500" />
          <span className="text-white">{service.nome}</span>
        </div>
        <span className={`px-2 py-1 rounded text-sm ${isAtivo ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'}`}>
          {isAtivo ? '✓ Ativo' : '✕ Indisponível'}
        </span>
      </div>

      <div className="mb-4">
        <h4 className="text-gray-300 text-sm mb-2">Localização</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded border border-green-700 text-green-400">País: {service.localizacao.pais}</span>
          <span className="px-2 py-1 rounded border border-green-700 text-green-400">Região: {service.localizacao.regiao}</span>
          <span className="px-2 py-1 rounded border border-green-700 text-green-400">Cidade: {service.localizacao.cidade}</span>
        </div>
      </div>

      <div>
        <h4 className="text-gray-300 text-sm mb-2">Valores</h4>
        <div className="p-3 rounded-lg border border-green-800 bg-black/20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300 w-12">{service.valores.kwh} kWh</span>
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-3/4"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300 w-12">gCO₂e</span>
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};