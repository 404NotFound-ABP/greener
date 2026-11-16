import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function criarContexto(user?: { role: string }): ExecutionContext {
  return {
    getHandler: () => function rota() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let papeis: jest.MockedFunction<(chave: string, alvos: unknown[]) => ('admin' | 'user')[] | undefined>;
  let guard: RolesGuard;

  beforeEach(() => {
    papeis = jest.fn();
    guard = new RolesGuard({ getAllAndOverride: papeis } as unknown as Reflector);
  });

  it('permite rota sem restrição de perfil', () => {
    // Arrange
    papeis.mockReturnValue(undefined);

    // Act
    const permitido = guard.canActivate(criarContexto());

    // Assert
    expect(permitido).toBe(true);
  });

  it('permite o perfil autorizado', () => {
    // Arrange
    papeis.mockReturnValue(['admin']);

    // Act
    const permitido = guard.canActivate(criarContexto({ role: 'admin' }));

    // Assert
    expect(permitido).toBe(true);
  });

  it('recusa acesso sem usuário autenticado', () => {
    // Arrange
    papeis.mockReturnValue(['admin']);

    // Act
    const executar = () => guard.canActivate(criarContexto());

    // Assert
    expect(executar).toThrow(ForbiddenException);
  });

  it('recusa perfil sem permissão', () => {
    // Arrange
    papeis.mockReturnValue(['admin']);

    // Act
    const executar = () => guard.canActivate(criarContexto({ role: 'user' }));

    // Assert
    expect(executar).toThrow(ForbiddenException);
  });
});
