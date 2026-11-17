import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { HttpService } from '@nestjs/axios';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { DrizzleDB } from '@/database';
import { IntervalosConfigService } from '@/database/intervalos-config.service';
import * as schema from '@/database/schema';

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

type Linha = Record<string, unknown>;

function preparar() {
  const fila: (Linha[] | Error)[] = [];
  const consultas: { tabela: unknown; limite?: number }[] = [];
  const select = jest.fn((_campos?: unknown) => ({
    from: (tabela: unknown) => {
      const linhas = fila.shift();
      if (!linhas) throw new Error('Resposta do banco não preparada.');
      const responder = async () => {
        if (linhas instanceof Error) throw linhas;
        return linhas;
      };
      const consulta: { tabela: unknown; limite?: number } = { tabela };
      consultas.push(consulta);
      const query = {
        where: (_: unknown) => query,
        orderBy: (_: unknown) => query,
        innerJoin: (_: unknown, __: unknown) => query,
        leftJoin: (_: unknown, __: unknown) => query,
        groupBy: (..._: unknown[]) => responder(),
        limit: async (quantidade: number) => {
          consulta.limite = quantidade;
          return (await responder()).slice(0, quantidade);
        },
        then: (resolver: (valor: Linha[]) => unknown, rejeitar?: (erro: unknown) => unknown) =>
          responder().then(resolver, rejeitar),
      };
      return query;
    },
  }));
  const service = new ServidoresService({} as HttpService, { select } as unknown as DrizzleDB);

  return { service, fila, consultas };
}

function servidor(id: string, status = 'disponivel') {
  return {
    id, nome: `Serviço ${id}`, codigoRegiao: 'br-sudeste', caminhoMetricas: `/metrics/${id}`,
    statusAtual: status, ativo: true, atualizadoEm: new Date('2026-11-12T12:00:00Z'),
    regiao: {
      codigo: 'br-sudeste', pais: 'Brasil', regiao: 'Sudeste', cidade: 'São Paulo',
      carbonIntensityGco2eKwh: '400', renewableSharePercent: '70',
    },
  };
}

function coleta(energia: string | null, emissao: string | null, horario: string) {
  return {
    status: 'disponivel', potenciaWatts: '40', energiaKwh: energia,
    emissoesGco2e: emissao, cpuPercent: '40', memoriaGb: '4',
    discoGb: '20', redeGb: '1', coletadoEm: new Date(horario),
  };
}

