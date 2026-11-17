import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { HttpService } from '@nestjs/axios';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { config } from '@/config/config';
import type { DrizzleDB } from '@/database';
import * as schema from '@/database/schema';
import type {
  ServidorMetricsData,
  ServidorResponse,
} from '@/module/interface/servidor.interface';

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

const { ServidoresService } = await import('./servidores.service');

type Buscar = (url: string) => Promise<{ data: unknown }>;

function criarServidor(id: string): ServidorResponse {
  return {
    id,
    name: `Servidor ${id}`,
    metrics_path: `/metrics/${id}`,
    location: {
      region_code: 'br-sudeste',
      country: 'Brasil',
      region: 'Sudeste',
      city: 'São Paulo',
      latitude: -23.55,
      longitude: -46.63,
    },
  };
}

function criarMetricas(): ServidorMetricsData {
  return {
    collection_interval_seconds: 30,
    metrics: { cpu_percent: 40, memory_gb: 4, disk_gb: 20, network_gb: 1 },
  };
}

function prepararService() {
  const buscar = jest.fn<Buscar>();
  const http = { axiosRef: { get: buscar } } as unknown as HttpService;
  const service = new ServidoresService(http, {} as DrizzleDB);

  return { buscar, service };
}

describe('ServidoresService.listServidores', () => {
  let buscar: jest.MockedFunction<Buscar>;
  let service: InstanceType<typeof ServidoresService>;

  beforeEach(() => {
    ({ buscar, service } = prepararService());
  });

  afterEach(() => {
    expect(carregarAmbiente).not.toHaveBeenCalled();
  });

  it('retorna os serviços recebidos da API externa', async () => {
    // Arrange
    const servidores = [criarServidor('servico-1'), criarServidor('servico-2')];
    buscar.mockResolvedValue({ data: servidores });

    // Act
    const resultado = await service.listServidores();

    // Assert
    expect(resultado).toEqual(servidores);
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(buscar).toHaveBeenCalledWith(`${config.URL_METRICS}/services`);
  });

  it.each([
    { descricao: 'lista vazia', dados: [] as ServidorResponse[] },
    { descricao: 'resposta nula', dados: null },
  ])('retorna [] quando a API envia $descricao', async ({ dados }) => {
    // Arrange
    buscar.mockResolvedValue({ data: dados });

    // Act
    const resultado = await service.listServidores();

    // Assert
    expect(resultado).toEqual([]);
    expect(buscar).toHaveBeenCalledWith(`${config.URL_METRICS}/services`);
  });

  it('registra a falha da API e retorna erro interno', async () => {
    // Arrange
    const erroExterno = new Error('tempo limite esgotado');
    const registrarErro = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    buscar.mockRejectedValue(erroExterno);

    // Act
    const resultado = service.listServidores().catch((erro: unknown) => erro);
    const erro = await resultado;

    // Assert
    expect(erro).toBeInstanceOf(InternalServerErrorException);
    expect((erro as Error).message).toBe('Erro ao buscar servidores na API de métricas');
    expect(registrarErro).toHaveBeenCalledWith(
      'Erro ao listar servidores na API externa:',
      erroExterno.message,
    );
    expect(buscar).toHaveBeenCalledWith(`${config.URL_METRICS}/services`);
  });
});

describe('ServidoresService.servidorById', () => {
  let buscar: jest.MockedFunction<Buscar>;
  let service: InstanceType<typeof ServidoresService>;

  beforeEach(() => {
    ({ buscar, service } = prepararService());
  });

  it('retorna o serviço solicitado pelo ID', async () => {
    // Arrange
    const servidor = criarServidor('servico-1');
    buscar.mockResolvedValue({ data: servidor });

    // Act
    const resultado = await service.servidorById(servidor.id);

    // Assert
    expect(resultado).toEqual(servidor);
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(buscar).toHaveBeenCalledWith(`${config.URL_METRICS}/services/servico-1`);
  });

  it('retorna 404 quando o ID não existe', async () => {
    // Arrange
    buscar.mockRejectedValue({ response: { status: 404 } });

    // Act
    const erro = await service.servidorById('ausente').catch((falha: unknown) => falha);

    // Assert
    expect(erro).toBeInstanceOf(NotFoundException);
    expect((erro as Error).message).toContain("Servidor com ID 'ausente' não encontrado");
    expect(buscar).toHaveBeenCalledWith(`${config.URL_METRICS}/services/ausente`);
  });

  it('retorna erro interno quando a API falha por outro motivo', async () => {
    // Arrange
    buscar.mockRejectedValue(new Error('conexão interrompida'));

    // Act
    const erro = await service.servidorById('servico-1').catch((falha: unknown) => falha);

    // Assert
    expect(erro).toBeInstanceOf(InternalServerErrorException);
    expect((erro as Error).message).toBe('Erro ao consultar o servidor');
  });
});

describe('ServidoresService.metricsServidor', () => {
  let buscar: jest.MockedFunction<Buscar>;
  let service: InstanceType<typeof ServidoresService>;

  beforeEach(() => {
    ({ buscar, service } = prepararService());
  });

  it('retorna as métricas e o intervalo recebidos da API', async () => {
    // Arrange
    const metricas = criarMetricas();
    buscar.mockResolvedValue({ data: metricas });

    // Act
    const resultado = await service.metricsServidor('servico-1');

    // Assert
    expect(resultado).toEqual(metricas);
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(buscar).toHaveBeenCalledWith(`${config.URL_METRICS}/metrics/servico-1`);
  });

  it('retorna 404 quando não há serviço com o ID solicitado', async () => {
    // Arrange
    buscar.mockRejectedValue({ response: { status: 404 } });

    // Act
    const erro = await service.metricsServidor('ausente').catch((falha: unknown) => falha);

    // Assert
    expect(erro).toBeInstanceOf(NotFoundException);
    expect((erro as Error).message).toContain("Servidor com ID 'ausente' não encontrado");
  });

  it('retorna erro de indisponibilidade quando a API responde 500', async () => {
    // Arrange
    buscar.mockRejectedValue({ response: { status: 500 } });

    // Act
    const erro = await service.metricsServidor('servico-1').catch((falha: unknown) => falha);

    // Assert
    expect(erro).toBeInstanceOf(InternalServerErrorException);
    expect((erro as Error).message).toContain("Servidor 'servico-1' está indisponível ou sem métricas");
  });

  it('retorna erro interno quando a consulta de métricas perde a conexão', async () => {
    // Arrange
    buscar.mockRejectedValue(new Error('tempo limite esgotado'));

    // Act
    const erro = await service.metricsServidor('servico-1').catch((falha: unknown) => falha);

    // Assert
    expect(erro).toBeInstanceOf(InternalServerErrorException);
    expect((erro as Error).message).toBe('Erro ao consultar o servidor');
  });
});
