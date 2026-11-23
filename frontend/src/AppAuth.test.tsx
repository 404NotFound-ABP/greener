import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { saveSession } from './utils/auth';

vi.mock('./pages/LoginPage', () => ({
  Login: ({ onAdminAccess }: { onAdminAccess: () => void }) =>
    <button onClick={onAdminAccess}>Acesso administrativo</button>,
}));
vi.mock('./pages/AdminLogin', () => ({
  AdminLogin: ({ onLoginSuccess }: { onLoginSuccess: () => void }) =>
    <button onClick={() => {
      saveSession('jwt-admin', {
        id: 1,
        email: 'admin@greener.test',
        name: 'Administrador',
        role: 'admin',
      });
      onLoginSuccess();
    }}>Entrar como administrador</button>,
}));
vi.mock('./pages/AdminDashboard', () => ({
  AdminDashboard: ({ onLogout }: { onLogout: () => void }) =>
    <button onClick={onLogout}>Sair do painel</button>,
}));

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
describe('sessão administrativa', () => {
  it('remove o token ao sair do painel', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Acesso administrativo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entrar como administrador' }));
    expect(sessionStorage.getItem('accessToken')).toBe('jwt-admin');

    fireEvent.click(screen.getByRole('button', { name: 'Sair do painel' }));
    expect(screen.getByRole('button', { name: 'Acesso administrativo' })).toBeInTheDocument();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });
});
