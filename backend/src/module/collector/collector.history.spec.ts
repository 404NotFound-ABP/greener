import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { DrizzleDB } from '@/database';
import * as schema from '@/database/schema';
import type { CarbonService } from '@/module/carbon/carbon.service';
import type { ImpactService } from '@/module/impact/impact.service';
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

type Linha = Record<string, unknown>;

function preparar() {
  const respostas: Linha[][] = [];
  const where = jest.fn((_: unknown) => query);
  const orderBy = jest.fn((_: unknown) => query);
  const limit = jest.fn(async (quantidade: number) => respostas.shift()?.slice(0, quantidade) ?? []);
  const query = { where, orderBy, limit };
  const from = jest.fn((_: unknown) => {
    if (respostas.length === 0) throw new Error('Resposta do banco não preparada.');
    return Object.assign(Promise.resolve(respostas[0]), query);
  });
  const select = jest.fn((_: unknown) => ({ from }));
  const service = new CollectorService(
    {} as ServidoresService, {} as CarbonService, {} as ImpactService,
    { select } as unknown as DrizzleDB,
  );

  return { service, respostas, select, from, where, orderBy, limit };
}

describe('CollectorService — histórico e estatísticas', () => {
  let contexto: ReturnType<typeof preparar>;

  beforeEach(() => {
    contexto = preparar();
  });

  it('consulta o histórico do serviço em ordem recente e respeita o limite', async () => {
    // Arrange
    const linhas = [
      { servidorId: 'a', coletadoEm: new Date('2026-11-12T12:00:00Z') },
      { servidorId: 'a', coletadoEm: new Date('2026-11-12T11:00:00Z') },
    ];
    contexto.respostas.push(linhas);

    // Act
    const resultado = await contexto.service.getHistorico('a', 1);

    // Assert
    expect(resultado).toEqual([linhas[0]]);
    expect(contexto.from).toHaveBeenCalledWith(schema.coletasMetricas);
    expect(contexto.where).toHaveBeenCalledTimes(1);
    expect(contexto.orderBy).toHaveBeenCalledTimes(1);
    expect(contexto.limit).toHaveBeenCalledWith(1);
  });

  it('consulta todas as coletas sem filtro e usa o limite padrão', async () => {
    // Arrange
    const linhas = [{ servidorId: 'a' }, { servidorId: 'b' }];
    contexto.respostas.push(linhas);

    // Act
    const resultado = await contexto.service.getHistorico();

    // Assert
    expect(resultado).toEqual(linhas);
    expect(contexto.where).not.toHaveBeenCalled();
    expect(contexto.limit).toHaveBeenCalledWith(20);
  });

  it('retorna lista vazia quando não há coletas', async () => {
    // Arrange
    contexto.respostas.push([]);

    // Act
    const resultado = await contexto.service.getHistorico('a');

    // Assert
    expect(resultado).toEqual([]);
  });

  it('propaga a falha da consulta ao banco', async () => {
    // Arrange
    contexto.respostas.push([]);
    contexto.limit.mockRejectedValueOnce(new Error('banco indisponível'));

    // Act
    const resultado = contexto.service.getHistorico('a');

    // Assert
    await expect(resultado).rejects.toThrow('banco indisponível');
  });
});
