export type ServiceStatus = 'Ativo' | 'Indisponível' | 'Sem métricas';

export interface LocationData {
  pais: string;
  regiao: string;
  cidade: string;
}

export interface MetricsData {
  kwh: number;
  gco2e: number;
}

export interface ServiceData {
  id: string;
  nome: string;
  status: ServiceStatus;
  localizacao: LocationData;
  valores: MetricsData;
}