import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminDashboard } from './AdminDashboard';

describe('painel administrativo', () => {
  it('mostra os perfis e seus estados no protótipo', () => {
    render(<AdminDashboard />);

    expect(screen.getByText('Painel de gerenciamento de perfis')).toBeInTheDocument();
    expect(screen.getAllByText('Maria Clara Santos')).toHaveLength(2);
    expect(screen.getAllByText('Inativo').length).toBeGreaterThan(0);
  });

  it('filtra usuários pelo nome digitado', () => {
    render(<AdminDashboard />);

    fireEvent.change(screen.getByPlaceholderText('Busque por um usuário aqui...'), {
      target: { value: 'Carlos' },
    });

    expect(screen.getByText('Carlos Eduardo Lima')).toBeInTheDocument();
    expect(screen.queryByText('João Augusto de Souza')).not.toBeInTheDocument();
  });

  it('navega ao dashboard público e permite sair', () => {
    const sair = vi.fn();
    const abrirDashboard = vi.fn();
    render(<AdminDashboard onLogout={sair} onViewPublicDashboard={abrirDashboard} />);

    fireEvent.click(screen.getByRole('button', { name: /sair/i }));
    fireEvent.click(screen.getByRole('button', { name: /dashboard público/i }));

    expect(sair).toHaveBeenCalledTimes(1);
    expect(abrirDashboard).toHaveBeenCalledTimes(1);
  });

  it('abre a criação de usuário ao acionar o botão', () => {
    render(<AdminDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /adicionar novo usuário/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
