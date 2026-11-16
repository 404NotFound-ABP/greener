import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { InternalServerErrorException } from '@nestjs/common';
import type { DrizzleDB } from '@/database';
import * as schema from '@/database/schema';
import type { CarbonService } from '@/module/carbon/carbon.service';
import type { ServidorMetricsData, ServidorResponse } from '@/module/interface/servidor.interface';
import type { ServidoresService } from '@/module/servidores/servidores.service';

const carregarAmbiente = jest.fn(() => {
  throw new Error('Teste unitário não deve carregar o .env.');
});

jest.unstable_mockModule('dotenv', () => ({
  config: carregarAmbiente,
  default: { config: carregarAmbiente },
}));

jest.unstable_mockModule('@/database', () => ({
  DRIZZLE_PROVIDER: 'DRIZZLE_DATABASE',
  schema,
}));

const { ImpactService } = await import('./impact.service');

function criarServidor(): ServidorResponse {
  return {
    id: 'servico-1', name: 'Serviço 1', metrics_path: '/metrics/servico-1',
    location: {
      region_code: 'br-sudeste', country: 'Brasil', region: 'Sudeste',
      city: 'São Paulo', latitude: -23.55, longitude: -46.63,
    },
  };
}

describe('ImpactService — estados do monitoramento', () => {
  let consultarMetricas: jest.MockedFunction<ServidoresService['metricsServidor']>;
  let service: InstanceType<typeof ImpactService>;

  beforeEach(() => {
    consultarMetricas = jest.fn<ServidoresService['metricsServidor']>();
    const servidores = {
      servidorById: jest.fn<ServidoresService['servidorById']>()
        .mockResolvedValue(criarServidor()),
      metricsServidor: consultarMetricas,
    } as unknown as ServidoresService;
    const carbono = {
      getCarbonIntensityById: jest.fn<CarbonService['getCarbonIntensityById']>()
        .mockResolvedValue({
          region_code: 'br-sudeste', country: 'Brasil', region: 'Sudeste',
          city: 'São Paulo', carbon_intensity_gco2e_per_kwh: 400,
          renewable_share_percent: 70,
        }),
    } as unknown as CarbonService;
    service = new ImpactService(servidores, carbono, {} as DrizzleDB);
  });

  afterEach(() => {
    expect(carregarAmbiente).not.toHaveBeenCalled();
  });

  it('classifica falha da consulta de métricas como indisponível', async () => {
    // Arrange
    consultarMetricas.mockRejectedValue(new InternalServerErrorException('API indisponível'));

    // Act
    const resultado = await service.calcularImpactoPorServidor('servico-1');

    // Assert
    expect(resultado).toMatchObject({
      servidor_id: 'servico-1', status: 'indisponivel', metricas: null, impacto: null,
    });
  });

  it('classifica serviço ativo que responde sem métricas como sem_metricas (#119)', async () => {
    // Arrange
    consultarMetricas.mockResolvedValue({
      collection_interval_seconds: 30,
      metrics: null,
    } as unknown as ServidorMetricsData);

    // Act
    const resultado = await service.calcularImpactoPorServidor('servico-1');

    // Assert
    expect(resultado).toMatchObject({
      servidor_id: 'servico-1', status: 'sem_metricas', metricas: null, impacto: null,
    });
  });
});
