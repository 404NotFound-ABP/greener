import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from './MainLayout';

vi.mock('../pages/MapPage', () => ({
  MapPage: ({ onSelectTab }: { onSelectTab?: (tab: 'mapa' | 'dashboards' | 'historico' | 'config') => void }) => (
    <div>
      <div>Mapa de serviços</div>
      <button onClick={() => onSelectTab?.('dashboards')}>Abrir painéis do mapa</button>
      <button onClick={() => onSelectTab?.('config')}>Abrir configuração do mapa</button>
    </div>
  ),
}));
vi.mock('../pages/DashboardPage', () => ({ DashboardPage: () => <div>Página de dashboards</div> }));
vi.mock('../pages/HistoricoPage', () => ({ HistoricoPage: () => <div>Página de histórico</div> }));
vi.mock('../pages/AccountSettingsPage', () => ({
  AccountSettingsPage: () => <label>Intervalo de monitoramento<input aria-label="Intervalo de monitoramento" /></label>,
}));

describe('navegação principal', () => {
  it('abre dashboard e histórico a partir do menu do mapa', () => {
    render(<MainLayout />);
    expect(screen.getByText('Mapa de serviços')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir painéis do mapa' }));
    expect(screen.getByText('Página de dashboards')).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Navegação principal' }))
        .getByRole('button', { name: 'Histórico' }),
    );
    expect(screen.getByText('Página de histórico')).toBeInTheDocument();
  });

  it('oferece configuração de intervalo de monitoramento', () => {
    render(<MainLayout />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir configuração do mapa' }));

    expect(screen.getByLabelText(/intervalo de monitoramento/i)).toBeInTheDocument();
  });
});
