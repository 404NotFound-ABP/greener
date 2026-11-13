import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { DrizzleDB } from '@/database';
import * as schema from '@/database/schema';

jest.unstable_mockModule('@/database', () => ({
  DRIZZLE_PROVIDER: 'DRIZZLE_DATABASE',
  schema,
}));

const { JwtStrategy } = await import('./jwt.strategy');

type Resultado = { tipo: 'sucesso' | 'falha' | 'erro'; valor?: unknown };

function autenticar(strategy: InstanceType<typeof JwtStrategy>, token?: string): Promise<Resultado> {
  return new Promise((resolve) => {
    const instancia = strategy as unknown as {
      success: (usuario: unknown) => void;
      fail: (motivo?: unknown) => void;
      error: (erro: unknown) => void;
      authenticate: (requisicao: { headers: Record<string, string> }) => void;
    };
    instancia.success = (usuario) => resolve({ tipo: 'sucesso', valor: usuario });
    instancia.fail = (motivo) => resolve({ tipo: 'falha', valor: motivo });
    instancia.error = (erro) => resolve({ tipo: 'erro', valor: erro });
    instancia.authenticate({
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
  });
}

describe('JwtStrategy', () => {
  const assinador = new JwtService({ secret: 'segredo-exclusivo-do-teste' });
  let respostas: Record<string, unknown>[][];
  let consultar: jest.MockedFunction<(_campos?: unknown) => unknown>;
  let strategy: InstanceType<typeof JwtStrategy>;

  beforeEach(() => {
    respostas = [];
    consultar = jest.fn((_campos?: unknown) => ({
      from: (_tabela: unknown) => ({
        where: (_condicao: unknown) => ({ limit: async (_quantidade: number) => respostas.shift() ?? [] }),
      }),
    }));
    const config = { getOrThrow: () => 'segredo-exclusivo-do-teste' } as unknown as ConfigService;
    strategy = new JwtStrategy(config, { select: consultar } as unknown as DrizzleDB);
  });

  it('valida token assinado e carrega o perfil atual do banco', async () => {
    // Arrange
    const perfil = { id: 7, email: 'ana@example.com', name: 'Ana', role: 'admin' };
    respostas.push([perfil]);
    const token = assinador.sign({ sub: 7, email: perfil.email, name: perfil.name, role: perfil.role });

    // Act
    const resultado = await autenticar(strategy, token);

    // Assert
    expect(resultado).toEqual({ tipo: 'sucesso', valor: perfil });
    expect(consultar).toHaveBeenCalledTimes(1);
  });

  it('recusa requisição sem token', async () => {
    // Arrange
    const token = undefined;

    // Act
    const resultado = await autenticar(strategy, token);

    // Assert
    expect(resultado.tipo).toBe('falha');
    expect(consultar).not.toHaveBeenCalled();
  });

  it('recusa token inválido', async () => {
    // Arrange
    const token = 'token-invalido';

    // Act
    const resultado = await autenticar(strategy, token);

    // Assert
    expect(resultado.tipo).toBe('falha');
    expect(consultar).not.toHaveBeenCalled();
  });

  it('recusa token expirado', async () => {
    // Arrange
    const token = assinador.sign({ sub: 7 }, { expiresIn: -1 });

    // Act
    const resultado = await autenticar(strategy, token);

    // Assert
    expect(resultado.tipo).toBe('falha');
    expect(consultar).not.toHaveBeenCalled();
  });

  it('recusa sessão cujo usuário não existe mais no banco', async () => {
    // Arrange
    respostas.push([]);

    // Act
    const resultado = strategy.validate({
      sub: 999, email: 'ausente@example.com', name: 'Ausente', role: 'user',
    });

    // Assert
    await expect(resultado).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
