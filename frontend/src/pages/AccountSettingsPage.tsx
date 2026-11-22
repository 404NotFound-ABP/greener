import React, { useState, useEffect, useCallback } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { formatIntervalLabel } from '../hooks/useServicesPolling';
import { clearSession } from '../utils/auth';

interface AccountSettingsPageProps {
  onBack?: () => void;
}

interface MonitoredService {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'unavailable' | 'no-metrics';
  enabled: boolean;
}

type AccountModalType = 'email' | 'password' | '2fa' | 'backup' | null;

// Valores alinhados com INTERVALOS_PERMITIDOS_SEGUNDOS do back-end (CollectorService)
const INTERVAL_OPTIONS = [
  { label: '5 minutos', value: 300 },
  { label: '15 minutos', value: 900 },
  { label: '30 minutos', value: 1800 },
  { label: '1 hora', value: 3600 },
  { label: '1 dia', value: 86400 },
  { label: '1 mês (30 dias)', value: 2592000 },
];

const RAW_API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/+$/, '');
const API_BASE_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

function formatDateTimeBR(isoDate?: string | null): string {
  if (!isoDate) return 'Nenhuma atualização registrada';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return 'Nenhuma atualização registrada';

  const datePart = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);

  const timePart = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(parsed);

  return `${datePart} às ${timePart}`;
}

