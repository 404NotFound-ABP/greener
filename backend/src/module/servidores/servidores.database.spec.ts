import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { HttpService } from '@nestjs/axios';
import { NotFoundException } from '@nestjs/common';
import type { DrizzleDB } from '@/database';
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
  const fila: Linha[][] = [];
  const consultas: { tabela: unknown; limite?: number }[] = [];
  const select = jest.fn((_campos?: unknown) => ({
    from: (tabela: unknown) => {
      const linhas = fila.shift();
      if (!linhas) throw new Error('Resposta do banco não preparada.');
      const consulta: { tabela: unknown; limite?: number } = { tabela };
      consultas.push(consulta);
      const query = {
        where: (_: unknown) => query,
        orderBy: (_: unknown) => query,
        innerJoin: (_: unknown, __: unknown) => query,
        leftJoin: (_: unknown, __: unknown) => query,
        groupBy: (..._: unknown[]) => Promise.resolve(linhas),
        limit: (quantidade: number) => {
          consulta.limite = quantidade;
          return Promise.resolve(linhas.slice(0, quantidade));
        },
        then: (resolver: (valor: Linha[]) => unknown) => Promise.resolve(linhas).then(resolver),
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
});
