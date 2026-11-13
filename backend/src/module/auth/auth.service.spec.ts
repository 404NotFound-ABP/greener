import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { DrizzleDB } from '@/database';
import * as schema from '@/database/schema';

const compararSenha = jest.fn<(senha: string, hash: string) => Promise<boolean>>();

jest.unstable_mockModule('bcrypt', () => ({
  compare: compararSenha,
  default: { compare: compararSenha },
}));

jest.unstable_mockModule('@/database', () => ({
  DRIZZLE_PROVIDER: 'DRIZZLE_DATABASE',
  schema,
}));

const { AuthService } = await import('./auth.service');

function preparar() {
  const respostas: Record<string, unknown>[][] = [];
  const limit = jest.fn(async (_: number) => respostas.shift() ?? []);
  const where = jest.fn((_: unknown) => ({ limit }));
  const from = jest.fn((_: unknown) => ({ where }));
  const select = jest.fn((_: unknown) => ({ from }));
  const assinar = jest.fn<JwtService['sign']>().mockReturnValue('jwt-de-teste');
  const service = new AuthService(
    { sign: assinar } as unknown as JwtService,
    { select } as unknown as DrizzleDB,
  );

  return { service, respostas, assinar, where, select };
}

function usuario() {
  return {
    id: 7, name: 'Ana', email: 'ana@example.com', role: 'admin',
    password: 'hash-salvo', created_at: new Date('2026-11-12T12:00:00Z'),
  };
}

describe('AuthService', () => {
  let contexto: ReturnType<typeof preparar>;

  beforeEach(() => {
    contexto = preparar();
    compararSenha.mockReset();
  });

  it('autentica credenciais válidas, assina o perfil e não retorna a senha', async () => {
    // Arrange
    contexto.respostas.push([usuario()]);
    compararSenha.mockResolvedValue(true);

    // Act
    const resultado = await contexto.service.login({ email: ' ANA@EXAMPLE.COM ', password: 'segredo' });

    // Assert
    expect(compararSenha).toHaveBeenCalledWith('segredo', 'hash-salvo');
    expect(contexto.assinar).toHaveBeenCalledWith({
      sub: 7, email: 'ana@example.com', name: 'Ana', role: 'admin',
    });
    expect(resultado).toEqual({
      accessToken: 'jwt-de-teste',
      user: { id: 7, name: 'Ana', email: 'ana@example.com', role: 'admin' },
    });
    expect(JSON.stringify(resultado)).not.toContain('hash-salvo');
    expect(contexto.where).toHaveBeenCalledTimes(1);
  });

  it('recusa usuário inexistente sem comparar senha ou assinar token', async () => {
    // Arrange
    contexto.respostas.push([]);

    // Act
    const resultado = contexto.service.login({ email: 'ausente@example.com', password: 'segredo' });

    // Assert
    await expect(resultado).rejects.toBeInstanceOf(UnauthorizedException);
    expect(compararSenha).not.toHaveBeenCalled();
    expect(contexto.assinar).not.toHaveBeenCalled();
  });

  it('recusa senha incorreta sem assinar token', async () => {
    // Arrange
    contexto.respostas.push([usuario()]);
    compararSenha.mockResolvedValue(false);

    // Act
    const resultado = contexto.service.login({ email: 'ana@example.com', password: 'errada' });

    // Assert
    await expect(resultado).rejects.toBeInstanceOf(UnauthorizedException);
    expect(contexto.assinar).not.toHaveBeenCalled();
  });

  it('retorna o perfil consultado sem senha', async () => {
    // Arrange
    const { password: _, ...perfil } = usuario();
    contexto.respostas.push([perfil]);

    // Act
    const resultado = await contexto.service.getMe(7);

    // Assert
    expect(resultado).toEqual(perfil);
    expect(JSON.stringify(resultado)).not.toContain('password');
  });

  it('recusa consulta de perfil inexistente', async () => {
    // Arrange
    contexto.respostas.push([]);

    // Act
    const resultado = contexto.service.getMe(999);

    // Assert
    await expect(resultado).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
