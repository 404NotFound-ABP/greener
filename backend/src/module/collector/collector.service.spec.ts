import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { config } from '@/config/config';
import type { DrizzleDB } from '@/database';
import * as schema from '@/database/schema';
import type { CarbonService } from '@/module/carbon/carbon.service';
import type { ImpactService } from '@/module/impact/impact.service';
import type { ServidorImpactoResponseDto } from '@/module/impact/dto/impact.dto';
import type { ServidorResponse } from '@/module/interface/servidor.interface';
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

const { CollectorService } = await import('./collector.service');

function criarServidor(id: string): ServidorResponse {
  return {
    id, name: `Servidor ${id}`, metrics_path: `/metrics/${id}`,
    location: {
      region_code: 'br-sudeste', country: 'Brasil', region: 'Sudeste',
      city: 'São Paulo', latitude: -23.55, longitude: -46.63,
    },
  };
}

function criarImpacto(id: string, status = 'disponivel'): ServidorImpactoResponseDto {
  return {
    servidor_id: id, nome: `Servidor ${id}`, status,
    regiao: {
      codigo: 'br-sudeste', pais: 'Brasil', cidade: 'São Paulo',
      carbon_intensity_gco2e_kwh: 400, renewable_share_percent: 70,
    },
    metricas: status === 'disponivel' ? {
      intervalo_segundos: 30, cpu_percent: 40, memoria_gb: 4,
      disco_gb: 20, rede_gb: 1,
    } : null,
    impacto: status === 'disponivel' ? {
      potencia_watts: 42.1, energia_kwh: 0.0003508, emissoes_gco2e: 0.1403,
    } : null,
  };
}

type Gravacao = { tabela: unknown; valores: Record<string, unknown> };
type Atualizacao = Gravacao & { condicao?: unknown };

function criarBancoSimulado() {
  const gravacoes: Gravacao[] = [];
  const conflitos: { tabela: unknown; alvo: unknown }[] = [];
  const atualizacoes: Atualizacao[] = [];

  const insert = jest.fn((tabela: unknown) => ({
    values: (valores: Record<string, unknown>) => {
      gravacoes.push({ tabela, valores });
      return {
        onConflictDoUpdate: async ({ target }: { target: unknown }) => {
          conflitos.push({ tabela, alvo: target });
        },
      };
    },
  }));

  const update = jest.fn((tabela: unknown) => ({
    set: (valores: Record<string, unknown>) => {
      const atualizacao: Atualizacao = { tabela, valores };
      atualizacoes.push(atualizacao);
      return {
        where: async (condicao: unknown) => { atualizacao.condicao = condicao; },
      };
    },
  }));

  return { db: { insert, update } as unknown as DrizzleDB, gravacoes, conflitos, atualizacoes };
}

function prepararColetor() {
  const listar = jest.fn<ServidoresService['listServidores']>().mockResolvedValue([]);
  const regioes = jest.fn<CarbonService['getCarbonRegions']>()
    .mockResolvedValue({ regions: [], total: 0 });
  const calcular = jest.fn<ImpactService['calcularImpactoPorServidor']>()
    .mockImplementation(async (id) => criarImpacto(id));
  const banco = criarBancoSimulado();
  const service = new CollectorService(
    { listServidores: listar } as unknown as ServidoresService,
    { getCarbonRegions: regioes } as unknown as CarbonService,
    { calcularImpactoPorServidor: calcular } as unknown as ImpactService,
    banco.db,
  );

  return { service, listar, regioes, calcular, banco };
}

