import type { ServiceData } from '../types/service';
import { normalizeServiceStatus } from '../config/statusConfig';

/**
 * Contrato da camada de acesso a dados (Repository Pattern + DIP).
 * Os componentes e hooks dependem desta abstração, nunca de fetch/mock concreto.
 */
export interface ServiceRepository {
  fetchAll(): Promise<ServiceData[]>;
}

/**
 * Formato bruto esperado da API externa antes da adaptação para o DTO interno.
 */
export interface ExternalServicePayload {
  id: string | number;
  nome?: string;
  name?: string;
  status?: string;
  coords?: [number, number] | null;
  coordenadas?:
    | [number, number]
    | { lat?: number | null; lng?: number | null; latitude?: number | null; longitude?: number | null }
    | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  localizacao?: {
    pais?: string | null;
    regiao?: string | null;
    cidade?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  regiao?: {
    pais?: string | null;
    regiao?: string | null;
    cidade?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  ultima_coleta?: {
    coletado_em?: string | null;
    potencia_watts?: number | null;
    energia_kwh?: number | null;
    emissoes_gco2e?: number | null;
  } | null;
  valores?: {
    kwh?: number | null;
    gco2e?: number | null;
  } | null;
}

function parseMetric(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const sanitizeLocationField = (value?: string | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

function getCoordinates(raw: ExternalServicePayload): [number, number] | undefined {
  let latitude: number | null | undefined;
  let longitude: number | null | undefined;

  if (raw.coords) {
    [latitude, longitude] = raw.coords;
  } else if (Array.isArray(raw.coordenadas)) {
    [latitude, longitude] = raw.coordenadas;
  } else if (raw.coordenadas) {
    latitude = raw.coordenadas.lat ?? raw.coordenadas.latitude;
    longitude = raw.coordenadas.lng ?? raw.coordenadas.longitude;
  } else {
    latitude =
      raw.latitude ??
      raw.lat ??
      raw.localizacao?.latitude ??
      raw.localizacao?.lat ??
      raw.regiao?.latitude;
    longitude =
      raw.longitude ??
      raw.lng ??
      raw.localizacao?.longitude ??
      raw.localizacao?.lng ??
      raw.regiao?.longitude;
  }

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return undefined;
  }

  return [latitude, longitude];
}

/**
 * Adapter responsável por converter o payload externo no DTO ServiceData,
 * garantindo resiliência contra campos ausentes ou localização incompleta (T23/US10).
 */
export class ServiceAdapter {
  static toDTO(raw: ExternalServicePayload): ServiceData {
    const coords = getCoordinates(raw);
    const location = raw.localizacao ?? raw.regiao;
    const hasLatestMetrics = raw.ultima_coleta?.potencia_watts != null;
    const status =
      raw.status?.toLowerCase().trim() === 'disponivel' && !hasLatestMetrics
        ? 'Sem métrica'
        : normalizeServiceStatus(raw.status);

    return {
      id: String(raw.id),
      nome: (raw.nome ?? raw.name ?? 'Serviço sem nome').trim(),
      status,
      ...(coords ? { coords } : {}),
      localizacao: {
        pais: sanitizeLocationField(location?.pais),
        regiao: sanitizeLocationField(location?.regiao),
        cidade: sanitizeLocationField(location?.cidade)
      },
      valores: {
        kwh: parseMetric(raw.valores?.kwh ?? raw.ultima_coleta?.energia_kwh),
        gco2e: parseMetric(raw.valores?.gco2e ?? raw.ultima_coleta?.emissoes_gco2e)
      },
      ...(raw.ultima_coleta?.coletado_em
        ? { ultimaAtualizacao: raw.ultima_coleta.coletado_em }
        : {})
    };
  }

  static toDTOList(rawList: ExternalServicePayload[]): ServiceData[] {
    return rawList.map((item) => ServiceAdapter.toDTO(item));
  }
}

/**
 * Implementação concreta para integração HTTP com o back-end.
 */
export class HttpServiceRepository implements ServiceRepository {
  private readonly endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async fetchAll(): Promise<ServiceData[]> {
    const response = await fetch(this.endpoint);
    if (!response.ok) {
      throw new Error(`Erro HTTP ao buscar serviços: ${response.status}`);
    }
    const payload = (await response.json()) as ExternalServicePayload[];
    return ServiceAdapter.toDTOList(payload);
  }
}

/**
 * Adapter funcional para manter compatibilidade com callbacks simples (ex.: testes de falha).
 */
export class CallbackServiceRepository implements ServiceRepository {
  private readonly fetcher: () => Promise<ServiceData[]>;

  constructor(fetcher: () => Promise<ServiceData[]>) {
    this.fetcher = fetcher;
  }

  async fetchAll(): Promise<ServiceData[]> {
    return this.fetcher();
  }
}

const INITIAL_MOCK_SERVICES: ServiceData[] = [
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
    status: 'Sem métrica',
    localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Taubaté' },
    coords: [-23.0264, -45.5553],
    valores: { kwh: 100, gco2e: 32 }
  }
];

/**
 * Implementação simulada em memória utilizada enquanto a API real não está conectada.
 */
export class MockServiceRepository implements ServiceRepository {
  private currentData: ServiceData[] = INITIAL_MOCK_SERVICES;

  async fetchAll(): Promise<ServiceData[]> {
    await new Promise((resolve) => window.setTimeout(resolve, 150));

    this.currentData = this.currentData.map((service) => {
      if (service.status.toLowerCase().trim() !== 'ativo') {
        return service;
      }
      const deltaKwh = Math.floor(Math.random() * 5) - 2;
      const nextKwh = Math.max(10, (service.valores.kwh ?? 0) + deltaKwh);
      const nextCo2 = Math.max(5, Math.round(nextKwh * 0.45));

      return {
        ...service,
        valores: {
          kwh: nextKwh,
          gco2e: nextCo2
        }
      };
    });

    return this.currentData;
  }
}

export const defaultServiceRepository: ServiceRepository = new MockServiceRepository();