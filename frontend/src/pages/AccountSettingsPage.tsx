import React, { useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { ToggleSwitch } from '../components/ToggleSwitch';

interface MonitoredService {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'unavailable' | 'no-metrics';
  enabled: boolean;
}

const INTERVAL_OPTIONS = [
  { label: '5 segundos', value: 5 },
  { label: '10 segundos', value: 10 },
  { label: '30 segundos', value: 30 },
  { label: '1 minuto', value: 60 },
  { label: '5 minutos', value: 300 },
  { label: '30 minutos', value: 1800 },
  { label: '1 hora', value: 3600 },
];

export const AccountSettingsPage: React.FC = () => {
  const [services, setServices] = useState<MonitoredService[]>([
    { id: '1', name: 'ASTAH-XYZ', location: 'São Francisco - EUA', status: 'active', enabled: true },
    { id: '2', name: 'ASTAH-ABC', location: 'São Paulo - BR', status: 'active', enabled: true },
    { id: '3', name: 'ASTAH-PQR', location: 'Tóquio - JP', status: 'unavailable', enabled: true },
    { id: '4', name: 'ASTAH-STU', location: 'Cidade do México - MX', status: 'no-metrics', enabled: false },
  ]);

  const [savedConfig, setSavedConfig] = useState({ collectionInterval: 30, refreshInterval: 5 });
  const [collectionInterval, setCollectionInterval] = useState<number>(30);
  const [refreshInterval, setRefreshInterval] = useState<number>(5);

  const [isSaving, setIsSaving] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.map((srv) => (srv.id === id ? { ...srv, enabled: !srv.enabled } : srv))
    );
  };

  const handleDiscoverServices = () => {
    setIsDiscovering(true);
    setTimeout(() => setIsDiscovering(false), 600);
  };

  const handleSaveIntervals = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (collectionInterval < 5 || refreshInterval < 5) {
      setCollectionInterval(savedConfig.collectionInterval);
      setRefreshInterval(savedConfig.refreshInterval);
      setFeedback({
        type: 'error',
        message: 'Intervalo inválido (mínimo de 5 segundos). A configuração anterior foi mantida.',
      });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setSavedConfig({ collectionInterval, refreshInterval });
      setIsSaving(false);
      setFeedback({
        type: 'success',
        message: 'Intervalos de coleta e atualização salvos com sucesso.',
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#060D09] text-white p-4 sm:p-6 md:p-8 font-sans pb-24 md:pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Gerenciamento de conta</h1>
          <p className="text-gray-400 text-xs sm:text-sm">
            Gerencie conta e altere serviços de acordo com sua preferência
          </p>
        </header>

        {/* Bloco 1: Gerenciamento de conta */}
        <section className="bg-[#0C1711] border border-[#1A2E20] rounded-xl p-4 sm:p-6 space-y-3">
          {[
            { title: 'Email', desc: 'Verifique seu email ou faça alterações' },
            { title: 'Senha', desc: 'Cheque sua senha ou faça alterações' },
            { title: 'Verificação em duas etapas', desc: 'Para aumentar a segurança da sua conta faça a verificação em duas etapas' },
            { title: 'Backup', desc: 'Realize backup para não perder nada' },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-lg bg-[#09120D] border border-[#1A2E20] hover:border-[#2FA862] transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <span className="text-gray-400 text-lg shrink-0">›</span>
            </button>
          ))}
        </section>

        {/* Bloco 2: Serviços monitorados e Intervalos (T30/US16) */}
        <section className="bg-[#0C1711] border border-[#1A2E20] rounded-xl p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">Serviços monitorados</h2>
            <p className="text-xs text-gray-400">
              Serviços descobertos no agregador. Escolha o que você quer monitorar
            </p>
          </div>

          {/* Lista de serviços */}
          <div className="space-y-2.5">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-[#09120D] border border-[#1A2E20]"
              >
                <div>
                  <p className="text-sm font-medium text-white">{service.name}</p>
                  <p className="text-xs text-gray-400">{service.location}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <StatusBadge status={service.status} size="sm" />

                  <ToggleSwitch
                    checked={service.enabled}
                    onChange={() => toggleService(service.id)}
                    ariaLabel={`Ativar ou desativar monitoramento de ${service.name}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Descobrir serviços agora */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1A2E20]">
            <div>
              <p className="text-sm font-medium text-white">Descobrir serviços agora</p>
              <p className="text-xs text-gray-400">Última descoberta: 17/10/2026 14:32</p>
            </div>
            <button
              type="button"
              onClick={handleDiscoverServices}
              disabled={isDiscovering}
              className="w-full sm:w-auto px-4 py-2 rounded-md bg-[#2FA862] hover:bg-[#258248] disabled:opacity-50 text-xs font-medium text-white transition-colors"
            >
              {isDiscovering ? 'Atualizando...' : 'Atualizar lista'}
            </button>
          </div>

          {/* Formulário dos intervalos de monitoramento (T30.1 & T30.2) */}
          <form onSubmit={handleSaveIntervals} className="space-y-4 pt-3 border-t border-[#1A2E20]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label htmlFor="collection-interval" className="text-sm font-medium text-white block">
                  Intervalo de coleta dos agentes
                </label>
                <p className="text-xs text-gray-400">Frequência de leitura de consumo nos servidores</p>
              </div>
              <select
                id="collection-interval"
                value={collectionInterval}
                onChange={(e) => setCollectionInterval(Number(e.target.value))}
                className="w-full sm:w-64 px-3 py-2.5 rounded-md bg-[#09120D] border border-[#1A2E20] focus:border-[#2FA862] text-xs text-gray-200 focus:outline-none"
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label htmlFor="refresh-interval" className="text-sm font-medium text-white block">
                  Mudar tempo de atualização
                </label>
                <p className="text-xs text-gray-400">Tempo de atualização automática da interface</p>
              </div>
              <select
                id="refresh-interval"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="w-full sm:w-64 px-3 py-2.5 rounded-md bg-[#09120D] border border-[#1A2E20] focus:border-[#2FA862] text-xs text-gray-200 focus:outline-none"
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Feedback de validação / salvamento (T30.2) */}
            {feedback && (
              <div
                className={`p-3 rounded-md text-xs font-medium border ${
                  feedback.type === 'success'
                    ? 'bg-[#2FA862]/15 text-[#4ADE80] border-[#2FA862]'
                    : 'bg-[#A42F2F]/15 text-red-300 border-[#A42F2F]'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-md bg-[#2FA862] hover:bg-[#258248] disabled:opacity-50 text-xs font-medium text-white transition-colors"
              >
                {isSaving ? 'Salvando...' : 'Salvar intervalos'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};