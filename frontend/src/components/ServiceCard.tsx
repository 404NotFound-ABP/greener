import React, { useState } from 'react';
import type { ServiceData } from '../types/service';

export interface ServiceCardProps {
  service: ServiceData;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const [isSelected, setIsSelected] = useState(false);

  const statusNorm = service?.status?.toLowerCase() || '';
  const isAtivo = statusNorm === 'ativo';
  const isIndisponivel = statusNorm === 'indisponível' || statusNorm === 'indisponivel';

  return (
    <div className="self-stretch w-full p-[10px] bg-[#166A3E]/50 overflow-hidden rounded-[14px] border border-[#2FA862] flex flex-col justify-start items-start gap-[14px] shrink-0">
      
      {/* =========================================================
          1. TOPO: Checkbox + Nome do Serviço + Badge de Estado
          ========================================================= */}
      <div className="self-stretch px-[5px] flex justify-start items-center gap-[8px]">
        {/* Checkbox 25x25px clicável */}
        <button
          type="button"
          onClick={() => setIsSelected(!isSelected)}
          aria-label={`Selecionar ${service.nome}`}
          className={`w-[25px] h-[25px] relative rounded-[5px] border border-[#2FA862] flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            isSelected ? 'bg-[#2FA862]' : 'bg-transparent hover:bg-[#2FA862]/20'
          }`}
        >
          {isSelected && (
            <svg className="w-[16px] h-[16px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Nome do Serviço */}
        <div className="flex-1 text-[#F7F7F5] text-[16px] font-normal leading-[24px] break-words">
          {service.nome}
        </div>

        {/* Badge de Status (Ativo / Indisponível / Sem métricas) */}
        <div
          className={`px-[5px] py-[4px] overflow-hidden rounded-[10px] border flex justify-start items-center gap-[4px] shrink-0 ${
            isAtivo
              ? 'bg-[#2FA862] border-[#2FA862]'
              : isIndisponivel
              ? 'bg-[#9C2A2A] border-[#F34F0E]'
              : 'bg-[#4A504D] border-[#B8B7B8]'
          }`}
        >
          <div className="w-[25px] h-[25px] relative overflow-hidden flex items-center justify-center shrink-0">
            {isAtivo ? (
              <svg className="w-[20px] h-[20px] text-[#F7F7F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4" />
              </svg>
            ) : isIndisponivel ? (
              <svg className="w-[20px] h-[20px] text-[#F2FAF5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 10l4 4m0-4l-4 4" />
              </svg>
            ) : (
              <svg className="w-[20px] h-[20px] text-[#F2FAF5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8 12h8" />
              </svg>
            )}
          </div>
          <span className="text-[#F2FAF5] text-[16px] font-normal leading-[24px]">
            {service.status}
          </span>
        </div>
      </div>

      {/* =========================================================
          2. LOCALIZAÇÃO: País, Região e Cidade
          ========================================================= */}
      <div className="self-stretch flex flex-col justify-center items-start gap-[5px]">
        <div className="text-[#F2FAF5] text-[16px] font-normal leading-[24px]">
          Localização
        </div>
        <div className="self-stretch flex justify-start items-start gap-[10px] flex-wrap content-start">
          <div className="p-[4px] rounded-[6px] border border-[#2FA862] flex flex-col justify-center items-center">
            <span className="text-[#F2FAF5] text-[14px] font-normal leading-[20px]">
              País: {service.localizacao.pais}
            </span>
          </div>
          <div className="p-[4px] overflow-hidden rounded-[6px] border border-[#2FA862] flex flex-col justify-start items-start">
            <span className="text-[#F2FAF5] text-[14px] font-normal leading-[20px]">
              Região: {service.localizacao.regiao}
            </span>
          </div>
          <div className="p-[4px] overflow-hidden rounded-[6px] border border-[#2FA862] flex flex-col justify-start items-start">
            <span className="text-[#F2FAF5] text-[14px] font-normal leading-[20px]">
              Cidade: {service.localizacao.cidade}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. VALORES: kWh e gCO₂e com barras roxas (#8A38F5)
          ========================================================= */}
      <div className="self-stretch flex flex-col justify-start items-start gap-[5px]">
        <div className="text-white text-[16px] font-normal leading-[24px]">
          Valores
        </div>
        <div className="self-stretch p-[5px] rounded-[10px] border border-[#2FA862] flex flex-col justify-start items-start gap-[4px]">
          {/* Linha 1: kWh */}
          <div className="inline-flex justify-start items-center gap-[6px]">
            <span className="text-[#F2FAF5] text-[14px] font-normal leading-[20px]">
              {service.valores.kwh} kWh
            </span>
            <div className="w-[100px] h-[4px] relative bg-[#8A38F5] rounded-[10px]" />
          </div>

          {/* Linha 2: gCO₂e */}
          <div className="inline-flex justify-start items-center gap-[6px]">
            <span className="text-[#F2FAF5] text-[14px] font-normal leading-[20px]">
              gCO₂e
            </span>
            <div className="w-[100px] h-[4px] relative bg-[#8A38F5] rounded-[10px]" />
          </div>
        </div>
      </div>

    </div>
  );
};