import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminDashboard, type AdminUser } from './AdminDashboard';

const mockUsers: AdminUser[] = [
  { id: 1, name: 'João Augusto de Souza', email: 'joao.augusto@gmail.com', role: 'admin' },
  { id: 2, name: 'Maria Clara Santos', email: 'maria.santos@gmail.com', role: 'user' },
  { id: 3, name: 'Carlos Eduardo Lima', email: 'carlos.lima@gmail.com', role: 'user' },
];

describe('painel administrativo integrado', () => {
  beforeEach(() => {
    sessionStorage.setItem('token', 'jwt-admin-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('consulta usuários reais da API com JWT e oculta status/último acesso ausentes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUsers,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('João Augusto de Souza')).toBeInTheDocument();
    });
    expect(screen.getByText('Maria Clara Santos')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/users', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer jwt-admin-token',
      }),
    }));

    // Status e último acesso não aparecem sem dados reais previstos
    expect(screen.queryByText(/Último acesso:/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Ativo')).not.toBeInTheDocument();
  });

  it('exibe status e último acesso quando fornecidos pelo escopo', () => {
    const usersWithScope: AdminUser[] = [
      {
        id: 99,
        name: 'Usuário Completo',
        email: 'completo@example.com',
        role: 'user',
        status: 'Ativo',
        lastAccess: '12/10/2026',
      },
    ];

    render(<AdminDashboard initialUsers={usersWithScope} />);

    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Último acesso: 12/10/2026')).toBeInTheDocument();
  });

  it('filtra usuários pelo nome ou e-mail digitado', () => {
    render(<AdminDashboard initialUsers={mockUsers} />);

    fireEvent.change(screen.getByPlaceholderText('Busque por um usuário...'), {
      target: { value: 'Carlos' },
    });

    expect(screen.getByText('Carlos Eduardo Lima')).toBeInTheDocument();
    expect(screen.queryByText('João Augusto de Souza')).not.toBeInTheDocument();
  });

  it('navega ao dashboard público e permite sair', () => {
    const sair = vi.fn();
    const abrirDashboard = vi.fn();
    render(<AdminDashboard initialUsers={mockUsers} onLogout={sair} onViewPublicDashboard={abrirDashboard} />);

    fireEvent.click(screen.getByRole('button', { name: /sair/i }));
    fireEvent.click(screen.getByRole('button', { name: /dashboard público/i }));

    expect(sair).toHaveBeenCalledTimes(1);
    expect(abrirDashboard).toHaveBeenCalledTimes(1);
  });

  it('permite criar usuário com POST e exibe mensagem de sucesso', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 4,
        name: 'Novo Admin',
        email: 'novo@admin.com',
        role: 'admin',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminDashboard initialUsers={mockUsers} />);

    fireEvent.click(screen.getByRole('button', { name: /adicionar novo usuário/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Nome do usuário'), { target: { value: 'Novo Admin' } });
    fireEvent.change(screen.getByPlaceholderText('exemplo@greener.com'), { target: { value: 'novo@admin.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha inicial'), { target: { value: 'senha123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar usuário' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('criado com sucesso');
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/users', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        name: 'Novo Admin',
        email: 'novo@admin.com',
        password: 'senha123',
        role: 'user',
      }),
    }));
  });

  it('informa erro ao tentar cadastrar e-mail duplicado (409)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Email já cadastrado' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminDashboard initialUsers={mockUsers} />);

    fireEvent.click(screen.getByRole('button', { name: /adicionar novo usuário/i }));
    fireEvent.change(screen.getByPlaceholderText('Nome do usuário'), { target: { value: 'Duplicado' } });
    fireEvent.change(screen.getByPlaceholderText('exemplo@greener.com'), { target: { value: 'duplicado@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha inicial'), { target: { value: 'senha123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar usuário' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Já existe um usuário cadastrado com o e-mail');
    });
  });

  it('permite editar usuário com PATCH na API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 1,
        name: 'João Editado',
        email: 'joao.editado@gmail.com',
        role: 'admin',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminDashboard initialUsers={mockUsers} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar usuário João Augusto de Souza' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const inputNome = screen.getByDisplayValue('João Augusto de Souza');
    fireEvent.change(inputNome, { target: { value: 'João Editado' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('atualizado com sucesso');
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({
        name: 'João Editado',
        email: 'joao.augusto@gmail.com',
        role: 'admin',
      }),
    }));
  });

  it('permite excluir usuário com DELETE na API após confirmação', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Usuário 1 removido com sucesso' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminDashboard initialUsers={mockUsers} />);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir usuário João Augusto de Souza' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja excluir/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir definitivamente' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('removido com sucesso');
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
      method: 'DELETE',
    }));
  });
});
