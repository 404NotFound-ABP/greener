import React, { useState } from 'react';
import { ToggleSwitch } from '../components/ToggleSwitch';

interface AccessibilitySettingsPageProps {
  onBack: () => void;
}

interface AccessibilityOption {
  id: string;
  label: string;
  defaultEnabled: boolean;
}

const ACCESSIBILITY_OPTIONS: AccessibilityOption[] = [
  { id: 'high-contrast-fonts', label: 'Fontes de alto-contraste', defaultEnabled: false },
  { id: 'enable-audio', label: 'Ativar áudio', defaultEnabled: true },
  { id: 'bold-text', label: 'Textos em negrito.', defaultEnabled: true },
  { id: 'vibrant-colors', label: 'Cores vibrantes para destaque', defaultEnabled: false },
  { id: 'subtle-tones', label: 'Tons sutis para elegância.', defaultEnabled: true },
  { id: 'rich-textures', label: 'Texturas ricas para profundidade', defaultEnabled: true },
  { id: 'striking-contrasts', label: 'Contrastes marcantes para dinamismo.', defaultEnabled: true },
];

export const AccessibilitySettingsPage: React.FC<AccessibilitySettingsPageProps> = ({ onBack }) => {
  const initialState = ACCESSIBILITY_OPTIONS.reduce<Record<string, boolean>>((acc, item) => {
    acc[item.id] = item.defaultEnabled;
    return acc;
  }, {});

  const [settings, setSettings] = useState<Record<string, boolean>>(initialState);
  const [savedToast, setSavedToast] = useState(false);

  const toggleOption = (id: string) => {
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
    setSavedToast(false);
  };

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
          Acessibilidade
        </h1>
        <p className="text-xs sm:text-sm text-[#8FA89B] mb-6">
          Defina os recursos de acessibilidade que serão usados durante o uso do programa.
        </p>

        {/* Container principal das opções */}
        <div className="bg-[#0E2218] border border-[#1B4D3E] rounded-[10px] p-3.5 sm:p-4 space-y-2.5">
          {ACCESSIBILITY_OPTIONS.map((option) => {
            const isEnabled = settings[option.id];

            return (
              <div
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className="flex items-center justify-between gap-4 bg-[#0B1C12] hover:bg-[#122B1D] border border-[#1B4D3E] rounded-[8px] px-4 py-3 transition-colors cursor-pointer select-none"
              >
                <span className="text-xs sm:text-sm font-medium text-[#F7F7F5]">
                  {option.label}
                </span>

                <div onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    checked={isEnabled}
                    onChange={() => toggleOption(option.id)}
                    ariaLabel={option.label}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Feedback de salvamento + Botões de ação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5">
          <div className="min-h-[20px]">
            {savedToast && (
              <span className="text-xs font-medium text-[#2FA862]">
                ✓ Preferências de acessibilidade salvas com sucesso.
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