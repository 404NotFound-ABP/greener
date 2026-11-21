import { useState, useEffect, useCallback } from 'react';
import type { ServiceData } from '../types/service';
import {
  defaultServiceRepository,
  type ServiceRepository
} from '../adapters/serviceAdapter';

const DEFAULT_POLLING_INTERVAL_MS = 300_000; // 5 minutos (padrão do back-end)
const MIN_STALE_THRESHOLD_MS = 15_000;

const formatTimeHHMMSS = (timestamp: number = Date.now()): string => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export function formatIntervalLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) {
    const hours = Math.round(seconds / 3600);
    return hours === 1 ? '1 hora' : `${hours} horas`;
  }
  const days = Math.round(seconds / 86400);
  if (days === 30) return '1 mês (30d)';
  return days === 1 ? '1 dia' : `${days} dias`;
}

export interface UseServicesPollingOptions {
  repository?: ServiceRepository;
  initialServices?: ServiceData[];
  pollingIntervalMs?: number;
  enabled?: boolean;
  loadPollingIntervalFromApi?: boolean;
}

export interface UseServicesPollingResult {
  services: ServiceData[];
  lastUpdate: string;
  lastSuccessTimestamp: number;
  pollingIntervalSeconds: number;
  isPaused: boolean;
  isRefreshing: boolean;
  hasError: boolean;
  isStale: boolean;
  togglePause: () => void;
  triggerRefresh: () => Promise<void>;
}

const FALLBACK_INITIAL_SERVICES: ServiceData[] = [
  {
    id: '1',
    nome: 'Serviço',
    status: 'Ativo',
    localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Caçapava' },
    coords: [-23.1009, -45.7069],
    valores: { kwh: 100, gco2e: 45 }
  },
  {
    id: '2',
    nome: 'Serviço',
    status: 'Indisponível',
    localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Caçapava' },
    coords: [-23.0999, -45.7069],
    valores: { kwh: 100, gco2e: 0 }
  },
  {
    id: '3',
    nome: 'ASTAH-STU',
    status: 'Sem métricas',
    localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Taubaté' },
    coords: [-23.0264, -45.5553],
    valores: { kwh: 100, gco2e: 32 }
  }
];

/**
 * Hook responsável pelo ciclo de atualização periódica,
 * detecção de dados antigos e recuperação após falha (T29.2 / T29.3).
 */
export function useServicesPolling({
  repository = defaultServiceRepository,
  initialServices = FALLBACK_INITIAL_SERVICES,
  pollingIntervalMs,
  enabled = true,
  loadPollingIntervalFromApi = false
}: UseServicesPollingOptions = {}): UseServicesPollingResult {
  const [services, setServices] = useState<ServiceData[]>(initialServices);
  const [configuredIntervalMs, setConfiguredIntervalMs] = useState<number>(DEFAULT_POLLING_INTERVAL_MS);
  const hasExplicitPollingInterval =
    typeof pollingIntervalMs === 'number' && pollingIntervalMs >= 5000;
  const resolvedIntervalMs = hasExplicitPollingInterval
    ? pollingIntervalMs
    : configuredIntervalMs;
  const [isPaused, setIsPaused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [lastSuccessTime, setLastSuccessTime] = useState<number>(() => Date.now());
  const [lastUpdate, setLastUpdate] = useState<string>(() => formatTimeHHMMSS());
  const [hasError, setHasError] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // Sincroniza com o intervalo configurado no back-end (/api/coleta/status) caso não tenha sido passado via prop
  useEffect(() => {
    if (!enabled || !loadPollingIntervalFromApi || hasExplicitPollingInterval) return;

    let isMounted = true;
    const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/+$/, '');

    const loadConfiguredInterval = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/coleta/status`);
        if (!response.ok) return;
        const data = (await response.json()) as {
          intervalo_atualizacao_segundos?: number;
          intervaloAtualizacaoSegundos?: number;
        };
        const configuredIntervalSeconds =
          data.intervalo_atualizacao_segundos ?? data.intervaloAtualizacaoSegundos;
        if (
          isMounted &&
          typeof configuredIntervalSeconds === 'number' &&
          configuredIntervalSeconds >= 5
        ) {
          setConfiguredIntervalMs(configuredIntervalSeconds * 1000);
        }
      } catch {
        // Mantém o intervalo padrão quando o back-end estiver offline
      }
    };

    void loadConfiguredInterval();
    return () => {
      isMounted = false;
    };
  }, [enabled, hasExplicitPollingInterval, loadPollingIntervalFromApi]);

  const triggerRefresh = useCallback(async () => {
    if (!enabled) return;
    setIsRefreshing(true);

    try {
      const freshData = await repository.fetchAll();
      const now = Date.now();

      setServices(freshData);
      setLastSuccessTime(now);
      setLastUpdate(formatTimeHHMMSS(now));
      setHasError(false);
      setIsStale(false);
    } catch {
      // Preserva os últimos dados válidos e sinaliza estado degradado (T29.3)
      setHasError(true);
      setIsStale(true);
    } finally {
      window.setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    }
  }, [enabled, repository]);

  // Executa a coleta inicial assim que o hook é montado
  useEffect(() => {
    if (!enabled) return;
    const timeoutId = window.setTimeout(() => {
      void triggerRefresh();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [enabled, triggerRefresh]);

  useEffect(() => {
    if (!enabled || isPaused) return;

    const intervalId = window.setInterval(() => {
      void triggerRefresh();
    }, resolvedIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, isPaused, triggerRefresh, lastSuccessTime, resolvedIntervalMs]);

  useEffect(() => {
    if (!enabled) return;
    const staleThresholdMs = Math.max(MIN_STALE_THRESHOLD_MS, resolvedIntervalMs * 2);

    const staleChecker = window.setInterval(() => {
      if (Date.now() - lastSuccessTime > staleThresholdMs) {
        setIsStale(true);
      }
    }, 2000);

    return () => window.clearInterval(staleChecker);
  }, [enabled, lastSuccessTime, resolvedIntervalMs]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  return {
    services,
    lastUpdate,
    lastSuccessTimestamp: lastSuccessTime,
    pollingIntervalSeconds: Math.round(resolvedIntervalMs / 1000),
    isPaused,
    isRefreshing,
    hasError,
    isStale,
    togglePause,
    triggerRefresh
  };
}