export type ServiceStatus = 'Ativo' | 'Indisponível' | 'Sem métrica' | 'Sem métricas';

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

export interface ServiceData {
  id: string;
  nome: string;
  status: ServiceStatus;
  localizacao?: LocationData | null;
  valores: MetricsData;
  periodo?: string;
  estimado?: boolean;
  ultimaAtualizacao?: string;
}