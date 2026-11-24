import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Register } from './Register';
import { RegisterStep2 } from './RegisterStep2';
import { RegisterStep3 } from './RegisterStep3';

describe('cadastro em etapas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('exige os campos da primeira etapa antes de avançar', () => {
    // Arrange
    const avancar = vi.fn();
    render(<Register onNextStep={avancar} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));

    // Assert
    expect(avancar).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('Nome')).toBeRequired();
    expect(screen.getByPlaceholderText('E-mail')).toBeRequired();
  });

  it('avança com os dados obrigatórios preenchidos', () => {
    // Arrange
    const avancar = vi.fn();
    render(<Register onNextStep={avancar} />);
    fireEvent.change(screen.getByPlaceholderText('Nome'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByPlaceholderText('Sobrenome'), { target: { value: 'Silva' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Telefone celular'), {
      target: { value: '11999999999' },
    });

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));

    // Assert
    expect(avancar).toHaveBeenCalledTimes(1);
  });

  it('preserva os dados da primeira etapa ao avançar', () => {
    // Arrange
    const avancar = vi.fn();
    render(<Register onNextStep={avancar} />);
    fireEvent.change(screen.getByPlaceholderText('Nome'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByPlaceholderText('Sobrenome'), { target: { value: 'Silva' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Telefone celular'), {
      target: { value: '11999999999' },
    });

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));

    // Assert
    expect(avancar).toHaveBeenCalledWith(expect.objectContaining({
      nome: 'Ana', sobrenome: 'Silva', email: 'ana@example.com',
    }));
  });

  it('exige as preferências antes de passar para a senha', () => {
    // Arrange
    const avancar = vi.fn();
    render(<RegisterStep2 onNextStep={avancar} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));

    // Assert
    expect(avancar).not.toHaveBeenCalled();
  });

  it('recusa confirmação de senha divergente', () => {
    // Arrange
    const concluir = vi.fn();
    const alerta = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    render(<RegisterStep3 onFinish={concluir} />);
    fireEvent.change(screen.getByPlaceholderText('Crie aqui sua senha'), {
      target: { value: 'senha123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repita a senha para confirmação'), {
      target: { value: 'outra123' },
    });

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }));

    // Assert
    expect(concluir).not.toHaveBeenCalled();
    expect(alerta).toHaveBeenCalledWith('As senhas não coincidem!');
  });

  it('conclui a etapa visual quando as senhas coincidem', () => {
    // Arrange
    const concluir = vi.fn();
    render(<RegisterStep3 onFinish={concluir} />);
    fireEvent.change(screen.getByPlaceholderText('Crie aqui sua senha'), {
      target: { value: 'senha123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repita a senha para confirmação'), {
      target: { value: 'senha123' },
    });

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }));

    // Assert
    expect(concluir).toHaveBeenCalledTimes(1);
  });

  it('submete os dados ao endpoint de cadastro com sucesso e permite retornar ao login', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 10, name: 'Carlos Lima', email: 'carlos@example.com' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const onLogin = vi.fn();
    const onFinish = vi.fn();

    render(
      <RegisterStep3
        registrationData={{
          nome: 'Carlos',
          sobrenome: 'Lima',
          email: 'carlos@example.com',
          telefone: '11988888888',
        }}
        onGoToLogin={onLogin}
        onFinish={onFinish}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Crie aqui sua senha'), {
      target: { value: 'senhaForte123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repita a senha para confirmação'), {
      target: { value: 'senhaForte123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }));

    await waitFor(() => {
      expect(screen.getByText('Cadastro realizado com sucesso!')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/auth/register'), expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        name: 'Carlos Lima',
        email: 'carlos@example.com',
        password: 'senhaForte123',
      }),
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Ir para o login' }));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it('informa erro claro e preserva campos preenchidos quando e-mail já existe (409)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Email já cadastrado' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <RegisterStep3
        registrationData={{
          nome: 'Ana',
          sobrenome: 'Silva',
          email: 'ana@example.com',
          telefone: '11999999999',
        }}
      />,
    );

    const inputSenha = screen.getByPlaceholderText('Crie aqui sua senha');
    const inputConfirmar = screen.getByPlaceholderText('Repita a senha para confirmação');

    fireEvent.change(inputSenha, { target: { value: 'senha123' } });
    fireEvent.change(inputConfirmar, { target: { value: 'senha123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Este e-mail já está cadastrado no sistema.');
    });

    // Dados permanecem preservados nos inputs
    expect(inputSenha).toHaveValue('senha123');
    expect(inputConfirmar).toHaveValue('senha123');
  });
});
