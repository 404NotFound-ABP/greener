import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Login } from './LoginPage';
import { AdminLogin } from './AdminLogin';

describe('telas de login', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('não avança sem e-mail e senha obrigatórios', () => {
    // Arrange
    const concluir = vi.fn();
    render(<Login onLoginSuccess={concluir} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Assert
    expect(concluir).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('Email')).toBeRequired();
    expect(screen.getByPlaceholderText('Senha')).toBeRequired();
  });

  it('navega para cadastro e acesso administrativo pelos botões', () => {
    // Arrange
    const cadastrar = vi.fn();
    const administrar = vi.fn();
    render(<Login onGoToRegister={cadastrar} onAdminAccess={administrar} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: /cadastro/i }));
    fireEvent.click(screen.getByRole('button', { name: /acesso administrativo/i }));

    // Assert
    expect(cadastrar).toHaveBeenCalledTimes(1);
    expect(administrar).toHaveBeenCalledTimes(1);
  });

  it('só conclui login de usuário após autenticação aprovada pela API', async () => {
    // Arrange
    const concluir = vi.fn();
    const buscar = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal('fetch', buscar);
    render(<Login onLoginSuccess={concluir} />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'senhaErrada' } });

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Assert
    await waitFor(() => expect(buscar).toHaveBeenCalled());
    expect(concluir).not.toHaveBeenCalled();
  });

  it('não permite acesso administrativo sem credenciais', () => {
    // Arrange
    const concluir = vi.fn();
    render(<AdminLogin onLoginSuccess={concluir} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Assert
    expect(concluir).not.toHaveBeenCalled();
  });

  it('recusa credenciais administrativas inválidas', async () => {
    // Arrange
    const concluir = vi.fn();
    const buscar = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal('fetch', buscar);
    render(<AdminLogin onLoginSuccess={concluir} />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'senhaErrada' } });

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Assert
    await waitFor(() => expect(buscar).toHaveBeenCalled());
    expect(concluir).not.toHaveBeenCalled();
  });
});