describe('CollectorService', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-11-12T12:00:00.000Z') });
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    expect(carregarAmbiente).not.toHaveBeenCalled();
  });

  it('sincroniza regiões e serviços, e salva uma medição por serviço', async () => {
    // Arrange
    const { service, listar, regioes, calcular, banco } = prepararColetor();
    listar.mockResolvedValue([criarServidor('a'), criarServidor('b')]);
    regioes.mockResolvedValue({
      total: 1,
      regions: [{
        code: 'br-sudeste', country: 'Brasil', region: 'Sudeste',
        city: 'São Paulo', latitude: -23.55, longitude: -46.63,
        carbon_intensity_gco2e_per_kwh: 400, renewable_share_percent: 70,
      }],
    });

    // Act
    const resultado = await service.executarCicloColeta();

    // Assert
    expect(resultado).toEqual({ servidoresProcessados: 2, duracaoSegundos: 0 });
    expect(calcular).toHaveBeenCalledTimes(2);
    expect(calcular).toHaveBeenCalledWith('a');
    expect(calcular).toHaveBeenCalledWith('b');
    expect(banco.gravacoes.filter((item) => item.tabela === schema.regioes)).toHaveLength(1);
    expect(banco.gravacoes.filter((item) => item.tabela === schema.servidores)).toHaveLength(2);
    expect(banco.gravacoes.filter((item) => item.tabela === schema.coletasMetricas)).toHaveLength(2);
    expect(banco.gravacoes.find((item) => item.tabela === schema.coletasMetricas)?.valores)
      .toMatchObject({ servidorId: 'a', intervaloSegundos: 30, cpuPercent: '40' });
    expect(banco.atualizacoes.filter((item) => item.tabela === schema.servidores)).toHaveLength(3);
  });

  it('reativa serviços pelo ID e usa atualização em conflito para não duplicar o cadastro', async () => {
    // Arrange
    const { service, listar, banco } = prepararColetor();
    listar.mockResolvedValue([criarServidor('a')]);

    // Act
    await service.executarCicloColeta();
    await service.executarCicloColeta();

    // Assert
    const cadastros = banco.gravacoes.filter((item) => item.tabela === schema.servidores);
    expect(cadastros).toHaveLength(2);
    expect(cadastros[0]?.valores).toMatchObject({ id: 'a', ativo: true });
    expect(banco.conflitos.filter((item) => item.tabela === schema.servidores))
      .toEqual([{ tabela: schema.servidores, alvo: schema.servidores.id },
        { tabela: schema.servidores, alvo: schema.servidores.id }]);
  });

  it('marca os serviços ausentes como removidos quando a listagem vem vazia', async () => {
    // Arrange
    const { service, banco } = prepararColetor();

    // Act
    const resultado = await service.executarCicloColeta();

    // Assert
    expect(resultado.servidoresProcessados).toBe(0);
    expect(banco.atualizacoes).toContainEqual({
      tabela: schema.servidores,
      valores: expect.objectContaining({ ativo: false, statusAtual: 'removido' }),
    });
    expect(banco.gravacoes).toHaveLength(0);
  });

  it('preserva o cadastro quando a listagem falha e se recupera no ciclo seguinte', async () => {
    // Arrange
    const { service, listar, banco } = prepararColetor();
    listar.mockRejectedValueOnce(new Error('API indisponível'))
      .mockResolvedValueOnce([criarServidor('a')]);

    // Act
    const falha = await service.executarCicloColeta();
    const atualizacoesAposFalha = banco.atualizacoes.length;
    const recuperacao = await service.executarCicloColeta();

    // Assert
    expect(falha).toMatchObject({ servidoresProcessados: 0, erro: 'API indisponível' });
    expect(atualizacoesAposFalha).toBe(0);
    expect(recuperacao.servidoresProcessados).toBe(1);
    expect(banco.gravacoes.filter((item) => item.tabela === schema.coletasMetricas)).toHaveLength(1);
  });

  it('continua a coleta dos demais serviços quando um deles falha', async () => {
    // Arrange
    const { service, listar, calcular, banco } = prepararColetor();
    listar.mockResolvedValue([criarServidor('a'), criarServidor('b')]);
    calcular.mockRejectedValueOnce(new Error('métricas indisponíveis'))
      .mockResolvedValueOnce(criarImpacto('b'));

    // Act
    const resultado = await service.executarCicloColeta();

    // Assert
    expect(resultado.servidoresProcessados).toBe(1);
    expect(calcular).toHaveBeenCalledTimes(2);
    expect(banco.gravacoes.filter((item) => item.tabela === schema.coletasMetricas))
      .toEqual([expect.objectContaining({ valores: expect.objectContaining({ servidorId: 'b' }) })]);
  });

  it('continua a coleta quando a API de regiões falha', async () => {
    // Arrange
    const { service, listar, regioes, banco } = prepararColetor();
    listar.mockResolvedValue([criarServidor('a')]);
    regioes.mockRejectedValue(new Error('carbono indisponível'));

    // Act
    const resultado = await service.executarCicloColeta();

    // Assert
    expect(resultado.servidoresProcessados).toBe(1);
    expect(banco.gravacoes.filter((item) => item.tabela === schema.regioes)).toHaveLength(0);
  });

  it('salva estados e métricas ausentes sem inventar valores', async () => {
    // Arrange
    const { service, listar, calcular, banco } = prepararColetor();
    listar.mockResolvedValue([criarServidor('a'), criarServidor('b')]);
    calcular.mockResolvedValueOnce(criarImpacto('a', 'indisponivel'))
      .mockResolvedValueOnce(criarImpacto('b', 'sem_metricas'));

    // Act
    await service.executarCicloColeta();

    // Assert
    const medicoes = banco.gravacoes.filter((item) => item.tabela === schema.coletasMetricas);
    expect(medicoes.map((item) => item.valores)).toEqual([
      expect.objectContaining({ servidorId: 'a', status: 'indisponivel', cpuPercent: null }),
      expect.objectContaining({ servidorId: 'b', status: 'sem_metricas', cpuPercent: null }),
    ]);
    expect(banco.atualizacoes.slice(-2).map((item) => item.valores.statusAtual))
      .toEqual(['indisponivel', 'sem_metricas']);
  });

  it('dispara a primeira coleta na inicialização e delega os disparos agendados', async () => {
    // Arrange
    const { service } = prepararColetor();
    const executar = jest.spyOn(service, 'executarCicloColeta')
      .mockResolvedValue({ servidoresProcessados: 1, duracaoSegundos: 0 });

    // Act
    await service.onApplicationBootstrap();
    await service.handleInterval();

    // Assert
    expect(executar).toHaveBeenCalledTimes(2);
    expect(Reflect.getMetadata('SCHEDULE_INTERVAL_OPTIONS', service.handleInterval))
      .toEqual({ timeout: config.INTERVALO_COLETA_SEGUNDOS * 1000 });
  });

  it('retorna o resultado da coleta manual', async () => {
    // Arrange
    const { service } = prepararColetor();
    jest.spyOn(service, 'executarCicloColeta')
      .mockResolvedValue({ servidoresProcessados: 2, duracaoSegundos: 0 });

    // Act
    const resultado = await service.executarColetaManual();

    // Assert
    expect(resultado).toMatchObject({ status: 'sucesso', detalhes: { servidoresProcessados: 2 } });
  });

  it('recusa uma segunda coleta manual enquanto a anterior está em andamento', async () => {
    // Arrange
    const { service, regioes } = prepararColetor();
    let liberarRegioes: (valor: { regions: []; total: number }) => void = () => undefined;
    regioes.mockImplementation(() => new Promise((resolve) => { liberarRegioes = resolve; }));

    // Act
    const primeira = service.executarColetaManual();
    const segunda = await service.executarColetaManual();
    liberarRegioes({ regions: [], total: 0 });
    const resultadoPrimeira = await primeira;

    // Assert
    expect(segunda).toMatchObject({ status: 'em_andamento' });
    expect(resultadoPrimeira).toMatchObject({ status: 'sucesso' });
    expect(regioes).toHaveBeenCalledTimes(1);
  });
});
