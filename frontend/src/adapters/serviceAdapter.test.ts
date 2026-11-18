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

  it('inclui coordenadas nos serviços de demonstração do mapa', async () => {
    const services = await new MockServiceRepository().fetchAll();

    expect(services).toHaveLength(3);
    expect(services.every(item => item.coords)).toBe(true);
  });
});
