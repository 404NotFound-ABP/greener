import React, { useState, useRef, useEffect } from 'react';

interface LanguageSettingsPageProps {
  onBack: () => void;
}

const LANGUAGE_OPTIONS = [
  'Português (Brasil)',
  'Português (Portugal)',
  'Inglês',
  'Espanhol',
  'Francês',
  'Alemão',
  'Japonês',
];

export const LanguageSettingsPage: React.FC<LanguageSettingsPageProps> = ({ onBack }) => {
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('Português (Brasil)');
  const [secondaryLanguage, setSecondaryLanguage] = useState<string>('Inglês');
  const [openMenu, setOpenMenu] = useState<'primary' | 'secondary' | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
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
          Idioma
        </h1>
        <p className="text-xs sm:text-sm text-[#8FA89B] mb-6">
          Defina o idioma desejado para leitura.
        </p>

        {/* Card Principal */}
        <div
          ref={containerRef}
          className="bg-[#0E2218] border border-[#1B4D3E] rounded-[10px] p-4 sm:p-6 space-y-5"
        >
          {/* Título do bloco */}
          <div className="pb-4 border-b border-[#1B4D3E]">
            <div className="text-sm sm:text-base font-semibold text-[#F7F7F5]">
              Selecione os idiomas
            </div>
            <div className="text-xs text-[#8FA89B] mt-0.5">
              Selecione se quiser manter um idioma para traduzir conteúdos
            </div>
          </div>

          {/* Idioma principal */}
          <div className="relative">
            <label className="block text-xs font-medium text-[#D4E3DA] mb-1.5">
              Idioma principal
            </label>
            <button
              type="button"
              onClick={() => setOpenMenu((prev) => (prev === 'primary' ? null : 'primary'))}
              aria-expanded={openMenu === 'primary'}
              className={`w-full flex items-center justify-between gap-2 bg-[#0B1C12] border-2 rounded-[8px] px-4 py-2.5 text-xs sm:text-sm text-[#F7F7F5] transition-colors cursor-pointer ${
                openMenu === 'primary'
                  ? 'border-[#F2FAF5]'
                  : 'border-[#385E47] hover:border-[#F2FAF5]'
              }`}
            >
              <span>{primaryLanguage}</span>
              <svg
                className={`w-4 h-4 text-[#F7F7F5] shrink-0 transition-transform ${
                  openMenu === 'primary' ? 'rotate-180' : ''
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

            {openMenu === 'primary' && (
              <div className="absolute left-0 right-0 mt-1.5 z-30 bg-[#0D2115] border-2 border-[#4A6B57] rounded-[10px] p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.85)] space-y-1.5 max-h-60 overflow-y-auto">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = lang === primaryLanguage;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setPrimaryLanguage(lang);
                        setOpenMenu(null);
                        setSavedToast(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-lg border text-xs sm:text-sm transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#F2FAF5] border-[#F2FAF5] text-[#07150E] font-semibold'
                          : 'bg-[#0B1C12] border-[#385E47] text-[#D4E3DA] hover:bg-[#F2FAF5] hover:border-[#F2FAF5] hover:text-[#07150E] hover:font-medium'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Idioma secundário */}
          <div className="relative">
            <label className="block text-xs font-medium text-[#D4E3DA] mb-1.5">
              Idioma secundário
            </label>
            <button
              type="button"
              onClick={() => setOpenMenu((prev) => (prev === 'secondary' ? null : 'secondary'))}
              aria-expanded={openMenu === 'secondary'}
              className={`w-full flex items-center justify-between gap-2 bg-[#0B1C12] border-2 rounded-[8px] px-4 py-2.5 text-xs sm:text-sm text-[#F7F7F5] transition-colors cursor-pointer ${
                openMenu === 'secondary'
                  ? 'border-[#F2FAF5]'
                  : 'border-[#385E47] hover:border-[#F2FAF5]'
              }`}
            >
              <span>{secondaryLanguage}</span>
              <svg
                className={`w-4 h-4 text-[#F7F7F5] shrink-0 transition-transform ${
                  openMenu === 'secondary' ? 'rotate-180' : ''
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

            {openMenu === 'secondary' && (
              <div className="absolute left-0 right-0 mt-1.5 z-30 bg-[#0D2115] border-2 border-[#4A6B57] rounded-[10px] p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.85)] space-y-1.5 max-h-60 overflow-y-auto">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = lang === secondaryLanguage;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setSecondaryLanguage(lang);
                        setOpenMenu(null);
                        setSavedToast(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-lg border text-xs sm:text-sm transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#F2FAF5] border-[#F2FAF5] text-[#07150E] font-semibold'
                          : 'bg-[#0B1C12] border-[#385E47] text-[#D4E3DA] hover:bg-[#F2FAF5] hover:border-[#F2FAF5] hover:text-[#07150E] hover:font-medium'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Feedback + Botões de ação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5">
          <div className="min-h-[20px]">
            {savedToast && (
              <span className="text-xs font-medium text-[#2FA862]">
                ✓ Preferências de idioma salvas com sucesso.
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