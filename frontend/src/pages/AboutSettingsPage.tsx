import React from 'react';

interface AboutSettingsPageProps {
  onBack: () => void;
}

export const AboutSettingsPage: React.FC<AboutSettingsPageProps> = ({ onBack }) => {
  const aboutItems = [
    {
      id: 'version',
      title: 'Versão',
      value: '1.0.0 · Build 2026.11',
      icon: (
        <svg className="w-4 h-4 text-[#07150E]" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 2.9a.85.85 0 110 1.7.85.85 0 010-1.7zm-.7 2.9a.7.7 0 011.4 0v3.8a.7.7 0 01-1.4 0V7.3z" />
        </svg>
      ),
    },
    {
      id: 'last-update',
      title: 'Última atualização',
      value: '12/10/2026 · Equipe 404 Not Found',
      icon: (
        <svg className="w-4 h-4 text-[#07150E]" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm.65 3.3a.65.65 0 00-1.3 0v3.4c0 .2.09.38.24.5l2.2 1.7a.65.65 0 10.8-1.02L8.65 7.9V4.8z" />
        </svg>
      ),
    },
  ];

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
          Sobre
        </h1>
        <p className="text-xs sm:text-sm text-[#8FA89B] mb-6">
          Informações técnicas e detalhes da versão do GreenER.
        </p>

        {/* Container Principal */}
        <div className="bg-[#0E2218] border border-[#1B4D3E] rounded-[10px] divide-y divide-[#1B4D3E] overflow-hidden">
          {aboutItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3.5 px-4 sm:px-6 py-4">
              <div className="w-7 h-7 rounded-md bg-[#F7F7F5] flex items-center justify-center shrink-0">
                {item.icon}
              </div>

              <div>
                <div className="text-sm sm:text-base font-semibold text-[#F7F7F5]">
                  {item.title}
                </div>
                <div className="text-xs sm:text-sm text-[#8FA89B] mt-0.5">
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};