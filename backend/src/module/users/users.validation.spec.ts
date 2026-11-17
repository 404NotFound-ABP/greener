import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { LoginDto } from '@/module/auth/dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const pipe = new ValidationPipe({ whitelist: true, transform: true });
const cadastroValido = { name: 'Ana', email: 'ana@example.com', password: 'abc123' };

describe('Validação das entradas de autenticação e usuários — #169', () => {
  it('aceita login com e-mail válido e senha no limite mínimo definido', async () => {
    const dados = { email: 'ana@example.com', password: 'abc123' };

    await expect(pipe.transform(dados, { type: 'body', metatype: LoginDto }))
      .resolves.toMatchObject(dados);
  });

  it.each([
    { caso: 'e-mail ausente', dados: { password: 'abc123' } },
    { caso: 'e-mail inválido', dados: { email: 'ana', password: 'abc123' } },
    { caso: 'senha ausente', dados: { email: 'ana@example.com' } },
    { caso: 'senha curta', dados: { email: 'ana@example.com', password: 'abc12' } },
  ])('recusa login com $caso', async ({ dados }) => {
    await expect(pipe.transform(dados, { type: 'body', metatype: LoginDto }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it.each(['user', 'admin'] as const)('aceita cadastro válido com perfil %s', async (role) => {
    const dados = { ...cadastroValido, role };

    await expect(pipe.transform(dados, { type: 'body', metatype: CreateUserDto }))
      .resolves.toMatchObject(dados);
  });

  it.each([
    { caso: 'nome ausente', dados: { email: 'ana@example.com', password: 'abc123' } },
    { caso: 'nome vazio', dados: { ...cadastroValido, name: '' } },
    { caso: 'e-mail ausente', dados: { name: 'Ana', password: 'abc123' } },
    { caso: 'e-mail inválido', dados: { ...cadastroValido, email: 'ana' } },
    { caso: 'senha ausente', dados: { name: 'Ana', email: 'ana@example.com' } },
    { caso: 'senha curta', dados: { ...cadastroValido, password: 'abc12' } },
    { caso: 'perfil não permitido', dados: { ...cadastroValido, role: 'superadmin' } },
  ])('recusa cadastro com $caso', async ({ dados }) => {
    await expect(pipe.transform(dados, { type: 'body', metatype: CreateUserDto }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('aceita atualização parcial sem exigir e-mail ou senha', async () => {
    const dados = { name: 'Ana Nova' };
    const resultado = await pipe.transform(dados, { type: 'body', metatype: UpdateUserDto });

    expect(resultado).toMatchObject(dados);
    expect(resultado.password).toBeUndefined();
    expect(resultado.email).toBeUndefined();
  });

  it.each([
    { caso: 'nome não textual', dados: { name: 123 } },
    { caso: 'e-mail inválido', dados: { email: 'ana' } },
    { caso: 'senha curta', dados: { password: 'abc12' } },
    { caso: 'perfil não permitido', dados: { role: 'superadmin' } },
  ])('recusa atualização com $caso', async ({ dados }) => {
    await expect(pipe.transform(dados, { type: 'body', metatype: UpdateUserDto }))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});
