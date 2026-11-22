import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getSessionToken, handleSessionExpired } from '../utils/auth';

export interface AdminUser {
  id: number | string;
  name: string;
  email: string;
  role: 'admin' | 'user' | string;
  status?: string;
  lastAccess?: string;
  created_at?: string;
  updated_at?: string;
}

interface AdminDashboardProps {
  onLogout?: () => void;
  onViewPublicDashboard?: () => void;
  initialUsers?: AdminUser[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onViewPublicDashboard,
  initialUsers,
}) => {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialUsers);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de Criação
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Estados de Edição
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editPassword, setEditPassword] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Estados de Exclusão
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Busca inicial de usuários via API com JWT
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const token = getSessionToken();

    try {
      const res = await fetch('/api/users', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401) {
        handleSessionExpired();
        setErrorMessage('Sessão expirada. Faça login novamente.');
        return;
      }

      if (res.status === 403) {
        setErrorMessage('Acesso negado: requer privilégios de administrador.');
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Erro ao carregar usuários (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err: any) {
      if (!initialUsers) {
        setErrorMessage(err.message || 'Falha ao conectar à API de usuários.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [initialUsers]);

  useEffect(() => {
    if (!initialUsers) {
      fetchUsers();
    }
  }, [fetchUsers, initialUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('pt-BR');
    if (!term) return users;
    return users.filter((user) =>
      `${user.name} ${user.email} ${user.id}`.toLocaleLowerCase('pt-BR').includes(term),
    );
  }, [searchTerm, users]);

  // Criação de usuário via API
  const handleAddUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingAdd(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const token = getSessionToken();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      if (res.status === 409) {
        setErrorMessage(`Já existe um usuário cadastrado com o e-mail "${newUserEmail}".`);
        setIsSubmittingAdd(false);
        return;
      }

      if (res.status === 401) {
        handleSessionExpired();
        setErrorMessage('Sessão expirada. Faça login novamente.');
        setIsSubmittingAdd(false);
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Erro ao cadastrar novo usuário.');
      }

      const createdUser = await res.json();
      setUsers((current) => [createdUser, ...current]);
      setSuccessMessage(`Usuário "${newUserName}" criado com sucesso!`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setIsAddDialogOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível salvar o usuário.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Edição de usuário via API
  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole((user.role === 'admin' ? 'admin' : 'user'));
    setEditPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;

    setIsSubmittingEdit(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const token = getSessionToken();
    try {
      const updatePayload: Record<string, any> = {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
      };
      if (editPassword.trim()) {
        updatePayload.password = editPassword.trim();
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (res.status === 409) {
        setErrorMessage(`O e-mail "${editEmail}" já está em uso por outro usuário.`);
        setIsSubmittingEdit(false);
        return;
      }

      if (res.status === 401) {
        handleSessionExpired();
        setErrorMessage('Sessão expirada. Faça login novamente.');
        setIsSubmittingEdit(false);
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Erro ao atualizar dados do usuário.');
      }

      const updatedUser = await res.json();
      setUsers((current) =>
        current.map((u) => (String(u.id) === String(editingUser.id) ? { ...u, ...updatedUser } : u)),
      );
      setSuccessMessage(`Usuário "${updatedUser.name}" atualizado com sucesso!`);
      setEditingUser(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível atualizar o usuário.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Exclusão de usuário via API
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsSubmittingDelete(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const token = getSessionToken();
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401) {
        handleSessionExpired();
        setErrorMessage('Sessão expirada. Faça login novamente.');
        setIsSubmittingDelete(false);
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Erro ao excluir usuário.');
      }

      setUsers((current) => current.filter((u) => String(u.id) !== String(userToDelete.id)));
      setSuccessMessage(`Usuário "${userToDelete.name}" removido com sucesso.`);
      setUserToDelete(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível remover o usuário.');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#07150E] overflow-x-hidden font-sans flex flex-col items-center pb-12">
      {/* CABEÇALHO */}
      <header className="w-full max-w-[1200px] mt-6 sm:mt-8 px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            translate="no"
            className="notranslate w-[64px] h-[64px] sm:w-[76px] sm:h-[76px] bg-[#06401D] rounded-full relative overflow-hidden shadow-[inset_0px_-6px_8px_rgba(11,42,28,0.5)] shrink-0 select-none flex items-center justify-center"
          >
            <span className="text-[#14C45A] font-bold text-lg">GreenER</span>
          </div>

          <h1 className="text-[#8FA89B] text-[18px] sm:text-[24px] font-medium leading-tight">
            Painel de gerenciamento de perfis
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-[16px] w-full md:w-auto">
          {/* Campo de Busca */}
          <div className="relative flex items-center flex-1 md:w-[320px] h-[44px] sm:h-[48px] bg-[#050E09] border-[2px] border-[#0B7335] rounded-[10px] overflow-hidden min-w-0">
            <div className="pl-3 sm:pl-[16px] pr-2 sm:pr-[10px] flex items-center justify-center text-white shrink-0">
              <svg className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Busque por um usuário..."
              aria-label="Busque por um usuário"
              className="w-full min-w-0 h-full bg-transparent text-[#F2FAF5] placeholder-[#8FA89B] text-[14px] sm:text-[15px] outline-none pr-3 sm:pr-[16px]"
            />
          </div>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="w-full max-w-[1200px] mt-8 sm:mt-10 px-4 sm:px-6 flex flex-col gap-6">
        {/* Mensagens de Sucesso e Erro */}
        {successMessage && (
          <div
            role="status"
            className="w-full p-4 rounded-xl bg-[#0E3B25] border border-[#14C45A] text-[#F2FAF5] flex items-center justify-between"
          >
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              aria-label="Fechar mensagem de sucesso"
              className="text-[#D4E3DA] hover:text-white font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="w-full p-4 rounded-xl bg-[#3B1212] border border-[#F34F0E] text-[#FEE2E2] flex items-center justify-between"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              aria-label="Fechar mensagem de erro"
              className="text-[#FEE2E2] hover:text-white font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Barra de Ferramentas */}
        <div className="w-full flex flex-col sm:flex-row sm:flex-wrap justify-between items-stretch sm:items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              setIsAddDialogOpen(true);
              setErrorMessage(null);
            }}
            aria-label="Adicionar novo usuário"
            className="w-full sm:w-auto h-[42px] sm:h-[40px] px-4 rounded-[10px] border-[1.5px] border-[#14C45A] text-[#14C45A] hover:bg-[#14C45A]/10 flex items-center justify-center gap-2 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>+</span> Adicionar novo usuário
          </button>

          <button
            type="button"
            onClick={fetchUsers}
            aria-label="Recarregar usuários"
            disabled={isLoading}
            className="w-full sm:w-auto h-[42px] sm:h-[40px] px-4 rounded-[10px] border-[1.5px] border-[#385E47] text-[#D4E3DA] hover:bg-[#1F8A4C]/20 flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer"
          >
            {isLoading ? 'Carregando…' : 'Atualizar lista'}
          </button>
        </div>

        {/* Lista de Utilizadores */}
        <div className="flex flex-col gap-4">
          {isLoading && users.length === 0 && (
            <div className="w-full p-8 text-center text-[#8FA89B] bg-[#0E2218] rounded-xl border border-[#385E47]">
              Carregando usuários da API…
            </div>
          )}

          {filteredUsers.map((user) => {
            const hasStatusOrAccess = Boolean(user.status || user.lastAccess);

            return (
              <div
                key={user.id}
                className="w-full p-4 sm:p-[16px] bg-[#0E2218] rounded-[12px] border border-[#8FA89B] flex flex-col lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_auto] lg:items-center gap-4 lg:gap-[24px]"
              >
                {/* 1. Nome e Avatar */}
                <div className="flex items-center gap-3 sm:gap-[16px] min-w-0">
                  <div className="w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] rounded-full border-[3px] border-[#1F8A4C] flex items-center justify-center shrink-0">
                    <svg className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] text-[#1F8A4C]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-[2px] min-w-0">
                    <div className="text-[#F7F7F5] text-[16px] sm:text-[18px] font-normal leading-[24px] sm:leading-[28px] truncate">
                      {user.name}
                    </div>
                    <div className="text-[#8FA89B] text-[13px] sm:text-[14px] font-normal leading-[20px] truncate">
                      ID: {user.id}
                    </div>
                  </div>
                </div>

                {/* 2. E-mail */}
                <div className="flex flex-col gap-[2px] min-w-0">
                  <div className="text-[#8FA89B] text-[13px] sm:text-[14px] font-normal leading-[20px]">E-mail</div>
                  <div className="text-[#F7F7F5] text-[14px] font-normal leading-[20px] truncate">{user.email}</div>
                </div>

                {/* 3. Nível de Acesso */}
                <div className="flex flex-col gap-[2px] min-w-0">
                  <div className="text-[#8FA89B] text-[13px] sm:text-[14px] font-normal leading-[20px]">Nível de acesso</div>
                  <div className="text-[#F7F7F5] text-[14px] font-normal leading-[20px] truncate">
                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </div>
                </div>

                {/* 4. Status e Último Acesso — apenas quando houver dados reais previstos no escopo */}
                {hasStatusOrAccess ? (
                  <div className="flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-2 lg:gap-[8px] min-w-0">
                    {user.status && (
                      <div
                        className={`px-[10px] py-[4px] bg-[#0E2218] rounded-[10px] border flex items-center justify-center w-max shrink-0 ${
                          user.status === 'Ativo' ? 'border-[#14C45A]' : 'border-[#9C2A2A]'
                        }`}
                      >
                        <div className={`text-[13px] sm:text-[14px] font-normal leading-[20px] ${user.status === 'Ativo' ? 'text-[#14C45A]' : 'text-[#9C2A2A]'}`}>
                          {user.status}
                        </div>
                      </div>
                    )}
                    {user.lastAccess && (
                      <div className="text-[#8FA89B] text-[13px] sm:text-[14px] font-normal leading-[20px] truncate">
                        Último acesso: {user.lastAccess}
                      </div>
                    )}
                  </div>
                ) : user.created_at ? (
                  <div className="flex flex-col gap-[2px] min-w-0">
                    <div className="text-[#8FA89B] text-[13px] sm:text-[14px] font-normal leading-[20px]">Cadastrado em</div>
                    <div className="text-[#F7F7F5] text-[14px] font-normal leading-[20px] truncate">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                {/* 5. Ações */}
                <div className="flex items-center gap-[10px] shrink-0 mt-1 lg:mt-0 w-full lg:w-auto justify-end">
                  {/* Botão Editar */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(user)}
                    aria-label={`Editar usuário ${user.name}`}
                    className="whitespace-nowrap shrink-0 px-3 py-[8px] bg-[#1F8A4C] hover:bg-[#2FA862] text-white rounded-[10px] border border-[#2FA862] flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-sm"
                  >
                    Editar
                  </button>

                  {/* Botão Excluir */}
                  <button
                    type="button"
                    onClick={() => setUserToDelete(user)}
                    aria-label={`Excluir usuário ${user.name}`}
                    className="whitespace-nowrap shrink-0 px-3 py-[8px] bg-[#9C2A2A] hover:bg-[#852323] text-[#F7F7F5] rounded-[10px] border border-[#F34F0E] flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-sm"
                  >
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })}

          {!isLoading && filteredUsers.length === 0 && (
            <p className="rounded-xl border border-[#385E47] p-6 text-center text-[#9DB0A4]">
              Nenhum usuário encontrado.
            </p>
          )}
        </div>

        {/* Rodapé com botões de Saída */}
        <div className="w-full flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sair"
            className="w-full sm:w-auto h-[48px] px-6 bg-[#EF4444] hover:bg-[#DC2626] rounded-[10px] text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-lg whitespace-nowrap cursor-pointer"
          >
            Sair
          </button>
          <button
            type="button"
            onClick={onViewPublicDashboard}
            aria-label="Ver dashboard público"
            className="w-full sm:w-auto h-[48px] px-6 bg-[#14C45A] hover:bg-[#0E9D47] rounded-[10px] text-white font-medium flex items-center justify-center transition-colors shadow-lg whitespace-nowrap cursor-pointer"
          >
            Ver dashboard público
          </button>
        </div>
      </main>

      {/* MODAL: CRIAR USUÁRIO */}
      {isAddDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-user-title"
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-4"
        >
          <form onSubmit={handleAddUser} className="w-full max-w-md space-y-4 rounded-2xl border border-[#2FA862] bg-[#0E2218] p-6 shadow-2xl">
            <h2 id="add-user-title" className="text-xl font-semibold text-white">
              Adicionar usuário
            </h2>
            <label className="flex flex-col gap-1 text-sm text-[#D4E3DA]">
              Nome
              <input
                autoFocus
                required
                value={newUserName}
                onChange={(event) => setNewUserName(event.target.value)}
                placeholder="Nome do usuário"
                className="rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 py-2 text-white outline-none focus:border-[#14C45A]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[#D4E3DA]">
              E-mail
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(event) => setNewUserEmail(event.target.value)}
                placeholder="exemplo@greener.com"
                className="rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 py-2 text-white outline-none focus:border-[#14C45A]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[#D4E3DA]">
              Senha
              <input
                type="password"
                required
                value={newUserPassword}
                onChange={(event) => setNewUserPassword(event.target.value)}
                placeholder="Senha inicial"
                className="rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 py-2 text-white outline-none focus:border-[#14C45A]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[#D4E3DA]">
              Nível de Acesso (Role)
              <select
                value={newUserRole}
                onChange={(event) => setNewUserRole(event.target.value as 'admin' | 'user')}
                className="rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 py-2 text-white outline-none focus:border-[#14C45A]"
              >
                <option value="user">Usuário Comum</option>
                <option value="admin">Administrador (Master)</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddDialogOpen(false)}
                className="rounded-lg border border-[#4A6B57] px-4 py-2 text-white cursor-pointer hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingAdd}
                className="rounded-lg bg-[#1F8A4C] hover:bg-[#14C45A] px-4 py-2 font-semibold text-white cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAdd ? 'Salvando…' : 'Salvar usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDITAR USUÁRIO */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-4"
        >
          <form onSubmit={handleUpdateUser} className="w-full max-w-md space-y-4 rounded-2xl border border-[#2FA862] bg-[#0E2218] p-6 shadow-2xl">
            <h2 id="edit-user-title" className="text-xl font-semibold text-white">
              Editar usuário
            </h2>
            <label className="flex flex-col gap-1 text-sm text-[#D4E3DA]">
              Nome
              <input
                autoFocus
                required
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 py-2 text-white outline-none focus:border-[#14C45A]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[#D4E3DA]">
              E-mail
              <input
                type="email"
                required
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
                className="rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 py-2 text-white outline-none focus:border-[#14C45A]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[#D4E3DA]">
              Nova senha (deixe em branco para manter)
              <input
                type="password"
                value={editPassword}
                onChange={(event) => setEditPassword(event.target.value)}
                placeholder="Opcional: nova senha"
                className="rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 py-2 text-white outline-none focus:border-[#14C45A]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[#D4E3DA]">
              Nível de Acesso (Role)
              <select
                value={editRole}
                onChange={(event) => setEditRole(event.target.value as 'admin' | 'user')}
                className="rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 py-2 text-white outline-none focus:border-[#14C45A]"
              >
                <option value="user">Usuário Comum</option>
                <option value="admin">Administrador (Master)</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg border border-[#4A6B57] px-4 py-2 text-white cursor-pointer hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="rounded-lg bg-[#1F8A4C] hover:bg-[#14C45A] px-4 py-2 font-semibold text-white cursor-pointer disabled:opacity-50"
              >
                {isSubmittingEdit ? 'Atualizando…' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {userToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-[#F34F0E] bg-[#0E2218] p-6 shadow-2xl">
            <h2 id="delete-user-title" className="text-xl font-semibold text-white">
              Confirmar exclusão
            </h2>
            <p className="text-sm text-[#D4E3DA]">
              Tem certeza que deseja excluir o usuário <strong className="text-white">{userToDelete.name}</strong> ({userToDelete.email})? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="rounded-lg border border-[#4A6B57] px-4 py-2 text-white cursor-pointer hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingDelete}
                onClick={handleDeleteUser}
                className="rounded-lg bg-[#9C2A2A] hover:bg-[#852323] px-4 py-2 font-semibold text-white cursor-pointer disabled:opacity-50"
              >
                {isSubmittingDelete ? 'Excluindo…' : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
