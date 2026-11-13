import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import type { DrizzleDB } from '@/database';
import * as schema from '@/database/schema';
import type { CarbonService } from '@/module/carbon/carbon.service';
import type { CarbonIntensityResponse } from '@/module/interface/carbon.interface';
import type {
  ServidorMetricsData,
  ServidorResponse,
} from '@/module/interface/servidor.interface';
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

const { CalculadoraImpacto, ImpactService } = await import('./impact.service');

afterEach(() => {
  expect(carregarAmbiente).not.toHaveBeenCalled();
});

function criarServidor(id = 'servidor-1'): ServidorResponse {
  return {
    id,
    name: 'Servidor de exemplo',
    metrics_path: '/metrics/' + id,
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

function criarMetricas(intervalo = 3600): ServidorMetricsData {
  return {
    collection_interval_seconds: intervalo,
    metrics: {
      cpu_percent: 50,
      memory_gb: 4,
      disk_gb: 100,
      network_gb: 10,
    },
  };
}

function criarCarbono(fator = 400): CarbonIntensityResponse {
  return {
    region_code: 'br-sudeste',
    country: 'Brasil',
    region: 'Sudeste',
    city: 'São Paulo',
    carbon_intensity_gco2e_per_kwh: fator,
    renewable_share_percent: 70,
  };
}

function criarRegiaoSalva() {
  return {
    codigo: 'br-sudeste',
    pais: 'Brasil',
    regiao: 'Sudeste',
    cidade: 'São Paulo',
    carbonIntensityGco2eKwh: '400',
    renewableSharePercent: '70',
  };
}

function criarColeta(intervalo = 3600) {
  return {
    servidorId: 'servidor-1',
    cpuPercent: '50',
    memoriaGb: '4',
    discoGb: '100',
    redeGb: '10',
    intervaloSegundos: intervalo,
    carbonIntensityFator: '400',
    coletadoEm: new Date('2026-11-12T12:00:00.000Z'),
  };
}

type LinhaBanco = Record<string, unknown>;

function criarBancoSimulado() {
  const fila: LinhaBanco[][] = [];
  const limit = jest.fn<(quantidade: number) => Promise<LinhaBanco[]>>();
  const orderBy = jest.fn<(ordem: unknown) => { limit: typeof limit }>();
  const where = jest.fn((_condicao: unknown) => {
    const linhas = fila.shift();

    if (linhas === undefined) {
      throw new Error('Consulta ao banco sem resposta preparada no teste.');
    }

    limit.mockImplementation(async (quantidade) => linhas.slice(0, quantidade));
    orderBy.mockImplementation(() => ({ limit }));

    return Object.assign(Promise.resolve(linhas), { limit, orderBy });
  });
  const from = jest.fn((_tabela: unknown) => ({ where }));
  const select = jest.fn((_campos?: unknown) => ({ from }));

  function responderCom(...respostas: LinhaBanco[][]) {
    fila.push(...respostas);
  }

  return {
    db: { select } as unknown as DrizzleDB,
    select,
    from,
    where,
    orderBy,
    limit,
    responderCom,
  };
}

function prepararService() {
  const servidores = {
    servidorById: jest.fn<ServidoresService['servidorById']>()
      .mockResolvedValue(criarServidor()),
    metricsServidor: jest.fn<ServidoresService['metricsServidor']>()
      .mockResolvedValue(criarMetricas()),
    listServidores: jest.fn<ServidoresService['listServidores']>()
      .mockResolvedValue([criarServidor()]),
  };
  const carbono = {
    getCarbonIntensityById: jest.fn<CarbonService['getCarbonIntensityById']>()
      .mockResolvedValue(criarCarbono()),
  };
  const banco = criarBancoSimulado();
  const service = new ImpactService(
    servidores as unknown as ServidoresService,
    carbono as unknown as CarbonService,
    banco.db,
  );

  return { service, servidores, carbono, banco };
}

describe('CalculadoraImpacto.calcular', () => {
  it('calcula potência, energia e emissões', () => {
    // Arrange
    const entrada = [3600, 50, 4, 100, 10, 400] as const;

    // Act
    const resultado = CalculadoraImpacto.calcular(...entrada);

    // Assert
    expect(resultado).toEqual({
      potenciaWatts: 52.7, energiaKwh: 0.0527, emissoesGco2e: 21.08,
    });
  });

  it('não calcula emissões quando não há intensidade de carbono', () => {
    // Arrange
    const entrada = [3600, 50, 4, 100, 10, null] as const;

    // Act
    const resultado = CalculadoraImpacto.calcular(...entrada);

    // Assert
    expect(resultado).toEqual({
      potenciaWatts: 52.7, energiaKwh: 0.0527, emissoesGco2e: null,
    });
  });

  it('reduz energia e emissão pela metade em meia hora', () => {
    // Arrange
    const entrada = [1800, 50, 4, 100, 10, 400] as const;

    // Act
    const resultado = CalculadoraImpacto.calcular(...entrada);

    // Assert
    expect(resultado).toEqual({
      potenciaWatts: 52.7, energiaKwh: 0.02635, emissoesGco2e: 10.54,
    });
  });

  it.each([
    { intervalo: 30, energia: 0.0004392, emissao: 0.1757 },
    { intervalo: 900, energia: 0.013175, emissao: 5.27 },
    { intervalo: 7200, energia: 0.1054, emissao: 42.16 },
  ])('usa o intervalo de $intervalo segundos', ({ intervalo, energia, emissao }) => {
    // Arrange
    const entrada = [intervalo, 50, 4, 100, 10, 400] as const;

    // Act
    const resultado = CalculadoraImpacto.calcular(...entrada);

    // Assert
    expect(resultado).toEqual({
      potenciaWatts: 52.7, energiaKwh: energia, emissoesGco2e: emissao,
    });
  });

  it('arredonda potência, energia e emissão nas precisões definidas', () => {
    // Arrange
    const entrada = [60, 12.34567, 1.234, 2.345, 0.789, 321.123] as const;

    // Act
    const resultado = CalculadoraImpacto.calcular(...entrada);

    // Assert
    expect(resultado).toEqual({
      potenciaWatts: 12.85, energiaKwh: 0.0002141, emissoesGco2e: 0.0688,
    });
  });

  it('retorna zeros legítimos quando todos os recursos medidos são zero', () => {
    // Arrange
    const entrada = [3600, 0, 0, 0, 0, 400] as const;

    // Act
    const resultado = CalculadoraImpacto.calcular(...entrada);

    // Assert
    expect(resultado).toEqual({
      potenciaWatts: 0, energiaKwh: 0, emissoesGco2e: 0,
    });
  });

  it('diferencia fator de carbono zero de fator ausente', () => {
    // Arrange
    const entrada = [3600, 50, 4, 100, 10, 0] as const;

    // Act
    const resultado = CalculadoraImpacto.calcular(...entrada);

    // Assert
    expect(resultado).toEqual({
      potenciaWatts: 52.7, energiaKwh: 0.0527, emissoesGco2e: 0,
    });
  });

  it.each([
    { recurso: 'CPU', cpu: 100, ram: 0, disco: 0, rede: 0, potencia: 100, energia: 0.1, emissao: 40 },
    { recurso: 'memória', cpu: 0, ram: 8, disco: 0, rede: 0, potencia: 3, energia: 0.003, emissao: 1.2 },
    { recurso: 'disco', cpu: 0, ram: 0, disco: 200, rede: 0, potencia: 2, energia: 0.002, emissao: 0.8 },
    { recurso: 'rede', cpu: 0, ram: 0, disco: 0, rede: 50, potencia: 1, energia: 0.001, emissao: 0.4 },
  ])('confere a contribuição isolada de $recurso', (caso) => {
    // Arrange
    const entrada = [3600, caso.cpu, caso.ram, caso.disco, caso.rede, 400] as const;

    // Act
    const resultado = CalculadoraImpacto.calcular(...entrada);

    // Assert
    expect(resultado).toEqual({
      potenciaWatts: caso.potencia, energiaKwh: caso.energia, emissoesGco2e: caso.emissao,
    });
  });
});

describe('CalculadoraImpacto.calcularDiscriminado', () => {
  it('confere os totais, unidades e percentuais de cada recurso', () => {
    // Arrange
    const entrada = [3600, 50, 4, 100, 10, 400] as const;

    // Act
    const resultado = CalculadoraImpacto.calcularDiscriminado(...entrada);

    // Assert
    expect(resultado).toEqual({
      totais: { potencia_watts: 52.7, energia_kwh: 0.0527, emissoes_gco2e: 21.08 },
      discriminacao: {
        cpu: {
          valor_bruto: 50, unidade: '%', potencia_watts: 50,
          energia_kwh: 0.05, emissoes_gco2e: 20, percentual_impacto: 94.88,
        },
        memoria: {
          valor_bruto: 4, unidade: 'GB', potencia_watts: 1.5,
          energia_kwh: 0.0015, emissoes_gco2e: 0.6, percentual_impacto: 2.85,
        },
        disco: {
          valor_bruto: 100, unidade: 'GB', potencia_watts: 1,
          energia_kwh: 0.001, emissoes_gco2e: 0.4, percentual_impacto: 1.9,
        },
        rede: {
          valor_bruto: 10, unidade: 'GB', potencia_watts: 0.2,
          energia_kwh: 0.0002, emissoes_gco2e: 0.08, percentual_impacto: 0.38,
        },
      },
    });
  });

  it.each([
    { recurso: 'cpu' as const, energia: 0.05 },
    { recurso: 'memoria' as const, energia: 0.0015 },
    { recurso: 'disco' as const, energia: 0.001 },
    { recurso: 'rede' as const, energia: 0.0002 },
  ])('mantém a energia de $recurso quando o fator está ausente', ({ recurso, energia }) => {
    // Arrange
    const entrada = [3600, 50, 4, 100, 10, null] as const;

    // Act
    const resultado = CalculadoraImpacto.calcularDiscriminado(...entrada);

    // Assert
    expect(resultado.totais).toEqual({
      potencia_watts: 52.7, energia_kwh: 0.0527, emissoes_gco2e: null,
    });
    expect(resultado.discriminacao[recurso].energia_kwh).toBe(energia);
    expect(resultado.discriminacao[recurso].emissoes_gco2e).toBeNull();
  });

  it('mantém percentuais zerados e números finitos quando os recursos são zero', () => {
    // Arrange
    const entrada = [3600, 0, 0, 0, 0, 400] as const;

    // Act
    const resultado = CalculadoraImpacto.calcularDiscriminado(...entrada);

    // Assert
    expect(resultado.totais).toEqual({ potencia_watts: 0, energia_kwh: 0, emissoes_gco2e: 0 });
    for (const item of Object.values(resultado.discriminacao)) {
      expect(item.potencia_watts).toBe(0);
      expect(item.energia_kwh).toBe(0);
      expect(item.emissoes_gco2e).toBe(0);
      expect(item.percentual_impacto).toBe(0);
    }
  });

  it('aplica o intervalo e o arredondamento também nos itens discriminados', () => {
    // Arrange
    const entrada = [30, 50, 4, 100, 10, 400] as const;

    // Act
    const resultado = CalculadoraImpacto.calcularDiscriminado(...entrada);

    // Assert
    expect(resultado.totais).toEqual({
      potencia_watts: 52.7, energia_kwh: 0.0004392, emissoes_gco2e: 0.1757,
    });
    expect(resultado.discriminacao.cpu).toMatchObject({ energia_kwh: 0.0004167, emissoes_gco2e: 0.1667 });
    expect(resultado.discriminacao.memoria).toMatchObject({ energia_kwh: 0.0000125, emissoes_gco2e: 0.005 });
    expect(resultado.discriminacao.disco).toMatchObject({ energia_kwh: 0.0000083, emissoes_gco2e: 0.0033 });
    expect(resultado.discriminacao.rede).toMatchObject({ energia_kwh: 0.0000017, emissoes_gco2e: 0.0007 });
  });

  it('retorna emissão zero em todos os recursos quando o fator é zero', () => {
    // Arrange
    const entrada = [3600, 50, 4, 100, 10, 0] as const;

    // Act
    const resultado = CalculadoraImpacto.calcularDiscriminado(...entrada);

    // Assert
    expect(resultado.totais.emissoes_gco2e).toBe(0);
    for (const item of Object.values(resultado.discriminacao)) {
      expect(item.emissoes_gco2e).toBe(0);
    }
  });
});

type ContextoImpacto = ReturnType<typeof prepararService>;

describe('ImpactService', () => {
  let service: ContextoImpacto['service'];
  let servidores: ContextoImpacto['servidores'];
  let carbono: ContextoImpacto['carbono'];
  let banco: ContextoImpacto['banco'];

  beforeEach(() => {
    ({ service, servidores, carbono, banco } = prepararService());
  });

  describe('calcularImpactoPorServidor', () => {
    it('usa respostas simuladas e observa a calculadora real com um spy', async () => {
      // Arrange
      const calcular = jest.spyOn(CalculadoraImpacto, 'calcular');

      // Act
      const resultado = await service.calcularImpactoPorServidor('servidor-1');

      // Assert
      expect(resultado).toMatchObject({
        servidor_id: 'servidor-1', status: 'disponivel',
        impacto: { potencia_watts: 52.7, energia_kwh: 0.0527, emissoes_gco2e: 21.08 },
      });
      expect(servidores.servidorById).toHaveBeenCalledTimes(1);
      expect(servidores.servidorById).toHaveBeenCalledWith('servidor-1');
      expect(servidores.metricsServidor).toHaveBeenCalledTimes(1);
      expect(servidores.metricsServidor).toHaveBeenCalledWith('servidor-1');
      expect(carbono.getCarbonIntensityById).toHaveBeenCalledTimes(1);
      expect(carbono.getCarbonIntensityById).toHaveBeenCalledWith('br-sudeste');
      expect(calcular).toHaveBeenCalledTimes(1);
      expect(calcular).toHaveBeenCalledWith(3600, 50, 4, 100, 10, 400);
      expect(banco.select).not.toHaveBeenCalled();
    });

    it('encaminha o intervalo recebido da API para o cálculo', async () => {
      // Arrange
      servidores.metricsServidor.mockResolvedValue(criarMetricas(1800));

      // Act
      const resultado = await service.calcularImpactoPorServidor('servidor-1');

      // Assert
      expect(resultado.metricas?.intervalo_segundos).toBe(1800);
      expect(resultado.impacto).toEqual({
        potencia_watts: 52.7, energia_kwh: 0.02635, emissoes_gco2e: 10.54,
      });
    });

    it('usa a região salva quando a API de carbono falha', async () => {
      // Arrange
      banco.responderCom([criarRegiaoSalva()]);
      carbono.getCarbonIntensityById.mockRejectedValue(new Error('API de carbono indisponível'));

      // Act
      const resultado = await service.calcularImpactoPorServidor('servidor-1');

      // Assert
      expect(resultado.impacto).toEqual({
        potencia_watts: 52.7, energia_kwh: 0.0527, emissoes_gco2e: 21.08,
      });
      expect(banco.from).toHaveBeenCalledTimes(1);
      expect(banco.from).toHaveBeenCalledWith(schema.regioes);
      expect(banco.limit).toHaveBeenCalledTimes(1);
      expect(banco.limit).toHaveBeenCalledWith(1);
    });

    it('preserva a energia sem inventar emissão quando não há carbono nem cache', async () => {
      // Arrange
      banco.responderCom([]);
      carbono.getCarbonIntensityById.mockRejectedValue(new Error('Falha no carbono'));

      // Act
      const resultado = await service.calcularImpactoPorServidor('servidor-1');

      // Assert
      expect(resultado.impacto).toEqual({
        potencia_watts: 52.7, energia_kwh: 0.0527, emissoes_gco2e: null,
      });
    });

    it('aceita um fator de carbono legitimamente zerado', async () => {
      // Arrange
      carbono.getCarbonIntensityById.mockResolvedValue(criarCarbono(0));

      // Act
      const resultado = await service.calcularImpactoPorServidor('servidor-1');

      // Assert
      expect(resultado.impacto).toMatchObject({ energia_kwh: 0.0527, emissoes_gco2e: 0 });
    });

    it('não chama a calculadora quando a consulta de métricas falha', async () => {
      // Arrange
      servidores.metricsServidor.mockRejectedValue(new Error('Sem resposta'));
      const calcular = jest.spyOn(CalculadoraImpacto, 'calcular');

      // Act
      const resultado = await service.calcularImpactoPorServidor('servidor-1');

      // Assert
      expect(resultado).toMatchObject({ status: 'indisponivel', metricas: null, impacto: null });
      expect(calcular).not.toHaveBeenCalled();
    });

    it.each([
      { nome: 'resposta nula', resposta: null },
      { nome: 'resposta ausente', resposta: undefined },
      { nome: 'objeto sem métricas', resposta: { collection_interval_seconds: 3600, metrics: null } },
    ])('não calcula com $nome', async ({ resposta }) => {
      // Arrange
      servidores.metricsServidor.mockResolvedValue(resposta as unknown as ServidorMetricsData);
      const calcular = jest.spyOn(CalculadoraImpacto, 'calcular');

      // Act
      const resultado = await service.calcularImpactoPorServidor('servidor-1');

      // Assert
      expect(resultado.impacto).toBeNull();
      expect(calcular).not.toHaveBeenCalled();
    });

    it('retorna 404 quando o serviço não existe na API nem no banco', async () => {
      // Arrange
      banco.responderCom([]);
      servidores.servidorById.mockRejectedValue(new NotFoundException());

      // Act
      const execucao = service.calcularImpactoPorServidor('inexistente');

      // Assert
      await expect(execucao).rejects.toBeInstanceOf(NotFoundException);
      expect(servidores.metricsServidor).not.toHaveBeenCalled();
      expect(carbono.getCarbonIntensityById).not.toHaveBeenCalled();
    });

    it('preserva o estado removido sem inventar métricas ou impacto', async () => {
      // Arrange
      banco.responderCom(
        [{ id: 'servidor-1', nome: 'Servidor removido', statusAtual: 'removido', ativo: false, codigoRegiao: 'br-sudeste' }],
        [criarRegiaoSalva()],
      );
      servidores.servidorById.mockRejectedValue(new NotFoundException());

      // Act
      const resultado = await service.calcularImpactoPorServidor('servidor-1');

      // Assert
      expect(resultado).toMatchObject({
        servidor_id: 'servidor-1', status: 'removido', metricas: null, impacto: null,
        regiao: { codigo: 'br-sudeste', carbon_intensity_gco2e_kwh: 400 },
      });
      expect(servidores.metricsServidor).not.toHaveBeenCalled();
      expect(carbono.getCarbonIntensityById).not.toHaveBeenCalled();
    });
  });

  describe('calcularImpactoTodos', () => {
    it('retorna lista vazia quando não há serviços', async () => {
      // Arrange
      servidores.listServidores.mockResolvedValue([]);
      const individual = jest.spyOn(service, 'calcularImpactoPorServidor');

      // Act
      const resultado = await service.calcularImpactoTodos();

      // Assert
      expect(resultado).toEqual([]);
      expect(individual).not.toHaveBeenCalled();
    });

    it('continua os cálculos dos demais serviços após uma falha', async () => {
      // Arrange
      const segundo = criarServidor('servidor-2');
      servidores.listServidores.mockResolvedValue([criarServidor(), segundo]);
      const esperado = {
        servidor_id: segundo.id, nome: segundo.name, status: 'disponivel',
        regiao: {
          codigo: 'br-sudeste', pais: 'Brasil', cidade: 'São Paulo',
          carbon_intensity_gco2e_kwh: 400, renewable_share_percent: 70,
        },
        metricas: null,
        impacto: { potencia_watts: 52.7, energia_kwh: 0.0527, emissoes_gco2e: 21.08 },
      };
      const individual = jest.spyOn(service, 'calcularImpactoPorServidor')
        .mockRejectedValueOnce(new Error('Falha no primeiro servidor'))
        .mockResolvedValueOnce(esperado);

      // Act
      const resultado = await service.calcularImpactoTodos();

      // Assert
      expect(resultado).toHaveLength(2);
      expect(resultado[0]).toMatchObject({ servidor_id: 'servidor-1', status: 'indisponivel', impacto: null });
      expect(resultado[1]).toEqual(esperado);
      expect(individual).toHaveBeenCalledTimes(2);
      expect(individual).toHaveBeenNthCalledWith(1, 'servidor-1');
      expect(individual).toHaveBeenNthCalledWith(2, 'servidor-2');
    });

    it('propaga a mesma falha quando não consegue obter a lista de serviços', async () => {
      // Arrange
      const erro = new Error('Lista indisponível');
      servidores.listServidores.mockRejectedValue(erro);

      // Act
      const execucao = service.calcularImpactoTodos();

      // Assert
      await expect(execucao).rejects.toBe(erro);
    });
  });

  describe('calcularImpactoDiscriminadoPorServidor', () => {
    it('retorna o detalhamento em tempo real sem consultar o banco', async () => {
      // Arrange
      const calcular = jest.spyOn(CalculadoraImpacto, 'calcularDiscriminado');

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1');

      // Assert
      expect(resultado).toMatchObject({
        criterio: 'instantaneo', origem: 'tempo_real', intervalo_segundos: 3600,
        totais: { potencia_watts: 52.7, energia_kwh: 0.0527, emissoes_gco2e: 21.08 },
        discriminacao: { cpu: { potencia_watts: 50, energia_kwh: 0.05, emissoes_gco2e: 20 } },
      });
      expect(calcular).toHaveBeenCalledTimes(1);
      expect(calcular).toHaveBeenCalledWith(3600, 50, 4, 100, 10, 400);
      expect(banco.select).not.toHaveBeenCalled();
    });

    it('recupera o fator de carbono da região salva', async () => {
      // Arrange
      banco.responderCom([criarRegiaoSalva()]);
      carbono.getCarbonIntensityById.mockRejectedValue(new Error('Carbono indisponível'));

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1');

      // Assert
      expect(resultado.totais).toEqual({
        potencia_watts: 52.7, energia_kwh: 0.0527, emissoes_gco2e: 21.08,
      });
    });

    it('consulta a última coleta quando falha a obtenção de métricas atuais', async () => {
      // Arrange
      banco.responderCom([criarColeta(30)]);
      servidores.metricsServidor.mockRejectedValue(new Error('Métricas indisponíveis'));

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1');

      // Assert
      expect(resultado).toMatchObject({
        origem: 'banco_historico', intervalo_segundos: 30,
        totais: { potencia_watts: 52.7, energia_kwh: 0.0004392, emissoes_gco2e: 0.1757 },
      });
      expect(banco.from).toHaveBeenCalledTimes(1);
      expect(banco.from).toHaveBeenCalledWith(schema.coletasMetricas);
      expect(banco.orderBy).toHaveBeenCalledTimes(1);
      expect(banco.limit).toHaveBeenCalledWith(1);
    });

    it('retorna cálculos indisponíveis quando não há métricas nem histórico', async () => {
      // Arrange
      banco.responderCom([]);
      servidores.metricsServidor.mockRejectedValue(new Error('Métricas indisponíveis'));

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1');

      // Assert
      expect(resultado.totais).toBeNull();
      expect(resultado.discriminacao).toBeNull();
    });

    it('consulta o histórico de um serviço removido sem pedir métricas atuais', async () => {
      // Arrange
      banco.responderCom(
        [{ id: 'servidor-1', nome: 'Servidor removido', statusAtual: 'removido', ativo: false, codigoRegiao: 'br-sudeste' }],
        [criarColeta(30)],
      );
      servidores.servidorById.mockRejectedValue(new NotFoundException());

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1');

      // Assert
      expect(resultado).toMatchObject({
        status: 'removido', origem: 'banco_historico',
        totais: { energia_kwh: 0.0004392, emissoes_gco2e: 0.1757 },
      });
      expect(servidores.metricsServidor).not.toHaveBeenCalled();
    });

    it('soma as energias e emissões de duas coletas históricas', async () => {
      // Arrange
      banco.responderCom([criarColeta(), criarColeta()]);

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1', 'acumulado');

      // Assert
      expect(resultado).toMatchObject({
        criterio: 'acumulado', origem: 'banco_historico', total_coletas: 2,
        totais: { potencia_watts: 52.7, energia_kwh: 0.1054, emissoes_gco2e: 42.16 },
        discriminacao: {
          cpu: { energia_kwh: 0.1, emissoes_gco2e: 40 },
          memoria: { energia_kwh: 0.003, emissoes_gco2e: 1.2 },
          disco: { energia_kwh: 0.002, emissoes_gco2e: 0.8 },
          rede: { energia_kwh: 0.0004, emissoes_gco2e: 0.16 },
        },
      });
      expect(servidores.metricsServidor).not.toHaveBeenCalled();
    });

    it('usa intervalos diferentes de cada coleta no cálculo acumulado', async () => {
      // Arrange
      banco.responderCom([criarColeta(1800), criarColeta(7200)]);

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1', 'acumulado');

      // Assert
      expect(resultado.totais).toEqual({
        potencia_watts: 52.7, energia_kwh: 0.13175, emissoes_gco2e: 52.7,
      });
    });

    it('usa os fatores históricos de cada coleta em vez do fator atual', async () => {
      // Arrange
      banco.responderCom([
        { ...criarColeta(), carbonIntensityFator: '100' }, criarColeta(),
      ]);
      carbono.getCarbonIntensityById.mockResolvedValue(criarCarbono(999));

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1', 'acumulado');

      // Assert
      expect(resultado.totais).toEqual({
        potencia_watts: 52.7, energia_kwh: 0.1054, emissoes_gco2e: 26.35,
      });
    });

    it('retorna 404 quando o serviço não existe em nenhuma origem', async () => {
      // Arrange
      banco.responderCom([]);
      servidores.servidorById.mockRejectedValue(new NotFoundException());

      // Act
      const execucao = service.calcularImpactoDiscriminadoPorServidor('inexistente');

      // Assert
      await expect(execucao).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('Regressões da #121 — intervalo real da última coleta', () => {
    it.each([
      { intervalo: 1800, energia: 0.02635, emissao: 10.54 },
      { intervalo: 7200, energia: 0.1054, emissao: 42.16 },
    ])('preserva os $intervalo segundos da coleta salva', async ({ intervalo, energia, emissao }) => {
      // Arrange
      banco.responderCom([criarColeta(intervalo)]);
      servidores.metricsServidor.mockRejectedValue(new Error('API indisponível'));

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1');

      // Assert
      expect(resultado).toMatchObject({
        origem: 'banco_historico', intervalo_segundos: intervalo,
        totais: { energia_kwh: energia, emissoes_gco2e: emissao },
      });
    });
  });

  describe('Regressões da #122 — dados insuficientes não são zero', () => {
    it('mantém energia e emissão nula no detalhamento sem carbono nem cache', async () => {
      // Arrange
      banco.responderCom([]);
      carbono.getCarbonIntensityById.mockRejectedValue(new Error('Carbono indisponível'));

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1');

      // Assert
      expect(resultado.totais?.energia_kwh).toBe(0.0527);
      expect(resultado.totais?.emissoes_gco2e).toBeNull();
    });

    it('não transforma a falta do fator histórico e regional em emissão zero', async () => {
      // Arrange
      banco.responderCom(
        [], [{ ...criarColeta(30), carbonIntensityFator: null }],
      );
      carbono.getCarbonIntensityById.mockRejectedValue(new Error('Carbono indisponível'));
      servidores.metricsServidor.mockRejectedValue(new Error('Métricas indisponíveis'));

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1');

      // Assert
      expect(resultado.totais?.energia_kwh).toBe(0.0004392);
      expect(resultado.totais?.emissoes_gco2e).toBeNull();
    });

    it('preserva emissão indisponível no acumulado quando todos os fatores estão ausentes', async () => {
      // Arrange
      banco.responderCom(
        [], [{ ...criarColeta(), carbonIntensityFator: null }],
      );
      carbono.getCarbonIntensityById.mockRejectedValue(new Error('Carbono indisponível'));

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1', 'acumulado');

      // Assert
      expect(resultado.totais?.energia_kwh).toBe(0.0527);
      expect(resultado.totais?.emissoes_gco2e).toBeNull();
    });

    it('não apresenta energia total calculada quando falta uma métrica necessária', async () => {
      // Arrange
      const metricasIncompletas = {
        ...criarMetricas(), metrics: { ...criarMetricas().metrics, cpu_percent: null },
      };
      servidores.metricsServidor.mockResolvedValue(metricasIncompletas as unknown as ServidorMetricsData);

      // Act
      const resultado = await service.calcularImpactoPorServidor('servidor-1');

      // Assert
      expect(resultado.impacto?.energia_kwh ?? null).toBeNull();
    });

    it('não converte uma coleta histórica sem nenhuma métrica em energia zero', async () => {
      // Arrange
      banco.responderCom([{
        ...criarColeta(), cpuPercent: null, memoriaGb: null, discoGb: null, redeGb: null,
      }]);

      // Act
      const resultado = await service.calcularImpactoDiscriminadoPorServidor('servidor-1', 'acumulado');

      // Assert
      expect(resultado.totais?.energia_kwh ?? null).toBeNull();
    });
  });
});
