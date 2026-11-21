import { useCallback, useEffect, useRef, useState } from 'react';

export interface DashboardSummary {
  total_servidores: number;
  disponiveis: number;
  indisponiveis: number;
  servidores_com_metricas: number;
  servidores_sem_metricas: number;
  cobertura_parcial: boolean;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  janela_amostragem_segundos: number;
  intervalo_atualizacao_segundos: number;
  consumo_total_acumulado_kwh: number | null;
  emissoes_total_acumuladas_gco2e: number | null;
}

export interface DashboardService {
  id: string;
  nome: string;
  status: string;
  regiao: {
    pais: string;
    regiao?: string | null;
    cidade: string | null;
  } | null;
  ultima_coleta: {
    potencia_watts: number | null;
    energia_kwh: number | null;
    emissoes_gco2e: number | null;
    coletado_em: string;
  } | null;
}

interface DashboardResponse {
  resumo: DashboardSummary;
  servidores: DashboardService[];
}

interface UseDashboardSummaryResult {
  summary: DashboardSummary | null;
  services: DashboardService[];
  isPaused: boolean;
  isRefreshing: boolean;
  isInitialLoad: boolean;
  hasError: boolean;
  isStale: boolean;
  lastUpdate: string;
  pollingIntervalSeconds: number;
  togglePause: () => void;
  triggerRefresh: () => Promise<void>;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/+$/, '');
const DASHBOARD_ENDPOINT = `${API_BASE_URL}/servidores/dashboard`;
const DEFAULT_POLLING_INTERVAL_SECONDS = 300;

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isDashboardService(value: unknown): value is DashboardService {
  if (typeof value !== 'object' || value === null) return false;
  const service = value as Record<string, unknown>;
  if (
    typeof service.id !== 'string' ||
    typeof service.nome !== 'string' ||
    typeof service.status !== 'string'
  ) {
    return false;
  }

  if (service.regiao !== null) {
    if (typeof service.regiao !== 'object' || service.regiao === null) return false;
    const region = service.regiao as Record<string, unknown>;
    if (
      typeof region.pais !== 'string' ||
      (region.regiao !== undefined && region.regiao !== null && typeof region.regiao !== 'string') ||
      (region.cidade !== null && typeof region.cidade !== 'string')
    ) {
      return false;
    }
  }

  if (service.ultima_coleta !== null) {
    if (typeof service.ultima_coleta !== 'object' || service.ultima_coleta === null) return false;
    const collection = service.ultima_coleta as Record<string, unknown>;
    if (
      !isNumberOrNull(collection.potencia_watts) ||
      !isNumberOrNull(collection.energia_kwh) ||
      !isNumberOrNull(collection.emissoes_gco2e) ||
      typeof collection.coletado_em !== 'string'
    ) {
      return false;
    }
  }

  return true;
}

function isDashboardResponse(value: unknown): value is DashboardResponse {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('resumo' in value) ||
    !('servidores' in value) ||
    !Array.isArray(value.servidores) ||
    !value.servidores.every(isDashboardService)
  ) {
    return false;
  }
  const summary = value.resumo;
  if (typeof summary !== 'object' || summary === null) return false;

  const data = summary as Record<string, unknown>;
  return (
    typeof data.total_servidores === 'number' &&
    typeof data.disponiveis === 'number' &&
    typeof data.indisponiveis === 'number' &&
    typeof data.servidores_com_metricas === 'number' &&
    typeof data.servidores_sem_metricas === 'number' &&
    typeof data.cobertura_parcial === 'boolean' &&
    (typeof data.periodo_inicio === 'string' || data.periodo_inicio === null) &&
    (typeof data.periodo_fim === 'string' || data.periodo_fim === null) &&
    typeof data.janela_amostragem_segundos === 'number' &&
    typeof data.intervalo_atualizacao_segundos === 'number' &&
    isNumberOrNull(data.consumo_total_acumulado_kwh) &&
    isNumberOrNull(data.emissoes_total_acumuladas_gco2e)
  );
}

function formatUpdateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp);
}

export function useDashboardSummary(): UseDashboardSummaryResult {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [services, setServices] = useState<DashboardService[]>([]);
  const [pollingIntervalSeconds, setPollingIntervalSeconds] = useState(
    DEFAULT_POLLING_INTERVAL_SECONDS
  );
  const [isPaused, setIsPaused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('—');
  const activeRequest = useRef<AbortController | null>(null);
  const hasSummary = useRef(false);

  const triggerRefresh = useCallback(async () => {
    if (activeRequest.current) return;

    const controller = new AbortController();
    activeRequest.current = controller;
    setIsRefreshing(true);

    try {
      const response = await fetch(DASHBOARD_ENDPOINT, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Erro HTTP ao buscar indicadores: ${response.status}`);
      }

      const payload: unknown = await response.json();
      if (!isDashboardResponse(payload)) {
        throw new Error('Resposta inválida ao buscar indicadores do dashboard');
      }

      setSummary(payload.resumo);
      setServices(payload.servidores);
      hasSummary.current = true;
      if (payload.resumo.intervalo_atualizacao_segundos >= 5) {
        setPollingIntervalSeconds(payload.resumo.intervalo_atualizacao_segundos);
      }
      setLastUpdate(formatUpdateTime(Date.now()));
      setHasError(false);
      setIsStale(false);
    } catch {
      if (!controller.signal.aborted) {
        setHasError(true);
        setIsStale(hasSummary.current);
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        if (!controller.signal.aborted) {
          setIsRefreshing(false);
          setIsInitialLoad(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void triggerRefresh();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [triggerRefresh]);

  useEffect(() => {
    if (isPaused) return;
    const intervalId = window.setInterval(() => {
      void triggerRefresh();
    }, pollingIntervalSeconds * 1000);
    return () => window.clearInterval(intervalId);
  }, [isPaused, pollingIntervalSeconds, triggerRefresh]);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
    },
    []
  );

  const togglePause = useCallback(() => {
    setIsPaused(previous => !previous);
  }, []);

  return {
    summary,
    services,
    isPaused,
    isRefreshing,
    isInitialLoad,
    hasError,
    isStale,
    lastUpdate,
    pollingIntervalSeconds,
    togglePause,
    triggerRefresh
  };
}
