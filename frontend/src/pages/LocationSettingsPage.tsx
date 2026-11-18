import React, { useState, useRef, useEffect } from 'react';
import { ToggleSwitch } from '../components/ToggleSwitch';

interface LocationSettingsPageProps {
  onBack: () => void;
}

const LOCATION_OPTIONS = [
  'São Paulo - SP',
  'Jacareí - SP',
  'São José dos Campos - SP',
  'Rio de Janeiro - RJ',
  'Belo Horizonte - MG',
  'Curitiba - PR',
  'São Francisco - EUA',
  'Berlim - DE',
  'Lisboa - PT',
  'Tóquio - JP',
];

export const LocationSettingsPage: React.FC<LocationSettingsPageProps> = ({ onBack }) => {
  const [autoDetect, setAutoDetect] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('São Paulo - SP');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#07150E] text-[#F7F7F5] p-4 sm:p-6 md:p-8 font-sans pb-24 md:pb-20">
      <div className="w-full max-w-[1280px]">
        {/* Botão Voltar */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar para Configurações"
          className="inline-flex items-center justify-center w-8 h-8 -ml-1.5 mb-2 rounded-lg text-[#F7F7F5] hover:bg-[#0E2218] transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none">
            <path
              d="M10.5 13L5.5 8L10.5 3"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Cabeçalho */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F7F7F5] mb-1">
          Localização
        </h1>
        <p className="text-xs sm:text-sm text-[#8FA89B] mb-6">
          Defina a localização que será usada nos gráficos em tempo real e na distribuição da pegada por horário.
        </p>

        {/* Card Principal */}
        <div className="bg-[#0E2218] border border-[#1B4D3E] rounded-[10px] p-4 sm:p-6 space-y-5">
          {/* Linha: Detectar automaticamente */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#1B4D3E]">
            <div>
              <div className="text-sm sm:text-base font-semibold text-[#F7F7F5]">
                Detectar automaticamente
              </div>
              <div className="text-xs text-[#8FA89B] mt-0.5">
                Usar a localização do seu dispositivo
              </div>
            </div>

            <ToggleSwitch
              checked={autoDetect}
              ariaLabel="Detectar localização automaticamente"
              onChange={() => {
                const next = !autoDetect;
                setAutoDetect(next);
                if (next) {
                  setSelectedLocation('São Paulo - SP');
                  setIsDropdownOpen(false);
                }
                setSavedToast(false);
              }}
            />
          </div>

          {/* Seletor customizado de Localização */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-medium text-[#D4E3DA] mb-1.5">
              Localização
            </label>
            <button
              type="button"
              disabled={autoDetect}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              className={`w-full flex items-center justify-between gap-2 bg-[#0B1C12] border-2 rounded-[8px] px-4 py-2.5 text-xs sm:text-sm text-[#F7F7F5] transition-colors ${
                autoDetect
                  ? 'border-[#243F2F] opacity-70 cursor-not-allowed'
                  : isDropdownOpen
                  ? 'border-[#F2FAF5] cursor-pointer'
                  : 'border-[#385E47] hover:border-[#F2FAF5] cursor-pointer'
              }`}
            >
              <span>{selectedLocation}</span>
              <svg
                className={`w-4 h-4 text-[#F7F7F5] shrink-0 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isDropdownOpen && !autoDetect && (
              <div className="absolute left-0 right-0 mt-1.5 z-30 bg-[#0D2115] border-2 border-[#4A6B57] rounded-[10px] p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.85)] space-y-1.5 max-h-60 overflow-y-auto">
                {LOCATION_OPTIONS.map((loc) => {
                  const isSelected = loc === selectedLocation;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(loc);
                        setIsDropdownOpen(false);
                        setSavedToast(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-lg border text-xs sm:text-sm transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#F2FAF5] border-[#F2FAF5] text-[#07150E] font-semibold'
                          : 'bg-[#0B1C12] border-[#385E47] text-[#D4E3DA] hover:bg-[#F2FAF5] hover:border-[#F2FAF5] hover:text-[#07150E] hover:font-medium'
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Destaque verde: Localização do seu dispositivo */}
          <div className="bg-[#1F8A4C] border border-[#2FA862] rounded-[8px] px-4 py-3">
            <div className="text-[11px] sm:text-xs font-medium text-[#D4E3DA] mb-0.5">
              Localização do seu dispositivo
            </div>
            <div className="text-base sm:text-lg font-bold text-[#F7F7F5] tracking-tight">
              {selectedLocation}
            </div>
          </div>
        </div>

        {/* Feedback + Botões de ação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5">
          <div className="min-h-[20px]">
            {savedToast && (
              <span className="text-xs font-medium text-[#2FA862]">
                ✓ Preferência de localização salva com sucesso.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-[8px] bg-[#0E2218] hover:bg-[#132E20] border border-[#385E47] text-xs sm:text-sm font-medium text-[#F7F7F5] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-[8px] bg-[#2FA862] hover:bg-[#1F8A4C] border border-[#14C45A] text-xs sm:text-sm font-semibold text-[#F7F7F5] transition-colors cursor-pointer"
            >
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};