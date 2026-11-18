import type { ServiceStatus } from '../types/service';

export type ServiceFilterKey = 'ativo' | 'indisponível' | 'sem_metricas';

export interface StatusMetadata {
  filterKey: ServiceFilterKey;
  label: ServiceStatus;
}

const STATUS_ALIASES: Record<string, ServiceFilterKey> = {
  ativo: 'ativo',
  indisponível: 'indisponível',
  indisponivel: 'indisponível',
  'sem métrica': 'sem_metricas',
  'sem métricas': 'sem_metricas',
  'sem metrica': 'sem_metricas',
  'sem metricas': 'sem_metricas',
  sem_metricas: 'sem_metricas'
};

export const STATUS_CONFIG: Record<ServiceFilterKey, StatusMetadata> = {
  ativo: {
    filterKey: 'ativo',
    label: 'Ativo'
  },
  indisponível: {
    filterKey: 'indisponível',
    label: 'Indisponível'
  },
  sem_metricas: {
    filterKey: 'sem_metricas',
    label: 'Sem métrica'
  }
};

export function resolveServiceFilterKey(rawStatus: string): ServiceFilterKey {
  const normalized = rawStatus.toLowerCase().trim();
  return STATUS_ALIASES[normalized] ?? 'sem_metricas';
}

export function normalizeServiceStatus(rawStatus?: string): ServiceStatus {
  if (!rawStatus) return 'Sem métrica';
  const key = resolveServiceFilterKey(rawStatus);
  return STATUS_CONFIG[key].label;
}

export function matchesServiceStatus(
  rawStatus: string,
  activeFilters: Record<ServiceFilterKey, boolean>
): boolean {
  const key = resolveServiceFilterKey(rawStatus);
  return Boolean(activeFilters[key]);
}