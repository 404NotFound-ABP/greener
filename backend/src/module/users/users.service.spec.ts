import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import type { DrizzleDB } from '@/database';
import * as schema from '@/database/schema';

const gerarHash = jest.fn<(senha: string, custo: number) => Promise<string>>();

jest.unstable_mockModule('bcrypt', () => ({
  hash: gerarHash,
  default: { hash: gerarHash },
}));

jest.unstable_mockModule('@/database', () => ({
  DRIZZLE_PROVIDER: 'DRIZZLE_DATABASE',
  schema,
}));

const { UsersService } = await import('./users.service');

type Linha = Record<string, unknown>;

function preparar() {
  const fila: Linha[][] = [];
  const gravacoes: Linha[] = [];
  const alteracoes: Linha[] = [];
  const remover = jest.fn(async (_: unknown) => undefined);
  const select = jest.fn((_campos?: unknown) => ({
    from: (_: unknown) => ({
      orderBy: async (_ordem: unknown) => fila.shift() ?? [],
      where: (_condicao: unknown) => ({ limit: async (_limite: number) => fila.shift() ?? [] }),
    }),
  }));
  const insert = jest.fn((_tabela: unknown) => ({
    values: (dados: Linha) => {
      gravacoes.push(dados);
      return { returning: async (_campos: unknown) => fila.shift() ?? [] };
    },
  }));
  const update = jest.fn((_tabela: unknown) => ({
    set: (dados: Linha) => {
      alteracoes.push(dados);
      return { where: (_condicao: unknown) => ({
        returning: async (_campos: unknown) => fila.shift() ?? [],
      }) };
    },
  }));
  const db = {
    select, insert, update,
    delete: jest.fn((_tabela: unknown) => ({ where: remover })),
  } as unknown as DrizzleDB;
  const service = new UsersService(db);

  return { service, fila, gravacoes, alteracoes, remover };
}

function usuario() {
  return {
    id: 7, name: 'Ana', email: 'ana@example.com', role: 'user' as const,
    created_at: new Date('2026-11-12T12:00:00Z'),
    updated_at: new Date('2026-11-12T12:00:00Z'),
  };
}

describe('UsersService', () => {
  let contexto: ReturnType<typeof preparar>;

  beforeEach(() => {
    contexto = preparar();
    gerarHash.mockReset();
    gerarHash.mockResolvedValue('hash-seguro');
  });

  it('lista usuários sem expor senhas', async () => {
    // Arrange
    contexto.fila.push([usuario()]);

    // Act
    const resultado = await contexto.service.findAll();

    // Assert
    expect(resultado).toEqual([usuario()]);
    expect(JSON.stringify(resultado)).not.toContain('password');
  });

  it('consulta um usuário pelo ID', async () => {
    // Arrange
    contexto.fila.push([usuario()]);

    // Act
    const resultado = await contexto.service.findById(7);

    // Assert
    expect(resultado).toEqual(usuario());
  });

  it('retorna 404 quando o usuário não existe', async () => {
    // Arrange
    contexto.fila.push([]);

    // Act
    const resultado = contexto.service.findById(999);

    // Assert
    await expect(resultado).rejects.toBeInstanceOf(NotFoundException);
  });

  it('normaliza o cadastro, grava hash e não devolve a senha', async () => {
    // Arrange
    contexto.fila.push([], [usuario()]);

    // Act
    const resultado = await contexto.service.create({
      name: ' Ana ', email: ' ANA@EXAMPLE.COM ', password: 'segredo123',
    });

    // Assert
    expect(gerarHash).toHaveBeenCalledWith('segredo123', 10);
    expect(contexto.gravacoes[0]).toMatchObject({
      name: 'Ana', email: 'ana@example.com', password: 'hash-seguro', role: 'user',
    });
    expect(resultado).toEqual(usuario());
    expect(JSON.stringify(resultado)).not.toContain('hash-seguro');
  });

  it('recusa e-mail já cadastrado sem gerar hash nem gravar', async () => {
    // Arrange
    contexto.fila.push([{ id: 3 }]);

    // Act
    const resultado = contexto.service.create({
      name: 'Ana', email: ' ANA@EXAMPLE.COM ', password: 'segredo123',
    });

    // Assert
    await expect(resultado).rejects.toBeInstanceOf(ConflictException);
    expect(gerarHash).not.toHaveBeenCalled();
    expect(contexto.gravacoes).toHaveLength(0);
  });

  it('atualiza nome, e-mail, perfil e senha usando novo hash', async () => {
    // Arrange
    contexto.fila.push([usuario()], [], [{ ...usuario(), name: 'Ana Nova', role: 'admin' }]);

    // Act
    const resultado = await contexto.service.update(7, {
      name: ' Ana Nova ', email: ' NOVO@EXAMPLE.COM ', password: 'novaSenha123', role: 'admin',
    });

    // Assert
    expect(contexto.alteracoes[0]).toMatchObject({
      name: 'Ana Nova', email: 'novo@example.com', password: 'hash-seguro', role: 'admin',
    });
    expect(gerarHash).toHaveBeenCalledWith('novaSenha123', 10);
    expect(resultado.role).toBe('admin');
  });

  it('recusa atualização com e-mail de outro usuário', async () => {
    // Arrange
    contexto.fila.push([usuario()], [{ id: 8 }]);

    // Act
    const resultado = contexto.service.update(7, { email: 'ocupado@example.com' });

    // Assert
    await expect(resultado).rejects.toBeInstanceOf(ConflictException);
    expect(contexto.alteracoes).toHaveLength(0);
  });

  it('exclui usuário existente', async () => {
    // Arrange
    contexto.fila.push([usuario()]);

    // Act
    const resultado = await contexto.service.delete(7);

    // Assert
    expect(resultado.message).toContain('7');
    expect(contexto.remover).toHaveBeenCalledTimes(1);
  });
});
