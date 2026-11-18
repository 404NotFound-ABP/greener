import React, { useState } from 'react';
import { MapPage } from '../pages/MapPage';
import { DashboardPage } from '../pages/DashboardPage';
import { HistoricoPage } from '../pages/HistoricoPage';
import { AccountSettingsPage } from '../pages/AccountSettingsPage';
import { ConfigPage } from '../pages/ConfigPage';
import type { ConfigSectionId } from '../pages/ConfigPage';
import { AccessibilitySettingsPage } from '../pages/AccessibilitySettingsPage';
import { TimezoneSettingsPage } from '../pages/TimezoneSettingsPage';
import { LocationSettingsPage } from '../pages/LocationSettingsPage';
import { LanguageSettingsPage } from '../pages/LanguageSettingsPage';
import { PrivacySecuritySettingsPage } from '../pages/PrivacySecuritySettingsPage';
import { AboutSettingsPage } from '../pages/AboutSettingsPage';

export type MainTab = 'mapa' | 'dashboards' | 'historico' | 'config';

const MapIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.46 5.98756L7.04 4.84631C6.66417 4.72113 6.26397 4.68706 5.87238 4.74689C5.4808 4.80672 5.10904 4.95875 4.78774 5.19045C4.46644 5.42215 4.20479 5.72688 4.02437 6.07954C3.84394 6.4322 3.7499 6.82268 3.75 7.21881V21.9476C3.74987 22.4725 3.91497 22.9841 4.22189 23.4099C4.52881 23.8358 4.96199 24.1542 5.46 24.3201L10.46 25.9863C10.9728 26.1571 11.5272 26.1571 12.04 25.9863L17.96 24.0138C18.4732 23.8427 19.028 23.8427 19.5413 24.0138L22.96 25.1538C23.3358 25.279 23.736 25.3131 24.1276 25.2532C24.5192 25.1934 24.891 25.0414 25.2123 24.8097C25.5336 24.578 25.7952 24.2732 25.9756 23.9206C26.1561 23.5679 26.2501 23.1774 26.25 22.7813V8.05256C26.2502 7.5278 26.0853 7.01628 25.7786 6.59047C25.4719 6.16466 25.039 5.84614 24.5412 5.68006L19.5413 4.01381C19.028 3.84273 18.4732 3.84273 17.96 4.01381L12.0387 5.98631C11.5259 6.15711 10.9716 6.15711 10.4587 5.98631"
      strokeWidth="2.08333"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="#063819"
    />
    <path
      d="M11.25 6.25V26.25M18.75 3.75V23.75"
      strokeWidth="2.08333"
      strokeLinejoin="round"
      stroke="#063819"
    />
  </svg>
);

const PanelsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M23.75 3.75H22.5C21.1193 3.75 20 4.86929 20 6.25V23.75C20 25.1307 21.1193 26.25 22.5 26.25H23.75C25.1307 26.25 26.25 25.1307 26.25 23.75V6.25C26.25 4.86929 25.1307 3.75 23.75 3.75Z"
      fill="#063819"
    />
    <path
      d="M15.625 11.25H14.375C12.9943 11.25 11.875 12.3693 11.875 13.75V23.75C11.875 25.1307 12.9943 26.25 14.375 26.25H15.625C17.0057 26.25 18.125 25.1307 18.125 23.75V13.75C18.125 12.3693 17.0057 11.25 15.625 11.25Z"
      fill="#063819"
    />
    <path
      d="M7.5 20H6.25C4.86929 20 3.75 21.1193 3.75 22.5V23.75C3.75 25.1307 4.86929 26.25 6.25 26.25H7.5C8.88071 26.25 10 25.1307 10 23.75V22.5C10 21.1193 8.88071 20 7.5 20Z"
      fill="#063819"
    />
  </svg>
);

const HistoryIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5.3325 20.075C6.38984 22.2133 8.10509 23.9562 10.2262 25.0475C12.3319 26.1293 14.733 26.4944 17.065 26.0875C19.4041 25.6758 21.5472 24.5181 23.1737 22.7875C24.8149 21.0401 25.86 18.8174 26.1588 16.4388C26.4616 14.0547 26.0049 11.6358 24.8537 9.52625C23.7131 7.43274 21.9301 5.76103 19.7675 4.7575C17.6196 3.76271 15.2058 3.49587 12.8925 3.9975C10.58 4.49875 8.685 5.63875 7.1175 7.44125C6.92875 7.64125 6.19875 8.44875 5.5925 9.6675M9.375 10L4.86375 10.9L3.75 6.25M15 11.25V16.25L18.75 18.75"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="#063819"
    />
  </svg>
);

const SettingsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.9988 3.2337C14.3051 3.06362 14.6496 2.97437 15 2.97437C15.3504 2.97437 15.6949 3.06362 16.0013 3.2337L25.0012 8.2337C25.6562 8.59745 26.0625 9.28745 26.0625 10.0374V19.9625C26.0625 20.7125 25.6562 21.4025 25.0012 21.7662L16.0013 26.7662C15.6949 26.9363 15.3504 27.0255 15 27.0255C14.6496 27.0255 14.3051 26.9363 13.9988 26.7662L4.99875 21.7662C4.67703 21.5876 4.40896 21.3261 4.22236 21.0089C4.03575 20.6918 3.9374 20.3304 3.9375 19.9625V10.0374C3.9375 9.28745 4.34375 8.59745 4.99875 8.2337L13.9988 3.2337ZM15.0913 4.8737C15.0633 4.85816 15.0319 4.85 15 4.85C14.9681 4.85 14.9367 4.85816 14.9088 4.8737L5.90875 9.8737C5.87976 9.88985 5.85558 9.9134 5.83867 9.94195C5.82176 9.9705 5.81273 10.003 5.8125 10.0362V19.9637C5.8125 20.0312 5.85 20.0937 5.90875 20.1262L14.9088 25.1262C14.9367 25.1417 14.9681 25.1499 15 25.1499C15.0319 25.1499 15.0633 25.1417 15.0913 25.1262L24.0913 20.1262C24.1202 20.1101 24.1444 20.0865 24.1613 20.058C24.1782 20.0294 24.1873 19.9969 24.1875 19.9637V10.0374C24.1875 10.0041 24.1786 9.97127 24.1616 9.94249C24.1447 9.9137 24.1204 9.88995 24.0913 9.8737L15.0913 4.8737Z"
      fillRule="evenodd"
      clipRule="evenodd"
      fill="#063819"
    />
    <path
      d="M9.0625 15C9.0625 13.4253 9.68806 11.9151 10.8016 10.8016C11.9151 9.68806 13.4253 9.0625 15 9.0625C16.5747 9.0625 18.0849 9.68806 19.1984 10.8016C20.3119 11.9151 20.9375 13.4253 20.9375 15C20.9375 16.5747 20.3119 18.0849 19.1984 19.1984C18.0849 20.3119 16.5747 20.9375 15 20.9375C13.4253 20.9375 11.9151 20.3119 10.8016 19.1984C9.68806 18.0849 9.0625 16.5747 9.0625 15ZM15 10.9375C13.9226 10.9375 12.8892 11.3655 12.1274 12.1274C11.3655 12.8892 10.9375 13.9226 10.9375 15C10.9375 16.0774 11.3655 17.1108 12.1274 17.8726C12.8892 18.6345 13.9226 19.0625 15 19.0625C16.0774 19.0625 17.1108 18.6345 17.8726 17.8726C18.6345 17.1108 19.0625 16.0774 19.0625 15C19.0625 13.9226 18.6345 12.8892 17.8726 12.1274C17.1108 11.3655 16.0774 10.9375 15 10.9375Z"
      fillRule="evenodd"
      clipRule="evenodd"
      fill="#063819"
    />
  </svg>
);

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('mapa');
  const [activeConfigSection, setActiveConfigSection] = useState<ConfigSectionId | null>(null);

  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    if (tab === 'config') {
      setActiveConfigSection(null);
    }
  };

  if (activeTab === 'mapa') {
    return <MapPage onSelectTab={handleTabChange} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#060D09] overflow-hidden font-sans">
      {/* Navegação Desktop */}
      <nav
        aria-label="Navegação principal"
        className="hidden md:flex w-[92px] bg-[#060D09] flex-col items-center py-6 z-50 shrink-0 border-r border-[#1A2E20]"
      >
        <div className="bg-[#063819] p-1.5 rounded-[38px] flex flex-col gap-1.5 shadow-2xl border border-[#0B4B24]">
          {/* Item 1: Mapa */}
          <button
            type="button"
            onClick={() => handleTabChange('mapa')}
            className="flex flex-col items-center justify-center w-[62px] h-[68px] rounded-t-[30px] rounded-b-[10px] transition-colors cursor-pointer bg-[#0B4B24] hover:bg-[#136331]"
          >
            <div className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center mb-1.5 shadow-sm">
              <MapIcon className="w-[18px] h-[18px]" />
            </div>
            <span className="text-[9px] font-medium text-[#F2FAF5] tracking-tight leading-none">Mapa</span>
          </button>

          {/* Item 2: Painéis */}
          <button
            type="button"
            onClick={() => handleTabChange('dashboards')}
            className={`flex flex-col items-center justify-center w-[62px] h-[68px] rounded-[10px] transition-colors cursor-pointer ${
              activeTab === 'dashboards' ? 'bg-[#1F8A4C]' : 'bg-[#0B4B24] hover:bg-[#136331]'
            }`}
          >
            <div className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center mb-1.5 shadow-sm">
              <PanelsIcon className="w-[18px] h-[18px]" />
            </div>
            <span
              className={`text-[9px] tracking-tight leading-none text-[#F2FAF5] ${
                activeTab === 'dashboards' ? 'font-semibold' : 'font-medium'
              }`}
            >
              Painéis
            </span>
          </button>

          {/* Item 3: Histórico */}
          <button
            type="button"
            onClick={() => handleTabChange('historico')}
            className={`flex flex-col items-center justify-center w-[62px] h-[68px] rounded-[10px] transition-colors cursor-pointer ${
              activeTab === 'historico' ? 'bg-[#1F8A4C]' : 'bg-[#0B4B24] hover:bg-[#136331]'
            }`}
          >
            <div className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center mb-1.5 shadow-sm">
              <HistoryIcon className="w-[18px] h-[18px]" />
            </div>
            <span
              className={`text-[9px] tracking-tight leading-none text-[#F2FAF5] ${
                activeTab === 'historico' ? 'font-semibold' : 'font-medium'
              }`}
            >
              Histórico
            </span>
          </button>

          {/* Item 4: Configuração */}
          <button
            type="button"
            onClick={() => handleTabChange('config')}
            className={`flex flex-col items-center justify-center w-[62px] h-[68px] rounded-t-[10px] rounded-b-[30px] transition-colors cursor-pointer ${
              activeTab === 'config' ? 'bg-[#1F8A4C]' : 'bg-[#0B4B24] hover:bg-[#136331]'
            }`}
          >
            <div className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center mb-1.5 shadow-sm">
              <SettingsIcon className="w-[18px] h-[18px]" />
            </div>
            <span
              className={`text-[8.5px] tracking-tight leading-none text-[#F2FAF5] ${
                activeTab === 'config' ? 'font-semibold' : 'font-medium'
              }`}
            >
              Configuração
            </span>
          </button>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="flex-1 relative overflow-y-auto pb-24 md:pb-0">
        {activeTab === 'dashboards' && <DashboardPage />}
        {activeTab === 'historico' && <HistoricoPage />}

        {activeTab === 'config' && activeConfigSection === null && (
          <ConfigPage onSelectSection={(sectionId) => setActiveConfigSection(sectionId)} />
        )}

        {activeTab === 'config' && activeConfigSection === 'acessibilidade' && (
          <AccessibilitySettingsPage onBack={() => setActiveConfigSection(null)} />
        )}

        {activeTab === 'config' && activeConfigSection === 'local' && (
          <LocationSettingsPage onBack={() => setActiveConfigSection(null)} />
        )}

        {activeTab === 'config' && activeConfigSection === 'fuso-horario' && (
          <TimezoneSettingsPage onBack={() => setActiveConfigSection(null)} />
        )}

        {activeTab === 'config' && activeConfigSection === 'idioma' && (
          <LanguageSettingsPage onBack={() => setActiveConfigSection(null)} />
        )}

        {activeTab === 'config' && activeConfigSection === 'gerenciamento-conta' && (
          <AccountSettingsPage onBack={() => setActiveConfigSection(null)} />
        )}

        {activeTab === 'config' && activeConfigSection === 'privacidade-seguranca' && (
          <PrivacySecuritySettingsPage onBack={() => setActiveConfigSection(null)} />
        )}

        {activeTab === 'config' && activeConfigSection === 'sobre' && (
          <AboutSettingsPage onBack={() => setActiveConfigSection(null)} />
        )}
      </main>

      {/* Navegação Mobile Inferior em Pílula Flutuante */}
      <nav
        aria-label="Navegação principal mobile"
        className="md:hidden fixed bottom-3 inset-x-3 z-50 flex justify-center pointer-events-none"
      >
        <div className="pointer-events-auto bg-[#063819]/95 backdrop-blur-md p-1.5 rounded-full flex items-center gap-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.75)] border border-[#0B4B24]">
          <button
            type="button"
            onClick={() => handleTabChange('mapa')}
            className="flex flex-col items-center justify-center w-[68px] h-[56px] rounded-l-full rounded-r-[12px] transition-colors cursor-pointer bg-[#0B4B24] hover:bg-[#136331]"
          >
            <div className="w-[24px] h-[24px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
              <MapIcon className="w-[15px] h-[15px]" />
            </div>
            <span className="text-[9px] font-medium text-[#F2FAF5] tracking-tight leading-none">Mapa</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('dashboards')}
            className={`flex flex-col items-center justify-center w-[68px] h-[56px] rounded-[12px] transition-colors cursor-pointer ${
              activeTab === 'dashboards' ? 'bg-[#1F8A4C]' : 'bg-[#0B4B24] hover:bg-[#136331]'
            }`}
          >
            <div className="w-[24px] h-[24px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
              <PanelsIcon className="w-[15px] h-[15px]" />
            </div>
            <span
              className={`text-[9px] tracking-tight leading-none text-[#F2FAF5] ${
                activeTab === 'dashboards' ? 'font-bold' : 'font-medium'
              }`}
            >
              Painéis
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('historico')}
            className={`flex flex-col items-center justify-center w-[68px] h-[56px] rounded-[12px] transition-colors cursor-pointer ${
              activeTab === 'historico' ? 'bg-[#1F8A4C]' : 'bg-[#0B4B24] hover:bg-[#136331]'
            }`}
          >
            <div className="w-[24px] h-[24px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
              <HistoryIcon className="w-[15px] h-[15px]" />
            </div>
            <span
              className={`text-[9px] tracking-tight leading-none text-[#F2FAF5] ${
                activeTab === 'historico' ? 'font-bold' : 'font-medium'
              }`}
            >
              Histórico
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('config')}
            className={`flex flex-col items-center justify-center w-[74px] h-[56px] rounded-l-[12px] rounded-r-full transition-colors cursor-pointer ${
              activeTab === 'config' ? 'bg-[#1F8A4C]' : 'bg-[#0B4B24] hover:bg-[#136331]'
            }`}
          >
            <div className="w-[24px] h-[24px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
              <SettingsIcon className="w-[15px] h-[15px]" />
            </div>
            <span
              className={`text-[8.5px] tracking-tight leading-none text-[#F2FAF5] ${
                activeTab === 'config' ? 'font-bold' : 'font-medium'
              }`}
            >
              Configuração
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};