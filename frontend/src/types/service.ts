export type ServiceStatus = 'Ativo' | 'Indisponível' | 'Sem métricas';

export interface LocationData {
  pais?: string | null;
  regiao?: string | null;
  cidade?: string | null;
}

export interface MetricsData {
  kwh: number | null;
  gco2e?: number | null;
  kgco2e?: number | null;
  periodo?: string;
  estimado?: boolean;
}

export interface InfrastructureMetrics {
  cpuPercent?: number | null;
  memoriaGb?: number | null;
  discoGb?: number | null;
  redeGb?: number | null;
}

export interface ServiceData {
  id: string;
  nome: string;
  status: ServiceStatus;
  localizacao?: LocationData | null;
  coords?: [number, number];
  valores: MetricsData;
  infraestrutura?: InfrastructureMetrics;
  periodo?: string;
  estimado?: boolean;
  ultimaAtualizacao?: string;
}