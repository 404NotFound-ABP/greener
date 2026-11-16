import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { HttpService } from '@nestjs/axios';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { config } from '@/config/config';
import type { CarbonIntensityResponse, RegionsResponse } from '@/module/interface/carbon.interface';
import { CarbonService } from './carbon.service';

type Buscar = (url: string) => Promise<{ data: unknown }>;

describe('CarbonService', () => {
  let buscar: jest.MockedFunction<Buscar>;
  let service: CarbonService;

  beforeEach(() => {
    buscar = jest.fn<Buscar>();
    service = new CarbonService({ axiosRef: { get: buscar } } as unknown as HttpService);
  });

  it('retorna o fator de carbono da região solicitada', async () => {
    // Arrange
    const carbono: CarbonIntensityResponse = {
      region_code: 'br-sudeste', country: 'Brasil', region: 'Sudeste',
      city: 'São Paulo', carbon_intensity_gco2e_per_kwh: 400,
      renewable_share_percent: 70,
    };
    buscar.mockResolvedValue({ data: carbono });

    // Act
    const resultado = await service.getCarbonIntensityById('br-sudeste');

    // Assert
    expect(resultado).toEqual(carbono);
    expect(buscar).toHaveBeenCalledWith(
      `${config.URL_CARBON}/regions/br-sudeste/carbon-intensity`,
    );
  });

  it('retorna 404 quando a região não existe', async () => {
    // Arrange
    buscar.mockRejectedValue({ response: { status: 404 } });

    // Act
    const erro = await service.getCarbonIntensityById('ausente').catch((falha: unknown) => falha);

    // Assert
    expect(erro).toBeInstanceOf(NotFoundException);
    expect((erro as Error).message).toContain("Região 'ausente' não encontrada");
  });

  it('retorna erro interno quando a consulta de carbono falha', async () => {
    // Arrange
    buscar.mockRejectedValue(new Error('tempo limite esgotado'));

    // Act
    const erro = await service.getCarbonIntensityById('br-sudeste')
      .catch((falha: unknown) => falha);

    // Assert
    expect(erro).toBeInstanceOf(InternalServerErrorException);
    expect((erro as Error).message).toBe('Erro ao consultar intensidade de carbono');
  });

  it('retorna a lista de regiões, inclusive quando está vazia', async () => {
    // Arrange
    const regioes: RegionsResponse = { regions: [], total: 0 };
    buscar.mockResolvedValue({ data: regioes });

    // Act
    const resultado = await service.getCarbonRegions();

    // Assert
    expect(resultado).toEqual(regioes);
    expect(buscar).toHaveBeenCalledWith(`${config.URL_CARBON}/regions`);
  });

  it('retorna erro interno quando a lista de regiões falha', async () => {
    // Arrange
    buscar.mockRejectedValue(new Error('API indisponível'));

    // Act
    const erro = await service.getCarbonRegions().catch((falha: unknown) => falha);

    // Assert
    expect(erro).toBeInstanceOf(InternalServerErrorException);
    expect((erro as Error).message).toBe('Erro ao listar regiões de carbono');
  });
});
