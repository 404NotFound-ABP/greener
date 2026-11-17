export type ServiceStatus = 'Ativo' | 'Indisponível' | 'Sem métrica' | 'Sem métricas';

export interface LocationData {
  pais?: string | null;
  regiao?: string | null;
  cidade?: string | null;
}

export interface MetricsData {
  kwh: number;
  gco2e: number;
}

export interface ServiceData {
  id: string;
  nome: string;
  status: ServiceStatus;
  localizacao?: LocationData | null;
  valores: MetricsData;
}