describe('ServidoresService — consultas do banco', () => {
  let contexto: ReturnType<typeof preparar>;

  beforeEach(() => {
    contexto = preparar();
  });

  it('retorna serviços com região e última coleta', async () => {
    // Arrange
    contexto.fila.push([servidor('a')], [coleta('0.01', '4', '2026-11-12T12:00:00Z')]);

    // Act
    const resultado = await contexto.service.listServidoresDoBanco();

    // Assert
    expect(resultado).toMatchObject([{
      id: 'a', status: 'disponivel',
      regiao: { codigo: 'br-sudeste', carbon_intensity_gco2e_kwh: 400 },
      ultima_coleta: { energia_kwh: 0.01, emissoes_gco2e: 4 },
    }]);
    expect(contexto.consultas[1]).toMatchObject({ tabela: schema.coletasMetricas, limite: 1 });
  });

  it('retorna serviço sem coleta com ultima_coleta nula', async () => {
    // Arrange
    contexto.fila.push([servidor('a')], []);

    // Act
    const resultado = await contexto.service.listServidoresDoBanco();

    // Assert
    expect(resultado[0]?.ultima_coleta).toBeNull();
  });

  it('calcula o resumo do dashboard a partir dos serviços e dos totais salvos', async () => {
    // Arrange
    const itens = [
      { id: 'a', status: 'disponivel', ultima_coleta: { potencia_watts: 40 } },
      { id: 'b', status: 'indisponivel', ultima_coleta: null },
    ] as Awaited<ReturnType<typeof contexto.service.listServidoresDoBanco>>;
    jest.spyOn(contexto.service, 'listServidoresDoBanco').mockResolvedValue(itens);
    contexto.fila.push([{ consumoTotalKwh: '2.500000', emissoesTotalGco2e: '100.0000' }]);

    // Act
    const resultado = await contexto.service.getDashboardData();

    // Assert
    expect(resultado.resumo).toMatchObject({
      total_servidores: 2, disponiveis: 1, indisponiveis: 1,
      potencia_atual_watts: 40, consumo_total_acumulado_kwh: 2.5,
      emissoes_total_acumuladas_gco2e: 100,
    });
  });

  it('retorna as últimas coletas em ordem cronológica e respeita o limite', async () => {
    // Arrange
    const recente = coleta('0.02', '8', '2026-11-12T12:00:00Z');
    const antiga = coleta('0.01', '4', '2026-11-12T11:00:00Z');
    contexto.fila.push([servidor('a')], [recente, antiga]);

    // Act
    const resultado = await contexto.service.getHistoricoServidor('a', 2);

    // Assert
    expect(resultado.total_pontos).toBe(2);
    expect(resultado.pontos.map((p) => p.timestamp)).toEqual([antiga.coletadoEm, recente.coletadoEm]);
    expect(contexto.consultas[1]).toMatchObject({ tabela: schema.coletasMetricas, limite: 2 });
  });

  it('retorna histórico vazio quando o serviço existe sem registros', async () => {
    // Arrange
    contexto.fila.push([servidor('a')], []);

    // Act
    const resultado = await contexto.service.getHistoricoServidor('a');

    // Assert
    expect(resultado.total_pontos).toBe(0);
    expect(resultado.pontos).toEqual([]);
  });

  it('retorna 404 quando o serviço não existe no histórico', async () => {
    // Arrange
    contexto.fila.push([]);

    // Act
    const erro = await contexto.service.getHistoricoServidor('ausente')
      .catch((falha: unknown) => falha);

    // Assert
    expect(erro).toBeInstanceOf(NotFoundException);
  });

  it('seleciona os serviços informados na comparação e ordena por emissão', async () => {
    // Arrange
    const itens = [
      { id: 'a', nome: 'A', status: 'disponivel', regiao: null,
        ultima_coleta: { emissoes_gco2e: 2, energia_kwh: 1 } },
      { id: 'b', nome: 'B', status: 'disponivel', regiao: null,
        ultima_coleta: { emissoes_gco2e: 8, energia_kwh: 3 } },
      { id: 'c', nome: 'C', status: 'removido', regiao: null, ultima_coleta: null },
    ] as Awaited<ReturnType<typeof contexto.service.listServidoresDoBanco>>;
    jest.spyOn(contexto.service, 'listServidoresDoBanco').mockResolvedValue(itens);

    // Act
    const resultado = await contexto.service.getComparativo(['a', 'b']);

    // Assert
    expect(resultado.total_comparados).toBe(2);
    expect(resultado.servidores.map((item) => item.id)).toEqual(['b', 'a']);
  });

  it('ordena o ranking instantâneo por energia e respeita o limite', async () => {
    // Arrange
    const itens = [
      { id: 'a', nome: 'A', status: 'disponivel', regiao: null,
        ultima_coleta: { energia_kwh: 1, emissoes_gco2e: 20 } },
      { id: 'b', nome: 'B', status: 'disponivel', regiao: null,
        ultima_coleta: { energia_kwh: 3, emissoes_gco2e: 10 } },
    ] as Awaited<ReturnType<typeof contexto.service.listServidoresDoBanco>>;
    jest.spyOn(contexto.service, 'listServidoresDoBanco').mockResolvedValue(itens);

    // Act
    const resultado = await contexto.service.getRankingServidores('energia', 'desc', 'instantaneo', 1);

    // Assert
    expect(resultado.total).toBe(2);
    expect(resultado.ranking.map((item) => item.id)).toEqual(['b']);
    expect(resultado.ranking[0]?.posicao).toBe(1);
  });

  it('ordena o ranking acumulado por emissão', async () => {
    // Arrange
    contexto.fila.push([
      { servidorId: 'a', nome: 'A', statusAtual: 'disponivel', codigoRegiao: 'br',
        paisRegiao: 'Brasil', intensidadeCarbono: '400', totalColetas: 2,
        totalEnergiaKwh: '2', totalEmissoesGco2e: '20', potenciaMediaWatts: '40', cpuMediaPercent: '40' },
      { servidorId: 'b', nome: 'B', statusAtual: 'disponivel', codigoRegiao: 'br',
        paisRegiao: 'Brasil', intensidadeCarbono: '400', totalColetas: 3,
        totalEnergiaKwh: '1', totalEmissoesGco2e: '50', potenciaMediaWatts: '30', cpuMediaPercent: '30' },
    ]);

    // Act
    const resultado = await contexto.service.getRankingServidores();

    // Assert
    expect(resultado.ranking.map((item) => item.id)).toEqual(['b', 'a']);
    expect(resultado.ranking[0]?.emissoes_total_gco2e).toBe(50);
    expect(contexto.consultas[0]?.tabela).toBe(schema.coletasMetricas);
  });

  it('retorna lista vazia sem consultar coletas quando não há serviços cadastrados', async () => {
    // Arrange
    contexto.fila.push([]);

    // Act
    const resultado = await contexto.service.listServidoresDoBanco();

    // Assert
    expect(resultado).toEqual([]);
    expect(contexto.consultas).toEqual([{ tabela: schema.servidores }]);
  });

  it.each([
    { criterio: 'instantaneo', indicador: 'energia', ordem: 'asc', ids: ['a', 'c', 'b'] },
    { criterio: 'instantaneo', indicador: 'emissoes', ordem: 'asc', ids: ['b', 'a', 'c'] },
    { criterio: 'instantaneo', indicador: 'emissoes', ordem: 'desc', ids: ['c', 'a', 'b'] },
    { criterio: 'acumulado', indicador: 'energia', ordem: 'asc', ids: ['a', 'c', 'b'] },
    { criterio: 'acumulado', indicador: 'energia', ordem: 'desc', ids: ['b', 'c', 'a'] },
    { criterio: 'acumulado', indicador: 'emissoes', ordem: 'asc', ids: ['b', 'a', 'c'] },
  ] as const)('ordena ranking $criterio por $indicador em ordem $ordem e limita o retorno', async (caso) => {
    // Arrange — indicadores em ordens diferentes para detectar troca de critério.
    const dados = [
      { id: 'a', energia: 1, emissao: 20 },
      { id: 'b', energia: 3, emissao: 10 },
      { id: 'c', energia: 2, emissao: 30 },
    ];
    if (caso.criterio === 'instantaneo') {
      jest.spyOn(contexto.service, 'listServidoresDoBanco').mockResolvedValue(dados.map((item) => ({
        id: item.id, nome: item.id, status: 'disponivel', ativo: true, regiao: null,
        atualizado_em: new Date('2026-11-12T12:00:00Z'),
        ultima_coleta: {
          potencia_watts: 40, energia_kwh: item.energia, emissoes_gco2e: item.emissao,
          cpu_percent: 40, memoria_gb: 4, disco_gb: 20, rede_gb: 1,
          coletado_em: new Date('2026-11-12T12:00:00Z'),
        },
      })));
    } else {
      contexto.fila.push(dados.map((item) => ({
        servidorId: item.id, nome: item.id, statusAtual: 'disponivel', codigoRegiao: 'br',
        paisRegiao: 'Brasil', intensidadeCarbono: '400', totalColetas: 2,
        totalEnergiaKwh: String(item.energia), totalEmissoesGco2e: String(item.emissao),
        potenciaMediaWatts: '40', cpuMediaPercent: '40',
      })));
    }

    // Act
    const resultado = await contexto.service.getRankingServidores(caso.indicador, caso.ordem, caso.criterio, 2);

    // Assert
    expect(resultado).toMatchObject({
      criterio: caso.criterio, ordenado_por: caso.indicador, direcao: caso.ordem, total: 3,
    });
    expect(resultado.ranking.map((item) => item.id)).toEqual(caso.ids.slice(0, 2));
    expect(resultado.ranking.map((item) => item.posicao)).toEqual([1, 2]);
  });

  it.each(['instantaneo', 'acumulado'] as const)('retorna ranking %s vazio quando não há dados', async (criterio) => {
    // Arrange
    if (criterio === 'instantaneo') {
      jest.spyOn(contexto.service, 'listServidoresDoBanco').mockResolvedValue([]);
    } else {
      contexto.fila.push([]);
    }

    // Act
    const resultado = await contexto.service.getRankingServidores('energia', 'asc', criterio);

    // Assert
    expect(resultado).toMatchObject({ criterio, total: 0, ranking: [] });
  });

  it.each(['listagem', 'historico', 'dashboard', 'ranking', 'comparacao'] as const)(
    'não transforma falha do banco em resultado vazio na consulta de %s', async (consulta) => {
      // Arrange
      const erro = new Error('consulta indisponível');
      if (consulta === 'historico') contexto.fila.push([servidor('a')]);
      if (consulta === 'dashboard') {
        jest.spyOn(contexto.service, 'listServidoresDoBanco').mockResolvedValue([]);
      }
      contexto.fila.push(erro);
      const executar = {
        listagem: () => contexto.service.listServidoresDoBanco(),
        historico: () => contexto.service.getHistoricoServidor('a'),
        dashboard: () => contexto.service.getDashboardData(),
        ranking: () => contexto.service.getRankingServidores(),
        comparacao: () => contexto.service.getComparativo(['a', 'b']),
      };

      // Act
      const resultado = executar[consulta]();

      // Assert
      await expect(resultado).rejects.toBe(erro);
    },
  );

  describe('Regressões do Bloco 2 — ausência não é zero e cobertura do dashboard', () => {
    it('M01: preserva campos nulos na última coleta em listServidoresDoBanco', async () => {
      // Arrange
      contexto.fila.push(
        [servidor('a', 'sem_metricas')],
        [{
          status: 'sem_metricas', potenciaWatts: null, energiaKwh: null, emissoesGco2e: null,
          cpuPercent: null, memoriaGb: null, discoGb: null, redeGb: null,
          coletadoEm: new Date('2026-11-12T12:00:00Z'),
        }],
      );

      // Act
      const [item] = await contexto.service.listServidoresDoBanco();

      // Assert
      expect(item?.ultima_coleta).toMatchObject({
        potencia_watts: null,
        energia_kwh: null,
        emissoes_gco2e: null,
        cpu_percent: null,
        memoria_gb: null,
        disco_gb: null,
        rede_gb: null,
      });
    });

    it('M02: preserva indicadores e métricas nulos em getHistoricoServidor', async () => {
      // Arrange
      contexto.fila.push(
        [servidor('a')],
        [{
          status: 'sem_metricas', potenciaWatts: null, energiaKwh: null, emissoesGco2e: null,
          cpuPercent: null, memoriaGb: null, discoGb: null, redeGb: null,
          coletadoEm: new Date('2026-11-12T12:00:00Z'),
        }],
      );

      // Act
      const historico = await contexto.service.getHistoricoServidor('a');

      // Assert
      expect(historico.pontos[0]).toMatchObject({
        potencia_watts: null,
        energia_kwh: null,
        emissoes_gco2e: null,
        cpu_percent: null,
      });
    });

    it('M04: informa cobertura parcial e janela temporal no resumo do dashboard', async () => {
      // Arrange
      const inicio = new Date('2026-11-12T10:00:00Z');
      const fim = new Date('2026-11-12T12:00:00Z');
      const itens = [
        { id: 'a', status: 'disponivel', ultima_coleta: { potencia_watts: 40 } },
        { id: 'b', status: 'sem_metricas', ultima_coleta: { potencia_watts: null } },
      ] as Awaited<ReturnType<typeof contexto.service.listServidoresDoBanco>>;
      jest.spyOn(contexto.service, 'listServidoresDoBanco').mockResolvedValue(itens);
      contexto.fila.push([{
        consumoTotalKwh: null, emissoesTotalGco2e: null,
        periodoInicio: inicio, periodoFim: fim,
      }]);

      // Act
      const resultado = await contexto.service.getDashboardData();

      // Assert
      expect(resultado.resumo).toMatchObject({
        total_servidores: 2,
        servidores_com_metricas: 1,
        servidores_sem_metricas: 1,
        cobertura_parcial: true,
        periodo_inicio: inicio,
        periodo_fim: fim,
        consumo_total_acumulado_kwh: null,
        emissoes_total_acumuladas_gco2e: null,
      });
    });

    it('M05: preserva nulos e mantém itens sem leitura no fim do comparativo e ranking', async () => {
      // Arrange
      const itens = [
        { id: 'sem-dados', nome: 'Sem Dados', status: 'sem_metricas', regiao: null, ultima_coleta: null },
        { id: 'a', nome: 'A', status: 'disponivel', regiao: null, ultima_coleta: { emissoes_gco2e: 5, energia_kwh: 1 } },
        { id: 'b', nome: 'B', status: 'disponivel', regiao: null, ultima_coleta: { emissoes_gco2e: 10, energia_kwh: 2 } },
      ] as Awaited<ReturnType<typeof contexto.service.listServidoresDoBanco>>;
      jest.spyOn(contexto.service, 'listServidoresDoBanco').mockResolvedValue(itens);

      // Act
      const comparativo = await contexto.service.getComparativo();
      const rankingAsc = await contexto.service.getRankingServidores('emissoes', 'asc', 'instantaneo', 10);

      // Assert
      expect(comparativo.servidores.map((s) => s.id)).toEqual(['b', 'a', 'sem-dados']);
      expect(comparativo.servidores[2]?.emissoes_gco2e).toBeNull();
      expect(rankingAsc.ranking.map((r) => r.id)).toEqual(['a', 'b', 'sem-dados']);
      expect(rankingAsc.ranking[2]?.emissoes_gco2e).toBeNull();
    });

    it('M05: preserva nulos no ranking acumulado quando agregação SQL retorna null', async () => {
      // Arrange
      contexto.fila.push([
        {
          servidorId: 'sem-dados', nome: 'Sem Dados', statusAtual: 'sem_metricas', codigoRegiao: 'br',
          paisRegiao: 'Brasil', intensidadeCarbono: '400', totalColetas: 1,
          totalEnergiaKwh: null, totalEmissoesGco2e: null, potenciaMediaWatts: null, cpuMediaPercent: null,
        },
        {
          servidorId: 'a', nome: 'A', statusAtual: 'disponivel', codigoRegiao: 'br',
          paisRegiao: 'Brasil', intensidadeCarbono: '400', totalColetas: 1,
          totalEnergiaKwh: '1', totalEmissoesGco2e: '10', potenciaMediaWatts: '40', cpuMediaPercent: '40',
        },
      ]);

      // Act
      const resultado = await contexto.service.getRankingServidores('emissoes', 'asc', 'acumulado', 10);

      // Assert
      expect(resultado.ranking.map((r) => r.id)).toEqual(['a', 'sem-dados']);
      expect(resultado.ranking[1]?.emissoes_total_gco2e).toBeNull();
      expect(resultado.ranking[1]?.energia_total_kwh).toBeNull();
    });

    it('RF13: retorna coordenadas da região quando disponíveis e null quando ausentes', async () => {
      // Arrange
      const comCoordenadas = {
        ...servidor('a'),
        regiao: {
          ...servidor('a').regiao,
          latitude: '-23.55',
          longitude: '-46.63',
        },
      };
      const semCoordenadas = {
        ...servidor('b'),
        regiao: {
          ...servidor('b').regiao,
          latitude: null,
          longitude: null,
        },
      };
      contexto.fila.push([comCoordenadas, semCoordenadas], [], []);

      // Act
      const resultado = await contexto.service.listServidoresDoBanco();

      // Assert
      expect(resultado[0]).toMatchObject({
        id: 'a',
        nome: 'Serviço a',
        regiao: { codigo: 'br-sudeste', latitude: -23.55, longitude: -46.63 },
      });
      expect(resultado[1]).toMatchObject({
        id: 'b',
        nome: 'Serviço b',
        regiao: { codigo: 'br-sudeste', latitude: null, longitude: null },
      });
    });

    it('usa intervalo_atualizacao_segundos padrão de IntervalosConfigService e aceita janelaSegundos válida', async () => {
      // Arrange
      const intervalosConfig = new IntervalosConfigService();
      intervalosConfig.setIntervalos(300, 1800, new Date('2026-11-16T23:00:00Z'));
      const serviceComConfig = new ServidoresService(
        {} as HttpService,
        {
          select: () => ({
            from: () => {
              const q: Record<string, unknown> = {
                where: () => q,
                orderBy: () => q,
                innerJoin: () => q,
                leftJoin: () => q,
                limit: async () => [],
                then: (res: (v: unknown[]) => unknown) => Promise.resolve([]).then(res),
              };
              return q;
            },
          }),
        } as unknown as DrizzleDB,
        intervalosConfig,
      );

      // Act
      const padrao = await serviceComConfig.getHistoricoServidor('a').catch(() => null);
      const comparativoPadrao = await serviceComConfig.getComparativo();
      const comparativoCustom = await serviceComConfig.getComparativo(undefined, 86400);

      // Assert
      expect(padrao).toBeNull(); // select() vazio retorna 404 para servidor 'a'
      expect(comparativoPadrao.janela_amostragem_segundos).toBe(1800);
      expect(comparativoCustom.janela_amostragem_segundos).toBe(86400);
      await expect(serviceComConfig.getComparativo(undefined, 45)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('RF10: filtra histórico por dataInicial e dataFinal, informa período e ordena cronologicamente', async () => {
      // Arrange
      const recente = coleta('0.02', '8', '2026-11-12T12:00:00Z');
      const antiga = coleta('0.01', '4', '2026-11-12T10:00:00Z');
      contexto.fila.push([servidor('a')], [recente, antiga]);

      // Act
      const resultado = await contexto.service.getHistoricoServidor(
        'a',
        30,
        undefined,
        '2026-11-12T09:00:00Z',
        '2026-11-12T13:00:00Z',
      );

      // Assert
      expect(resultado.periodo).toEqual({
        inicio: new Date('2026-11-12T09:00:00Z'),
        fim: new Date('2026-11-12T13:00:00Z'),
      });
      expect(resultado.pontos.map((p) => p.timestamp)).toEqual([antiga.coletadoEm, recente.coletadoEm]);
    });

    it('RF10: recusa datas inválidas ou dataInicial posterior a dataFinal', async () => {
      await expect(
        contexto.service.getHistoricoServidor('a', 30, undefined, 'data-invalida', undefined),
      ).rejects.toBeInstanceOf(BadRequestException);

      await expect(
        contexto.service.getHistoricoServidor(
          'a',
          30,
          undefined,
          '2026-11-12T15:00:00Z',
          '2026-11-12T10:00:00Z',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('RF15: inclui disco_gb, rede_gb, periodo e unidades no comparativo preservando nulos', async () => {
      // Arrange
      const itens = [
        {
          id: 'a', nome: 'A', status: 'disponivel',
          regiao: { pais: 'Brasil', carbon_intensity_gco2e_kwh: 400 },
          ultima_coleta: {
            potencia_watts: 40, energia_kwh: 1, emissoes_gco2e: 5,
            cpu_percent: 50, memoria_gb: 4, disco_gb: 20, rede_gb: 1.5,
          },
        },
        { id: 'sem-dados', nome: 'Sem Dados', status: 'sem_metricas', regiao: null, ultima_coleta: null },
      ] as Awaited<ReturnType<typeof contexto.service.listServidoresDoBanco>>;
      jest.spyOn(contexto.service, 'listServidoresDoBanco').mockResolvedValue(itens);

      // Act
      const resultado = await contexto.service.getComparativo();

      // Assert
      expect(resultado.periodo.inicio).toBeInstanceOf(Date);
      expect(resultado.periodo.fim).toBeInstanceOf(Date);
      expect(resultado.unidades).toMatchObject({
        cpu_percent: '%',
        memoria_gb: 'GB',
        disco_gb: 'GB',
        rede_gb: 'GB',
        potencia_watts: 'W',
        energia_kwh: 'kWh',
        emissoes_gco2e: 'gCO2e',
        intensidade_carbono_regional: 'gCO2e/kWh',
      });
      expect(resultado.servidores[0]).toMatchObject({ disco_gb: 20, rede_gb: 1.5 });
      expect(resultado.servidores[1]).toMatchObject({ disco_gb: null, rede_gb: null, emissoes_gco2e: null });
    });

    it('RF14 (#128): informa periodo no ranking e aplica desempate determinístico por nome e id', async () => {
      // Arrange — empatados no indicador principal e fora de ordem alfabética
      contexto.fila.push([
        {
          servidorId: 'id-2', nome: 'Beta', statusAtual: 'disponivel', codigoRegiao: 'br',
          paisRegiao: 'Brasil', intensidadeCarbono: '400', totalColetas: 2,
          totalEnergiaKwh: '2', totalEmissoesGco2e: '10', potenciaMediaWatts: '40', cpuMediaPercent: '40',
        },
        {
          servidorId: 'id-1', nome: 'Alpha', statusAtual: 'disponivel', codigoRegiao: 'br',
          paisRegiao: 'Brasil', intensidadeCarbono: '400', totalColetas: 2,
          totalEnergiaKwh: '2', totalEmissoesGco2e: '10', potenciaMediaWatts: '40', cpuMediaPercent: '40',
        },
        {
          servidorId: 'id-3', nome: 'Alpha', statusAtual: 'disponivel', codigoRegiao: 'br',
          paisRegiao: 'Brasil', intensidadeCarbono: '400', totalColetas: 2,
          totalEnergiaKwh: '2', totalEmissoesGco2e: '10', potenciaMediaWatts: '40', cpuMediaPercent: '40',
        },
      ]);

      // Act
      const resultado = await contexto.service.getRankingServidores(
        'emissoes',
        'desc',
        'acumulado',
        10,
        undefined,
        '2026-11-16T00:00:00Z',
        '2026-11-16T23:59:59Z',
      );

      // Assert
      expect(resultado.periodo).toEqual({
        inicio: new Date('2026-11-16T00:00:00Z'),
        fim: new Date('2026-11-16T23:59:59Z'),
      });
      expect(resultado.ranking.map((r) => `${r.nome}:${r.id}`)).toEqual([
        'Alpha:id-1',
        'Alpha:id-3',
        'Beta:id-2',
      ]);
    });
  });
});
