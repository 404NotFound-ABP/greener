import React, { useState } from 'react';

interface PrivacySecuritySettingsPageProps {
  onBack: () => void;
}

type PrivacyActionModal = 'export' | 'privacy-policy' | 'delete-account' | null;

export const PrivacySecuritySettingsPage: React.FC<PrivacySecuritySettingsPageProps> = ({
  onBack,
}) => {
  const [activeModal, setActiveModal] = useState<PrivacyActionModal>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportData = () => {
    const payload = {
      aplicacao: 'GreenER',
      dataExportacao: new Date().toISOString(),
      preferencias: {
        fusoHorario: 'America/Sao_Paulo',
        localizacao: 'São Paulo - SP',
        idiomaPrincipal: 'Português (Brasil)',
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'greener-dados-conta.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setActiveModal(null);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3500);
  };

  const items = [
    {
      id: 'export' as const,
      title: 'Exportar meus dados',
      description: 'Baixe uma cópia dos seus dados e relatórios registrados na plataforma',
    },
    {
      id: 'privacy-policy' as const,
      title: 'Política de privacidade',
      description: 'Saiba como coletamos, armazenamos e protegemos suas informações',
    },
    {
      id: 'delete-account' as const,
      title: 'Excluir conta',
      description: 'Encerre permanentemente sua conta e remova todos os dados associados',
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
          Privacidade e segurança
        </h1>
        <p className="text-xs sm:text-sm text-[#8FA89B] mb-6">
          Gerencie suas permissões, dados pessoais e a segurança da sua conta.
        </p>

        {/* Container Principal */}
        <div className="bg-[#0E2218] border border-[#1B4D3E] rounded-[10px] divide-y divide-[#1B4D3E] overflow-hidden">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveModal(item.id)}
              className="w-full flex items-center justify-between gap-4 text-left px-4 sm:px-6 py-4 hover:bg-[#132E20] transition-colors cursor-pointer group"
            >
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-semibold text-[#F7F7F5]">
                  {item.title}
                </div>
                <div className="text-xs sm:text-sm text-[#8FA89B] mt-0.5">
                  {item.description}
                </div>
              </div>

              <svg
                className="w-4 h-4 text-[#F7F7F5] shrink-0 group-hover:translate-x-0.5 transition-transform"
                viewBox="0 0 10 16"
                fill="none"
              >
                <path
                  d="M2 1.5L8.5 8L2 14.5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>

        {exportSuccess && (
          <div className="mt-4 text-xs font-medium text-[#2FA862]">
            ✓ Arquivo com os dados da conta exportado com sucesso.
          </div>
        )}
      </div>

      {/* Modal de Ação */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0E2218] border-2 border-[#385E47] rounded-2xl p-5 sm:p-6 shadow-2xl"
          >
            {activeModal === 'export' && (
              <>
                <h2 className="text-lg font-bold text-[#F7F7F5] mb-2">Exportar dados da conta</h2>
                <p className="text-xs sm:text-sm text-[#8FA89B] mb-5">
                  Será gerado um arquivo JSON contendo suas preferências, configurações regionais e metadados vinculados ao seu perfil no GreenER.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-[8px] bg-[#0B1C12] border border-[#385E47] text-xs sm:text-sm text-[#F7F7F5] hover:bg-[#132E20] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="px-4 py-2 rounded-[8px] bg-[#2FA862] border border-[#14C45A] text-xs sm:text-sm font-semibold text-[#F7F7F5] hover:bg-[#1F8A4C] cursor-pointer"
                  >
                    Baixar JSON
                  </button>
                </div>
              </>
            )}

            {activeModal === 'privacy-policy' && (
              <>
                <h2 className="text-lg font-bold text-[#F7F7F5] mb-2">Política de privacidade</h2>
                <p className="text-xs sm:text-sm text-[#8FA89B] leading-relaxed mb-5">
                  O GreenER coleta apenas métricas técnicas de consumo energético (kWh) e estimativas de emissão de carbono (kgCO₂e) dos serviços monitorados, em conformidade com a LGPD. Nenhuma informação pessoal é compartilhada com terceiros.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-[8px] bg-[#2FA862] border border-[#14C45A] text-xs sm:text-sm font-semibold text-[#F7F7F5] hover:bg-[#1F8A4C] cursor-pointer"
                  >
                    Entendi
                  </button>
                </div>
              </>
            )}

            {activeModal === 'delete-account' && (
              <>
                <h2 className="text-lg font-bold text-[#F7F7F5] mb-2">Excluir conta</h2>
                <p className="text-xs sm:text-sm text-[#8FA89B] mb-5">
                  Tem certeza de que deseja encerrar sua conta? Esta ação removerá permanentemente suas preferências e históricos salvos.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-[8px] bg-[#0B1C12] border border-[#385E47] text-xs sm:text-sm text-[#F7F7F5] hover:bg-[#132E20] cursor-pointer"
                  >
                    Manter conta
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-[8px] bg-[#9E2B25] border border-[#F35B1B] text-xs sm:text-sm font-semibold text-[#F7F7F5] hover:bg-[#B8322B] cursor-pointer"
                  >
                    Confirmar exclusão
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};