export const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({ onBack }) => {
  const [services, setServices] = useState<MonitoredService[]>([
    { id: '1', name: 'ASTAH-XYZ', location: 'São Francisco - EUA', status: 'active', enabled: true },
    { id: '2', name: 'ASTAH-ABC', location: 'São Paulo - BR', status: 'active', enabled: true },
    { id: '3', name: 'ASTAH-PQR', location: 'Tóquio - JP', status: 'unavailable', enabled: true },
    { id: '4', name: 'ASTAH-STU', location: 'Cidade do México - MX', status: 'no-metrics', enabled: false },
  ]);

  const [savedConfig, setSavedConfig] = useState({ collectionInterval: 300, refreshInterval: 300 });
  const [collectionInterval, setCollectionInterval] = useState<number>(300);
  const [refreshInterval, setRefreshInterval] = useState<number>(300);
  const [lastSuccessfulCollection, setLastSuccessfulCollection] = useState<string | null>(null);
  const [lastConfigUpdatedAt, setLastConfigUpdatedAt] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados dos cards de conta
  const [activeModal, setActiveModal] = useState<AccountModalType>(null);
  const [accountToast, setAccountToast] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Email
  const [currentEmail, setCurrentEmail] = useState('contato@greener.io');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmailPassword, setConfirmEmailPassword] = useState('');

  // Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [lastPasswordUpdate, setLastPasswordUpdate] = useState('12/10/2026');

  // 2FA
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [pending2FAState, setPending2FAState] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Backup
  const [lastBackupDate, setLastBackupDate] = useState('17/10/2026 às 14:32');

  const fetchIntervalsAndStatus = useCallback(async () => {
    setIsLoadingConfig(true);
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('token');

    try {
      const [statusRes, configRes] = await Promise.all([
        fetch(`${API_BASE_URL}/coleta/status`).catch(() => null),
        token
          ? fetch(`${API_BASE_URL}/coleta/configuracao`, {
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (statusRes?.ok) {
        const statusData = (await statusRes.json()) as {
          intervaloConfiguradoSegundos?: number;
          intervaloAtualizacaoSegundos?: number;
          ultimaExecucao?: string | null;
        };

        if (statusData.ultimaExecucao) {
          setLastSuccessfulCollection(statusData.ultimaExecucao);
        }

        if (
          typeof statusData.intervaloConfiguradoSegundos === 'number' &&
          typeof statusData.intervaloAtualizacaoSegundos === 'number'
        ) {
          const next = {
            collectionInterval: statusData.intervaloConfiguradoSegundos,
            refreshInterval: statusData.intervaloAtualizacaoSegundos,
          };
          setSavedConfig(next);
          setCollectionInterval(next.collectionInterval);
          setRefreshInterval(next.refreshInterval);
        }
      }

      if (configRes?.ok) {
        const configData = (await configRes.json()) as {
          intervalo_coleta_segundos?: number;
          intervalo_atualizacao_segundos?: number;
          atualizado_em?: string | null;
        };

        if (
          typeof configData.intervalo_coleta_segundos === 'number' &&
          typeof configData.intervalo_atualizacao_segundos === 'number'
        ) {
          const next = {
            collectionInterval: configData.intervalo_coleta_segundos,
            refreshInterval: configData.intervalo_atualizacao_segundos,
          };
          setSavedConfig(next);
          setCollectionInterval(next.collectionInterval);
          setRefreshInterval(next.refreshInterval);
        }

        if (configData.atualizado_em) {
          setLastConfigUpdatedAt(configData.atualizado_em);
        }
      }
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchIntervalsAndStatus();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchIntervalsAndStatus]);

  const showToast = (msg: string) => {
    setAccountToast(msg);
    setTimeout(() => setAccountToast(null), 3500);
  };

  const openModal = (type: AccountModalType) => {
    setModalError(null);
    if (type === 'email') {
      setNewEmail('');
      setConfirmEmailPassword('');
    }
    if (type === 'password') {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswords(false);
    }
    if (type === '2fa') {
      setPending2FAState(is2FAEnabled);
      setOtpCode('');
    }
    setActiveModal(type);
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmed = newEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setModalError('Informe um endereço de e-mail válido.');
      return;
    }
    if (trimmed.toLowerCase() === currentEmail.toLowerCase()) {
      setModalError('O novo e-mail deve ser diferente do atual.');
      return;
    }
    if (confirmEmailPassword.length < 4) {
      setModalError('Confirme sua senha atual para salvar a alteração.');
      return;
    }

    setCurrentEmail(trimmed);
    setActiveModal(null);
    showToast(`E-mail atualizado para ${trimmed}.`);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!currentPassword) {
      setModalError('Digite sua senha atual.');
      return;
    }
    if (newPassword.length < 8) {
      setModalError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setModalError('A confirmação da nova senha não coincide.');
      return;
    }

    const today = new Intl.DateTimeFormat('pt-BR').format(new Date());
    setLastPasswordUpdate(today);
    setActiveModal(null);
    showToast('Senha alterada com sucesso.');
  };

  const handleSave2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (pending2FAState && !is2FAEnabled) {
      if (!/^\d{6}$/.test(otpCode.trim())) {
        setModalError('Digite o código de 6 dígitos do aplicativo autenticador.');
        return;
      }
    }

    setIs2FAEnabled(pending2FAState);
    setActiveModal(null);
    showToast(
      pending2FAState
        ? 'Verificação em duas etapas ativada com sucesso.'
        : 'Verificação em duas etapas desativada.'
    );
  };

  const handleRunBackup = () => {
    const now = new Date();
    const formattedDate = `${new Intl.DateTimeFormat('pt-BR').format(now)} às ${new Intl.DateTimeFormat(
      'pt-BR',
      { hour: '2-digit', minute: '2-digit' }
    ).format(now)}`;

    const backupPayload = {
      plataforma: 'GreenER',
      geradoEm: now.toISOString(),
      conta: {
        email: currentEmail,
        autenticacaoDuasEtapas: is2FAEnabled,
      },
      monitoramento: {
        intervaloColetaSegundos: savedConfig.collectionInterval,
        intervaloAtualizacaoSegundos: savedConfig.refreshInterval,
        ultimaColetaBemSucedida: lastSuccessfulCollection,
        servicos: services,
      },
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `greener-backup-${now.toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setLastBackupDate(formattedDate);
    setActiveModal(null);
    showToast('Backup gerado e baixado com sucesso.');
  };

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.map((srv) => (srv.id === id ? { ...srv, enabled: !srv.enabled } : srv))
    );
  };

  const handleDiscoverServices = async () => {
    setIsDiscovering(true);
    try {
      const response = await fetch(`${API_BASE_URL}/coleta/executar`, { method: 'POST' });
      if (response.ok) {
        await fetchIntervalsAndStatus();
        showToast('Ciclo de coleta executado e status atualizado.');
      }
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSaveIntervals = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const allowedValues = INTERVAL_OPTIONS.map((opt) => opt.value);
    if (!allowedValues.includes(collectionInterval) || !allowedValues.includes(refreshInterval)) {
      setCollectionInterval(savedConfig.collectionInterval);
      setRefreshInterval(savedConfig.refreshInterval);
      setFeedback({
        type: 'error',
        message: 'Intervalo inválido fora das opções permitidas. A configuração anterior foi mantida.',
      });
      return;
    }

    setIsSaving(true);
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('access_token');

    try {
      const response = await fetch(`${API_BASE_URL}/coleta/configuracao`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          intervalo_coleta_segundos: collectionInterval,
          intervalo_atualizacao_segundos: refreshInterval,
        }),
      });

      if (response.ok) {
        const updated = (await response.json()) as {
          intervalo_coleta_segundos: number;
          intervalo_atualizacao_segundos: number;
          atualizado_em?: string | null;
        };

        setSavedConfig({
          collectionInterval: updated.intervalo_coleta_segundos,
          refreshInterval: updated.intervalo_atualizacao_segundos,
        });
        if (updated.atualizado_em) {
          setLastConfigUpdatedAt(updated.atualizado_em);
        }
        setFeedback({
          type: 'success',
          message: 'Intervalos de coleta e atualização salvos e aplicados ao coletor com sucesso.',
        });
      } else if (response.status === 401 || response.status === 403) {
        setCollectionInterval(savedConfig.collectionInterval);
        setRefreshInterval(savedConfig.refreshInterval);
        setFeedback({
          type: 'error',
          message: 'Permissão de administrador necessária para alterar os intervalos no servidor. A configuração anterior foi mantida.',
        });
      } else {
        setCollectionInterval(savedConfig.collectionInterval);
        setRefreshInterval(savedConfig.refreshInterval);
        setFeedback({
          type: 'error',
          message: 'Falha ao salvar intervalos no servidor. A configuração anterior foi mantida.',
        });
      }
    } catch {
      setCollectionInterval(savedConfig.collectionInterval);
      setRefreshInterval(savedConfig.refreshInterval);
      setFeedback({
        type: 'error',
        message: 'Não foi possível conectar ao servidor para salvar os intervalos. A configuração anterior foi mantida.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const accountCards: {
    id: Exclude<AccountModalType, null>;
    title: string;
    desc: string;
    badge?: string;
  }[] = [
    {
      id: 'email',
      title: 'Email',
      desc: `Verifique seu email ou faça alterações · Atual: ${currentEmail}`,
    },
    {
      id: 'password',
      title: 'Senha',
      desc: `Cheque sua senha ou faça alterações · Última alteração: ${lastPasswordUpdate}`,
    },
    {
      id: '2fa',
      title: 'Verificação em duas etapas',
      desc: 'Para aumentar a segurança da sua conta faça a verificação em duas etapas.',
      badge: is2FAEnabled ? 'Ativada' : 'Desativada',
    },
    {
      id: 'backup',
      title: 'Backup',
      desc: `Realize backup para não perder nada · Último backup: ${lastBackupDate}`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#07150E] text-[#F7F7F5] p-4 sm:p-6 md:p-8 font-sans pb-24 md:pb-20">
      <div className="w-full max-w-[1280px] space-y-6">
        {/* Cabeçalho */}
        <header>
          <button
            type="button"
            onClick={() => onBack?.()}
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

          <h1 className="text-2xl sm:text-3xl font-bold text-[#F7F7F5] mb-1">
            Gerenciamento de conta
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA89B]">
            Gerencie conta e altere serviços de acordo com sua preferência
          </p>
        </header>

        {/* Toast de confirmação das ações de conta */}
        {accountToast && (
          <div className="p-3 rounded-[8px] bg-[#2FA862]/15 border border-[#2FA862] text-xs font-medium text-[#4ADE80]">
            ✓ {accountToast}
          </div>
        )}

        {/* Bloco 1: Gerenciamento de conta */}
        <section className="space-y-3">
          {accountCards.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openModal(item.id)}
              className="w-full flex items-center justify-between gap-4 px-[18px] py-[14px] rounded-[10px] bg-[#0E2218] hover:bg-[#132E20] border border-[#1B4D3E] hover:border-[#2FA862] focus:outline-none focus:border-[#F7F7F5] transition-all text-left cursor-pointer group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <p className="text-base sm:text-[18px] font-medium text-[#F7F7F5] leading-snug">
                    {item.title}
                  </p>
                  {item.badge && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        is2FAEnabled
                          ? 'bg-[#2FA862]/20 text-[#4ADE80] border-[#2FA862]'
                          : 'bg-[#0B1C12] text-[#8FA89B] border-[#385E47]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#8FA89B] mt-0.5 leading-snug">
                  {item.desc}
                </p>
              </div>

              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 text-[#8FA89B] group-hover:text-[#F7F7F5] group-hover:translate-x-0.5 transition-all"
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
        </section>

        {/* Ação de Logout */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => clearSession()}
            className="px-4 py-2 rounded-lg bg-red-950/40 border border-red-500/50 hover:bg-red-900/60 text-red-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Encerrar sessão
          </button>
        </div>

        {/* Bloco 2: Serviços monitorados e Intervalos (T29.2 / T30) */}
        <section className="bg-[#0E2218] border border-[#1B4D3E] rounded-[10px] p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#F7F7F5]">Serviços monitorados</h2>
              <p className="text-xs text-[#8FA89B]">
                Serviços descobertos no agregador. Escolha o que você quer monitorar
              </p>
            </div>

            {/* Resumo dos intervalos ativos e última atualização bem-sucedida (T29.2/US09) */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-[6px] bg-[#0B1C12] border border-[#1B4D3E] text-[#D4E3DA]">
                Coleta: <strong className="text-[#4ADE80]">{formatIntervalLabel(savedConfig.collectionInterval)}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-[6px] bg-[#0B1C12] border border-[#1B4D3E] text-[#D4E3DA]">
                Interface: <strong className="text-[#4ADE80]">{formatIntervalLabel(savedConfig.refreshInterval)}</strong>
              </span>
            </div>
          </div>

          {/* Lista de serviços */}
          <div className="space-y-2.5">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[8px] bg-[#0B1C12] border border-[#1B4D3E]"
              >
                <div>
                  <p className="text-sm font-medium text-[#F7F7F5]">{service.name}</p>
                  <p className="text-xs text-[#8FA89B]">{service.location}</p>
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

          {/* Descobrir serviços agora + Última atualização bem-sucedida */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1B4D3E]">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-[#F7F7F5]">Descobrir serviços agora</p>
              <p className="text-xs text-[#8FA89B]">
                Última atualização bem-sucedida:{' '}
                <span className="text-[#D4E3DA] font-medium">
                  {isLoadingConfig ? 'Carregando...' : formatDateTimeBR(lastSuccessfulCollection)}
                </span>
              </p>
              {lastConfigUpdatedAt && (
                <p className="text-[11px] text-[#8FA89B]">
                  Intervalos alterados em: {formatDateTimeBR(lastConfigUpdatedAt)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void handleDiscoverServices()}
              disabled={isDiscovering}
              className="w-full sm:w-auto px-4 py-2 rounded-[8px] bg-[#2FA862] hover:bg-[#1F8A4C] border border-[#14C45A] disabled:opacity-50 text-xs font-semibold text-[#F7F7F5] transition-colors cursor-pointer"
            >
              {isDiscovering ? 'Atualizando...' : 'Atualizar lista'}
            </button>
          </div>

          {/* Formulário dos intervalos de monitoramento (T29.2 / T30.1 & T30.2) */}
          <form onSubmit={(e) => void handleSaveIntervals(e)} className="space-y-4 pt-3 border-t border-[#1B4D3E]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label htmlFor="collection-interval" className="text-sm font-medium text-[#F7F7F5] block">
                  Intervalo de coleta dos agentes
                </label>
                <p className="text-xs text-[#8FA89B]">
                  Frequência de leitura de consumo nos servidores (ativo: {formatIntervalLabel(savedConfig.collectionInterval)})
                </p>
              </div>
              <select
                id="collection-interval"
                value={collectionInterval}
                onChange={(e) => setCollectionInterval(Number(e.target.value))}
                className="w-full sm:w-64 px-3 py-2.5 rounded-[8px] bg-[#0B1C12] border border-[#385E47] focus:border-[#F7F7F5] text-xs text-[#F7F7F5] focus:outline-none cursor-pointer"
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
                <label htmlFor="refresh-interval" className="text-sm font-medium text-[#F7F7F5] block">
                  Mudar tempo de atualização
                </label>
                <p className="text-xs text-[#8FA89B]">
                  Tempo de atualização automática da interface (ativo: {formatIntervalLabel(savedConfig.refreshInterval)})
                </p>
              </div>
              <select
                id="refresh-interval"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="w-full sm:w-64 px-3 py-2.5 rounded-[8px] bg-[#0B1C12] border border-[#385E47] focus:border-[#F7F7F5] text-xs text-[#F7F7F5] focus:outline-none cursor-pointer"
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
                className={`p-3 rounded-[8px] text-xs font-medium border ${
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
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-[8px] bg-[#2FA862] hover:bg-[#1F8A4C] border border-[#14C45A] disabled:opacity-50 text-xs font-semibold text-[#F7F7F5] transition-colors cursor-pointer"
              >
                {isSaving ? 'Salvando...' : 'Salvar intervalos'}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Modais de ação para Email, Senha, 2FA e Backup */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0E2218] border-2 border-[#385E47] rounded-2xl p-5 sm:p-6 shadow-2xl"
          >
            {/* Modal: Email */}
            {activeModal === 'email' && (
              <form onSubmit={handleSaveEmail} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#F7F7F5]">Alterar e-mail</h2>
                  <p className="text-xs text-[#8FA89B] mt-0.5">
                    E-mail atual: <span className="text-[#F7F7F5] font-medium">{currentEmail}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D4E3DA] mb-1">
                    Novo endereço de e-mail
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="novo.email@empresa.com"
                    className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#0B1C12] border border-[#385E47] focus:border-[#F7F7F5] text-xs sm:text-sm text-[#F7F7F5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D4E3DA] mb-1">
                    Senha atual para confirmar
                  </label>
                  <input
                    type="password"
                    value={confirmEmailPassword}
                    onChange={(e) => setConfirmEmailPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#0B1C12] border border-[#385E47] focus:border-[#F7F7F5] text-xs sm:text-sm text-[#F7F7F5] focus:outline-none"
                  />
                </div>

                {modalError && (
                  <p className="text-xs text-red-300 bg-[#A42F2F]/20 border border-[#A42F2F] rounded-[8px] px-3 py-2">
                    {modalError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-[8px] bg-[#0B1C12] border border-[#385E47] text-xs sm:text-sm text-[#F7F7F5] hover:bg-[#132E20] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-[8px] bg-[#2FA862] border border-[#14C45A] text-xs sm:text-sm font-semibold text-[#F7F7F5] hover:bg-[#1F8A4C] cursor-pointer"
                  >
                    Salvar e-mail
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Senha */}
            {activeModal === 'password' && (
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-[#F7F7F5]">Alterar senha</h2>
                    <p className="text-xs text-[#8FA89B] mt-0.5">
                      Use ao menos 8 caracteres combinando letras e números.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => !prev)}
                    className="text-xs text-[#2FA862] hover:underline cursor-pointer shrink-0"
                  >
                    {showPasswords ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D4E3DA] mb-1">
                    Senha atual
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#0B1C12] border border-[#385E47] focus:border-[#F7F7F5] text-xs sm:text-sm text-[#F7F7F5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D4E3DA] mb-1">
                    Nova senha
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo de 8 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#0B1C12] border border-[#385E47] focus:border-[#F7F7F5] text-xs sm:text-sm text-[#F7F7F5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D4E3DA] mb-1">
                    Confirmar nova senha
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#0B1C12] border border-[#385E47] focus:border-[#F7F7F5] text-xs sm:text-sm text-[#F7F7F5] focus:outline-none"
                  />
                </div>

                {modalError && (
                  <p className="text-xs text-red-300 bg-[#A42F2F]/20 border border-[#A42F2F] rounded-[8px] px-3 py-2">
                    {modalError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-[8px] bg-[#0B1C12] border border-[#385E47] text-xs sm:text-sm text-[#F7F7F5] hover:bg-[#132E20] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-[8px] bg-[#2FA862] border border-[#14C45A] text-xs sm:text-sm font-semibold text-[#F7F7F5] hover:bg-[#1F8A4C] cursor-pointer"
                  >
                    Atualizar senha
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Verificação em duas etapas */}
            {activeModal === '2fa' && (
              <form onSubmit={handleSave2FA} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#F7F7F5]">Verificação em duas etapas</h2>
                  <p className="text-xs text-[#8FA89B] mt-0.5">
                    Proteja o acesso ao painel com um código temporário gerado no seu autenticador.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 p-3.5 rounded-[8px] bg-[#0B1C12] border border-[#1B4D3E]">
                  <div>
                    <p className="text-sm font-medium text-[#F7F7F5]">Autenticação em 2 fatores</p>
                    <p className="text-xs text-[#8FA89B]">
                      {pending2FAState ? 'Ativada para este perfil' : 'Desativada no momento'}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={pending2FAState}
                    onChange={() => {
                      setPending2FAState((prev) => !prev);
                      setModalError(null);
                    }}
                    ariaLabel="Ativar ou desativar verificação em duas etapas"
                  />
                </div>

                {pending2FAState && !is2FAEnabled && (
                  <div className="space-y-3 p-3.5 rounded-[8px] bg-[#0B1C12] border border-[#1B4D3E]">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#8FA89B]">
                        Chave de configuração manual
                      </p>
                      <p className="mt-1 font-mono text-xs sm:text-sm font-semibold text-[#4ADE80] select-all">
                        GRNR-404N-OTFD-2026
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#D4E3DA] mb-1">
                        Código de verificação (6 dígitos)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full px-3.5 py-2 rounded-[8px] bg-[#07150E] border border-[#385E47] focus:border-[#F7F7F5] font-mono text-sm tracking-widest text-[#F7F7F5] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {modalError && (
                  <p className="text-xs text-red-300 bg-[#A42F2F]/20 border border-[#A42F2F] rounded-[8px] px-3 py-2">
                    {modalError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-[8px] bg-[#0B1C12] border border-[#385E47] text-xs sm:text-sm text-[#F7F7F5] hover:bg-[#132E20] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-[8px] bg-[#2FA862] border border-[#14C45A] text-xs sm:text-sm font-semibold text-[#F7F7F5] hover:bg-[#1F8A4C] cursor-pointer"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Backup */}
            {activeModal === 'backup' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#F7F7F5]">Backup das configurações</h2>
                  <p className="text-xs text-[#8FA89B] mt-0.5">
                    Exporte uma cópia de segurança com seus serviços monitorados, intervalos de coleta e parâmetros da conta.
                  </p>
                </div>

                <div className="p-3.5 rounded-[8px] bg-[#0B1C12] border border-[#1B4D3E] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8FA89B]">Último backup realizado:</span>
                    <span className="text-[#F7F7F5] font-medium">{lastBackupDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8FA89B]">Serviços incluídos:</span>
                    <span className="text-[#F7F7F5] font-medium">{services.length} serviços</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8FA89B]">Formato do arquivo:</span>
                    <span className="text-[#4ADE80] font-medium">JSON (.json)</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-[8px] bg-[#0B1C12] border border-[#385E47] text-xs sm:text-sm text-[#F7F7F5] hover:bg-[#132E20] cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleRunBackup}
                    className="px-4 py-2 rounded-[8px] bg-[#2FA862] border border-[#14C45A] text-xs sm:text-sm font-semibold text-[#F7F7F5] hover:bg-[#1F8A4C] cursor-pointer"
                  >
                    Fazer backup agora
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};