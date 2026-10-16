import React, { useState } from 'react';
import { ServiceCard } from './ServiceCard';
import type { ServiceData } from '../types/service';

export const Sidebar: React.FC = () => {
  const [services, setServices] = useState<ServiceData[]>([
    {
      id: '1',
      nome: 'Serviço 1',
      status: 'Ativo',
      localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Caçapava' },
      valores: { kwh: 100, gco2e: 50 }
    },
    {
      id: '2',
      nome: 'Serviço 2',
      status: 'Indisponível',
      localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Caçapava' },
      valores: { kwh: 100, gco2e: 50 }
    }
  ]);

  return (
    <div className="w-96 h-screen bg-gray-900/80 backdrop-blur-xl border-r border-gray-700 p-4 flex flex-col text-white absolute top-0 left-0 z-[1000]">
      
      <div className="flex gap-2 mb-6">
        <div className="flex-1 bg-gray-800/80 rounded-full px-4 py-2 border border-gray-600 flex items-center">
          <span className="text-gray-400 mr-2"></span>
          <input type="text" placeholder="Busque o serviço" className="bg-transparent border-none outline-none w-full text-sm placeholder-gray-400"/>
        </div>
        <button className="p-2 rounded-full border border-gray-600 bg-gray-800/80 hover:bg-gray-700"></button>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3">Mostrar no mapa</h3>
        <div className="flex gap-2 text-xs">
          <button className="px-3 py-1.5 rounded-full bg-green-900 border border-green-700 text-green-400">CO2</button>
          <button className="px-3 py-1.5 rounded-full bg-blue-900/50 border border-blue-800 text-blue-300">gasto de água</button>
          <button className="px-3 py-1.5 rounded-full bg-yellow-900/50 border border-yellow-700 text-yellow-400">gasto de kWh</button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3">Estado do serviço</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <button className="px-3 py-1.5 rounded-lg border border-green-700 flex items-center gap-2"><input type="checkbox" checked readOnly/> Ativo</button>
          <button className="px-3 py-1.5 rounded-lg border border-red-800 flex items-center gap-2"><input type="checkbox" readOnly/> Indisponível</button>
          <button className="px-3 py-1.5 rounded-lg border border-gray-600 flex items-center gap-2"><input type="checkbox" readOnly/> Sem métricas</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <h3 className="font-semibold mb-3">Serviços</h3>
        {services.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center text-xs text-gray-400">
        <span>Última atualização: 12:00</span>
        <div className="flex gap-2">
          <button className="p-1.5 rounded bg-green-900/50 border border-green-800">⏸</button>
          <button className="p-1.5 rounded bg-gray-800 border border-gray-700">↻</button>
        </div>
      </div>
    </div>
  );
};