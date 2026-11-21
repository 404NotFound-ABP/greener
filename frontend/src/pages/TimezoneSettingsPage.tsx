import React, { useState, useRef, useEffect } from 'react';
import { ToggleSwitch } from '../components/ToggleSwitch';

interface TimezoneSettingsPageProps {
  onBack: () => void;
}

interface TimezoneOption {
  label: string;
  iana: string;
  offsetLabel: string;
}

const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { label: '(UTC-03:00) Brasília', iana: 'America/Sao_Paulo', offsetLabel: 'UTC-3' },
  { label: '(UTC-04:00) Manaus', iana: 'America/Manaus', offsetLabel: 'UTC-4' },
  { label: '(UTC-05:00) Nova Iorque', iana: 'America/New_York', offsetLabel: 'UTC-5' },
  { label: '(UTC-08:00) São Francisco', iana: 'America/Los_Angeles', offsetLabel: 'UTC-8' },
  { label: '(UTC+00:00) Lisboa / Londres', iana: 'Europe/Lisbon', offsetLabel: 'UTC+0' },
  { label: '(UTC+01:00) Berlim', iana: 'Europe/Berlin', offsetLabel: 'UTC+1' },
  { label: '(UTC+09:00) Tóquio', iana: 'Asia/Tokyo', offsetLabel: 'UTC+9' },
  { label: '(UTC+10:00) Sydney', iana: 'Australia/Sydney', offsetLabel: 'UTC+10' },
];

export const TimezoneSettingsPage: React.FC<TimezoneSettingsPageProps> = ({ onBack }) => {
  const [autoDetect, setAutoDetect] = useState(true);
  const [selectedTimezone, setSelectedTimezone] = useState<string>('America/Sao_Paulo');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [savedToast, setSavedToast] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOption =
    TIMEZONE_OPTIONS.find((tz) => tz.iana === selectedTimezone) ?? TIMEZONE_OPTIONS[0];

  const formattedTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: activeOption.iana,
  }).format(now);

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: activeOption.iana,
  }).format(now);

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
          Fuso horário
        </h1>
        <p className="text-xs sm:text-sm text-[#8FA89B] mb-6">
          Defina o horário usado nos gráficos em tempo real e na distribuição da pegada por horário.
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
                Usar o fuso do seu dispositivo: {activeOption.iana} ({activeOption.offsetLabel})
              </div>
            </div>

            <ToggleSwitch
              checked={autoDetect}
              ariaLabel="Detectar fuso horário automaticamente"
              onChange={() => {
                const next = !autoDetect;
                setAutoDetect(next);
                if (next) {
                  setSelectedTimezone('America/Sao_Paulo');
                  setIsDropdownOpen(false);
                }
                setSavedToast(false);
              }}
            />
          </div>

          {/* Seletor customizado de Fuso horário */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-medium text-[#D4E3DA] mb-1.5">
              Fuso horário
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
              <span>{activeOption.label}</span>
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
                {TIMEZONE_OPTIONS.map((tz) => {
                  const isSelected = tz.iana === selectedTimezone;
                  return (
                    <button
                      key={tz.iana}
                      type="button"
                      onClick={() => {
                        setSelectedTimezone(tz.iana);
                        setIsDropdownOpen(false);
                        setSavedToast(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-lg border text-xs sm:text-sm transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#F2FAF5] border-[#F2FAF5] text-[#07150E] font-semibold'
                          : 'bg-[#0B1C12] border-[#385E47] text-[#D4E3DA] hover:bg-[#F2FAF5] hover:border-[#F2FAF5] hover:text-[#07150E] hover:font-medium'
                      }`}
                    >
                      {tz.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Destaque verde: Horário atual neste fuso */}
          <div className="bg-[#1F8A4C] border border-[#2FA862] rounded-[8px] px-4 py-3">
            <div className="text-[11px] sm:text-xs font-medium text-[#D4E3DA] mb-0.5">
              Horário atual neste fuso
            </div>
            <div className="text-base sm:text-lg font-bold text-[#F7F7F5] tracking-tight">
              {formattedTime} · {formattedDate}
            </div>
          </div>
        </div>

        {/* Feedback de salvamento + Botões de ação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5">
          <div className="min-h-[20px]">
            {savedToast && (
              <span className="text-xs font-medium text-[#2FA862]">
                ✓ Configuração de fuso horário salva com sucesso.
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