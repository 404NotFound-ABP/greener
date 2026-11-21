import React from 'react';

export type ConfigSectionId =
  | 'acessibilidade'
  | 'local'
  | 'fuso-horario'
  | 'idioma'
  | 'gerenciamento-conta'
  | 'privacidade-seguranca'
  | 'sobre';

interface ConfigItem {
  id: ConfigSectionId;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ConfigGroup {
  groupTitle: string;
  items: ConfigItem[];
}

interface ConfigPageProps {
  onSelectSection?: (sectionId: ConfigSectionId) => void;
}

const CONFIG_GROUPS: ConfigGroup[] = [
  {
    groupTitle: 'Preferências',
    items: [
      {
        id: 'acessibilidade',
        title: 'Acessibilidade',
        description: 'Reduzir movimento, tamanho do texto e contraste',
        icon: (
          <svg className="w-8 h-8 text-[#F7F7F5]" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="4.5" r="2.1" />
            <path d="M19 8.5h-5.2c-.6 0-1.2 0-1.8 0s-1.2 0-1.8 0H5a1 1 0 000 2h4.2l.3 3.2-1.9 5.5a1 1 0 001.9.6l1.7-4.8h1.6l1.7 4.8a1 1 0 001.9-.6l-1.9-5.5.3-3.2H19a1 1 0 000-2z" />
          </svg>
        ),
      },
      {
        id: 'local',
        title: 'Local',
        description: 'Sua localização padrão no mapa',
        icon: (
          <svg className="w-8 h-8 text-[#F7F7F5]" viewBox="0 0 24 24" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2.5C7.86 2.5 4.5 5.86 4.5 10c0 5.25 6.54 10.89 6.82 11.13a1.05 1.05 0 001.36 0C12.96 20.89 19.5 15.25 19.5 10c0-4.14-3.36-7.5-7.5-7.5zm0 10.25a2.75 2.75 0 110-5.5 2.75 2.75 0 010 5.5z"
            />
          </svg>
        ),
      },
      {
        id: 'fuso-horario',
        title: 'Fuso horário',
        description: 'Define o horário dos gráficos e do histórico',
        icon: (
          <svg className="w-8 h-8 text-[#F7F7F5]" viewBox="0 0 24 24" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2.5a9.5 9.5 0 100 19 9.5 9.5 0 000-19zm.85 5a.85.85 0 00-1.7 0v4.8c0 .26.12.51.32.67l3.1 2.45a.85.85 0 101.06-1.33l-2.78-2.2V7.5z"
            />
          </svg>
        ),
      },
      {
        id: 'idioma',
        title: 'Idioma',
        description: 'Idioma da interface',
        icon: (
          <svg
            className="w-8 h-8 text-[#F7F7F5]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6.5h9" />
            <path d="M8.5 4v2.5" />
            <path d="M11 6.5c-.6 3.5-2.8 6.4-6 8.2" />
            <path d="M6.2 10.2c1.2 1.6 2.9 3 4.8 4" />
            <path d="M13.5 20l3.8-9 3.7 9" />
            <path d="M14.6 17.5h5.3" />
          </svg>
        ),
      },
    ],
  },
  {
    groupTitle: 'Conta e segurança',
    items: [
      {
        id: 'gerenciamento-conta',
        title: 'Gerenciamento de conta',
        description: 'Gerenciar conta e alterar serviços de acordo com sua preferência',
        icon: (
          <svg className="w-8 h-8 text-[#F7F7F5]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12a4.25 4.25 0 100-8.5 4.25 4.25 0 000 8.5zM4.5 19.25C4.5 16.07 7.86 14 12 14s7.5 2.07 7.5 5.25a1.25 1.25 0 01-1.25 1.25H5.75A1.25 1.25 0 014.5 19.25z" />
          </svg>
        ),
      },
      {
        id: 'privacidade-seguranca',
        title: 'Privacidade e segurança',
        description: 'Dados, permissões e proteção da conta',
        icon: (
          <svg className="w-8 h-8 text-[#F7F7F5]" viewBox="0 0 24 24" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2.4l7.2 3.1v5.8c0 4.86-3.07 9.27-7.2 10.7-4.13-1.43-7.2-5.84-7.2-10.7V5.5L12 2.4zm0 6.35a1.65 1.65 0 00-.85 3.06v2.04a.85.85 0 001.7 0v-2.04A1.65 1.65 0 0012 8.75z"
            />
          </svg>
        ),
      },
    ],
  },
  {
    groupTitle: 'Sobre o produto',
    items: [
      {
        id: 'sobre',
        title: 'Sobre',
        description: 'Versão, termos de uso e contato',
        icon: (
          <svg className="w-8 h-8 text-[#F7F7F5]" viewBox="0 0 24 24" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2.5a9.5 9.5 0 100 19 9.5 9.5 0 000-19zm0 4.3a1.15 1.15 0 110 2.3 1.15 1.15 0 010-2.3zm-.95 4.2a.95.95 0 011.9 0v5.3a.95.95 0 01-1.9 0V11z"
            />
          </svg>
        ),
      },
    ],
  },
];

export const ConfigPage: React.FC<ConfigPageProps> = ({ onSelectSection }) => {
  return (
    <div className="min-h-screen bg-[#07150E] text-[#F7F7F5] p-4 sm:p-6 md:p-8 font-sans pb-24 md:pb-20">
      <div className="w-full max-w-[1280px]">
        {/* Cabeçalho */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F7F7F5] mb-6 sm:mb-8">
          Configurações
        </h1>

        {/* Seções agrupadas */}
        <div className="space-y-6 sm:space-y-7">
          {CONFIG_GROUPS.map((group) => (
            <section key={group.groupTitle} aria-label={group.groupTitle}>
              <h2 className="text-sm font-medium text-[#D4E3DA] mb-3">
                {group.groupTitle}
              </h2>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectSection?.(item.id)}
                    className="w-full flex items-center justify-between gap-[10px] text-left bg-[#0E2218] hover:bg-[#132E20] border border-[#1B4D3E] hover:border-[#2FA862] focus:outline-none focus:border-[#F7F7F5] rounded-[10px] px-[18px] py-[14px] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-[10px] min-w-0">
                      <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>

                      <div className="flex flex-col justify-start items-start min-w-0">
                        <span className="text-[18px] sm:text-[20px] font-medium leading-[28px] text-[#F7F7F5]">
                          {item.title}
                        </span>
                        <span className="text-[13px] sm:text-[14px] font-normal leading-[20px] text-[#8FA89B]">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-[#F7F7F5] group-hover:translate-x-0.5 transition-transform"
                        viewBox="0 0 10 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2 1.5L8.5 8L2 14.5"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};