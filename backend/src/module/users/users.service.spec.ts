import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
  const fila: (Linha[] | Error)[] = [];
  const responder = async () => {
    const resposta = fila.shift() ?? [];
    if (resposta instanceof Error) throw resposta;
    return resposta;
  };
  const gravacoes: Linha[] = [];
  const alteracoes: Linha[] = [];
  const remover = jest.fn(async (_: unknown) => undefined);
  const select = jest.fn((_campos?: unknown) => ({
    from: (_: unknown) => ({
      orderBy: async (_ordem: unknown) => responder(),
      where: (_condicao: unknown) => ({ limit: async (_limite: number) => responder() }),
    }),
  }));
  const insert = jest.fn((_tabela: unknown) => ({
    values: (dados: Linha) => {
      gravacoes.push(dados);
      return { returning: async (_campos: unknown) => responder() };
    },
  }));
  const update = jest.fn((_tabela: unknown) => ({
    set: (dados: Linha) => {
      alteracoes.push(dados);
      return { where: (_condicao: unknown) => ({
        returning: async (_campos: unknown) => responder(),
      }) };
    },
  }));
  const excluir = jest.fn((_tabela: unknown) => ({ where: remover }));
  const db = {
    select, insert, update,
    delete: excluir,
  } as unknown as DrizzleDB;
  const service = new UsersService(db);

  return { service, fila, gravacoes, alteracoes, insert, update, excluir, remover };
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

  it('recusa atualização de usuário inexistente sem gerar hash nem alterar o banco', async () => {
    // Arrange
    contexto.fila.push([]);

    // Act
    const resultado = contexto.service.update(999, { name: 'Ana Nova', password: 'novaSenha123' });

    // Assert
    await expect(resultado).rejects.toBeInstanceOf(NotFoundException);
    expect(gerarHash).not.toHaveBeenCalled();
    expect(contexto.update).not.toHaveBeenCalled();
    expect(contexto.alteracoes).toHaveLength(0);
  });

  it('atualiza somente nome e perfil sem substituir a senha nem o e-mail', async () => {
    // Arrange
    const atualizado = { ...usuario(), name: 'Ana Nova', role: 'admin' as const };
    contexto.fila.push([usuario()], [atualizado]);

    // Act
    const resultado = await contexto.service.update(7, { name: ' Ana Nova ', role: 'admin' });

    // Assert
    expect(resultado).toEqual(atualizado);
    expect(contexto.alteracoes).toHaveLength(1);
    expect(contexto.alteracoes[0]).toMatchObject({ name: 'Ana Nova', role: 'admin' });
    expect(contexto.alteracoes[0]).not.toHaveProperty('password');
    expect(contexto.alteracoes[0]).not.toHaveProperty('email');
    expect(gerarHash).not.toHaveBeenCalled();
    expect(resultado).not.toHaveProperty('password');
  });

  it('permite manter o próprio e-mail normalizado sem acusar duplicidade', async () => {
    // Arrange
    contexto.fila.push([usuario()], [{ id: 7 }], [usuario()]);

    // Act
    const resultado = await contexto.service.update(7, { email: ' ANA@EXAMPLE.COM ' });

    // Assert
    expect(resultado).toEqual(usuario());
    expect(contexto.alteracoes).toHaveLength(1);
    expect(contexto.alteracoes[0]).toMatchObject({ email: 'ana@example.com' });
    expect(contexto.alteracoes[0]).not.toHaveProperty('password');
    expect(contexto.alteracoes[0]).not.toHaveProperty('name');
    expect(contexto.alteracoes[0]).not.toHaveProperty('role');
    expect(gerarHash).not.toHaveBeenCalled();
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

  it('recusa exclusão de usuário inexistente sem enviar comando de remoção ao banco', async () => {
    // Arrange
    contexto.fila.push([]);

    // Act
    const resultado = contexto.service.delete(999);

    // Assert
    await expect(resultado).rejects.toBeInstanceOf(NotFoundException);
    expect(contexto.excluir).not.toHaveBeenCalled();
    expect(contexto.remover).not.toHaveBeenCalled();
  });

  it('informa falha quando o banco não retorna o usuário cadastrado', async () => {
    // Arrange
    contexto.fila.push([], []);

    // Act
    const resultado = contexto.service.create({
      name: 'Ana', email: 'ana@example.com', password: 'segredo123',
    });

    // Assert
    await expect(resultado).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(contexto.insert).toHaveBeenCalledTimes(1);
  });

  it('informa falha quando o banco não retorna o usuário atualizado', async () => {
    // Arrange
    contexto.fila.push([usuario()], []);

    // Act
    const resultado = contexto.service.update(7, { name: 'Ana Nova' });

    // Assert
    await expect(resultado).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(contexto.update).toHaveBeenCalledTimes(1);
  });

  it.each(['cadastro', 'atualização', 'exclusão'] as const)(
    'não informa sucesso quando o banco falha na operação de %s', async (operacao) => {
      // Arrange
      const erro = new Error('falha simulada no banco');
      if (operacao === 'cadastro') contexto.fila.push([], erro);
      if (operacao === 'atualização') contexto.fila.push([usuario()], erro);
      if (operacao === 'exclusão') {
        contexto.fila.push([usuario()]);
        contexto.remover.mockRejectedValueOnce(erro);
      }
      const executar = {
        cadastro: () => contexto.service.create({
          name: 'Ana', email: 'ana@example.com', password: 'segredo123',
        }),
        atualização: () => contexto.service.update(7, { name: 'Ana Nova' }),
        exclusão: () => contexto.service.delete(7),
      };

      // Act
      const resultado = executar[operacao]();

      // Assert
      await expect(resultado).rejects.toBe(erro);
    },
  );

  it('não grava usuário quando a geração do hash falha', async () => {
    // Arrange
    const erro = new Error('falha simulada no hash');
    contexto.fila.push([]);
    gerarHash.mockRejectedValueOnce(erro);

    // Act
    const resultado = contexto.service.create({
      name: 'Ana', email: 'ana@example.com', password: 'segredo123',
    });

    // Assert
    await expect(resultado).rejects.toBe(erro);
    expect(contexto.insert).not.toHaveBeenCalled();
    expect(contexto.gravacoes).toHaveLength(0);
  });

  describe('seedInitialAdmin (S01 e S02)', () => {
    const envOriginal = {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      ADMIN_NAME: process.env.ADMIN_NAME,
    };

    afterEach(() => {
      process.env.ADMIN_EMAIL = envOriginal.ADMIN_EMAIL;
      process.env.ADMIN_PASSWORD = envOriginal.ADMIN_PASSWORD;
      process.env.ADMIN_NAME = envOriginal.ADMIN_NAME;
    });

    it('S01: ignora criação do admin inicial quando ADMIN_EMAIL ou ADMIN_PASSWORD não estão definidos', async () => {
      // Arrange
      delete process.env.ADMIN_EMAIL;
      delete process.env.ADMIN_PASSWORD;
      contexto.fila.push([]);

      // Act
      await contexto.service.onApplicationBootstrap();

      // Assert
      expect(gerarHash).not.toHaveBeenCalled();
      expect(contexto.insert).not.toHaveBeenCalled();
      expect(contexto.gravacoes).toHaveLength(0);
    });

    it('S01 e S02: cria admin inicial pelas variáveis de ambiente sem expor a senha no log', async () => {
      // Arrange
      process.env.ADMIN_NAME = 'Admin Greener';
      process.env.ADMIN_EMAIL = 'admin@greener.org';
      process.env.ADMIN_PASSWORD = 'SenhaSuperSecreta!123';
      contexto.fila.push([], []);
      const logSpy = jest.spyOn(
        (contexto.service as unknown as { logger: { log: (msg: string) => void } }).logger,
        'log',
      ).mockImplementation(() => undefined);

      // Act
      await contexto.service.onApplicationBootstrap();

      // Assert
      expect(gerarHash).toHaveBeenCalledWith('SenhaSuperSecreta!123', 10);
      expect(contexto.gravacoes).toHaveLength(1);
      expect(contexto.gravacoes[0]).toMatchObject({
        name: 'Admin Greener',
        email: 'admin@greener.org',
        role: 'admin',
      });
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy.mock.calls[0]?.[0]).not.toContain('SenhaSuperSecreta!123');
    });
  });
});
