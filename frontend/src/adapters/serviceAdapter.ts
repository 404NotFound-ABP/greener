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
  localizacao?: {
    pais?: string | null;
    regiao?: string | null;
    cidade?: string | null;
  } | null;
  valores?: {
    kwh?: number | null;
    gco2e?: number | null;
  } | null;
}

const sanitizeLocationField = (value?: string | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * Adapter responsável por converter o payload externo no DTO ServiceData,
 * garantindo resiliência contra campos ausentes ou localização incompleta (T23/US10).
 */
export class ServiceAdapter {
  static toDTO(raw: ExternalServicePayload): ServiceData {
    return {
      id: String(raw.id),
      nome: (raw.nome ?? raw.name ?? 'Serviço sem nome').trim(),
      status: normalizeServiceStatus(raw.status),
      localizacao: {
        pais: sanitizeLocationField(raw.localizacao?.pais),
        regiao: sanitizeLocationField(raw.localizacao?.regiao),
        cidade: sanitizeLocationField(raw.localizacao?.cidade)
      },
      valores: {
        kwh: Number(raw.valores?.kwh ?? 0),
        gco2e: Number(raw.valores?.gco2e ?? 0)
      }
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
      const nextKwh = Math.max(10, service.valores.kwh + deltaKwh);
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