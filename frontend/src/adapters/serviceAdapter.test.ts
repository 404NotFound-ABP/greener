import { describe, expect, it } from 'vitest';
import { MockServiceRepository, ServiceAdapter } from './serviceAdapter';

const service = {
  id: 1,
  nome: 'Serviço',
  status: 'Ativo'
};

describe('ServiceAdapter', () => {
  it('preserva coordenadas recebidas da API', () => {
    expect(ServiceAdapter.toDTO({ ...service, coords: [-23.1, -45.7] }).coords).toEqual([
      -23.1,
      -45.7
    ]);
    expect(
      ServiceAdapter.toDTO({ ...service, latitude: -23.1, longitude: -45.7 }).coords
    ).toEqual([-23.1, -45.7]);
    expect(
      ServiceAdapter.toDTO({
        ...service,
        coordenadas: { latitude: -23.1, longitude: -45.7 }
      }).coords
    ).toEqual([-23.1, -45.7]);
  });

  it('descarta coordenadas inválidas', () => {
    expect(ServiceAdapter.toDTO({ ...service, coords: [123, 456] }).coords).toBeUndefined();
  });

  it('adapta servidores integrados com região, última coleta e estados da API', () => {
    const [ativo, indisponivel, semMetricas] = ServiceAdapter.toDTOList([
      {
        id: 'billing-api',
        nome: 'Billing API',
        status: 'disponivel',
        regiao: {
          pais: 'Brasil',
          regiao: 'Sudeste',
          cidade: 'São Paulo',
          latitude: -23.55,
          longitude: -46.63
        },
        ultima_coleta: {
          coletado_em: '2026-11-19T12:00:00.000Z',
          potencia_watts: 42,
          energia_kwh: 0.02,
          emissoes_gco2e: 1.7
        }
      },
      { id: 'worker', nome: 'Worker', status: 'indisponivel' },
      { id: 'sem-dados', nome: 'Sem dados', status: 'disponivel', ultima_coleta: null }
    ]);

    expect(ativo).toMatchObject({
      id: 'billing-api',
      status: 'Ativo',
      coords: [-23.55, -46.63],
      localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'São Paulo' },
      valores: { kwh: 0.02, gco2e: 1.7 },
      ultimaAtualizacao: '2026-11-19T12:00:00.000Z'
    });
    expect(indisponivel?.status).toBe('Indisponível');
    expect(semMetricas).toMatchObject({
      status: 'Sem métrica',
      valores: { kwh: null, gco2e: null }
    });
  });

  it('inclui coordenadas nos serviços de demonstração do mapa', async () => {
    const services = await new MockServiceRepository().fetchAll();

    expect(services).toHaveLength(3);
    expect(services.every(item => item.coords)).toBe(true);
  });
});
