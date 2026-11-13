import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from './MainLayout';

vi.mock('../pages/MapPage', () => ({ MapPage: () => <div>Mapa de serviços</div> }));
vi.mock('../pages/DashboardPage', () => ({ DashboardPage: () => <div>Página de dashboards</div> }));
vi.mock('../pages/HistoricoPage', () => ({ HistoricoPage: () => <div>Página de histórico</div> }));

describe('navegação principal', () => {
  it('abre dashboard e histórico a partir do menu do mapa', () => {
    render(<MainLayout />);
    expect(screen.getByText('Mapa de serviços')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Dashboards' }));
    expect(screen.getByText('Página de dashboards')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Histórico' }));
    expect(screen.getByText('Página de histórico')).toBeInTheDocument();
  });

  it('oferece configuração de intervalo de monitoramento', () => {
    render(<MainLayout />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Configuração' }));

    expect(screen.getByLabelText(/intervalo de monitoramento/i)).toBeInTheDocument();
  });
});
