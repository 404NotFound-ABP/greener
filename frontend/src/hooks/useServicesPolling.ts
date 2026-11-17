import { useState, useEffect, useCallback } from 'react';
import type { ServiceData } from '../types/service';
import {
  defaultServiceRepository,
  type ServiceRepository
} from '../adapters/serviceAdapter';

const POLLING_INTERVAL_MS = 5000;
const STALE_THRESHOLD_MS = 15000;

const formatTimeHHMMSS = (timestamp: number = Date.now()): string => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export interface UseServicesPollingOptions {
  repository?: ServiceRepository;
  initialServices?: ServiceData[];
}

export interface UseServicesPollingResult {
  services: ServiceData[];
  lastUpdate: string;
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
    valores: { kwh: 100, gco2e: 45 }
  },
  {
    id: '2',
    nome: 'Serviço',
    status: 'Indisponível',
    localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Caçapava' },
    valores: { kwh: 100, gco2e: 0 }
  },
  {
    id: '3',
    nome: 'ASTAH-STU',
    status: 'Sem métrica',
    localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Taubaté' },
    valores: { kwh: 100, gco2e: 32 }
  }
];

/**
 * Hook responsável exclusivamente pelo ciclo de atualização periódica,
 * detecção de dados antigos e recuperação após falha (SRP + DIP).
 */
export function useServicesPolling({
  repository = defaultServiceRepository,
  initialServices = FALLBACK_INITIAL_SERVICES
}: UseServicesPollingOptions = {}): UseServicesPollingResult {
  const [services, setServices] = useState<ServiceData[]>(initialServices);
  const [isPaused, setIsPaused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [lastSuccessTime, setLastSuccessTime] = useState<number>(() => Date.now());
  const [lastUpdate, setLastUpdate] = useState<string>(() => formatTimeHHMMSS());
  const [hasError, setHasError] = useState(false);
  const [isStale, setIsStale] = useState(false);

  const triggerRefresh = useCallback(async () => {
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
  }, [repository]);

  useEffect(() => {
    if (isPaused) return;

    const intervalId = window.setInterval(() => {
      void triggerRefresh();
    }, POLLING_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isPaused, triggerRefresh, lastSuccessTime]);

  useEffect(() => {
    const staleChecker = window.setInterval(() => {
      if (Date.now() - lastSuccessTime > STALE_THRESHOLD_MS) {
        setIsStale(true);
      }
    }, 2000);

    return () => window.clearInterval(staleChecker);
  }, [lastSuccessTime]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  return {
    services,
    lastUpdate,
    isPaused,
    isRefreshing,
    hasError,
    isStale,
    togglePause,
    triggerRefresh
  };
}