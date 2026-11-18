import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

vi.mock('../components/ServiceModal', () => ({
  ServiceModal: ({ service }: { service: { name: string } }) => <div>Detalhes: {service.name}</div>,
}));

describe('DashboardPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra a lista de serviços e unidades dos indicadores', () => {
    // Arrange
    render(<DashboardPage />);

    // Act
    const tabela = screen.getByRole('table');

    // Assert
    expect(tabela).toHaveTextContent('ASTAH-XYZ');
    expect(tabela).toHaveTextContent('Consumo no período (kWh)');
    expect(tabela).toHaveTextContent('Emissão no período (kgCO₂e)');
  });

  it('seleciona outro serviço para a comparação', () => {
    // Arrange
    render(<DashboardPage />);

    // Act
    fireEvent.click(screen.getAllByRole('button', { name: 'Selecionar ASTAH-ABC para comparação' })[0]);

    // Assert
    expect(screen.getByText('4 de 5 selecionados')).toBeInTheDocument();
  });

  it('filtra os serviços pelo texto pesquisado', () => {
    // Arrange
    render(<DashboardPage />);

    // Act
    fireEvent.change(screen.getByPlaceholderText('Pesquise por um serviço aqui'), {
      target: { value: 'ASTAH-XYZ' },
    });

    // Assert
    expect(screen.getByRole('row', { name: /ASTAH-XYZ/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /ASTAH-ABC/ })).not.toBeInTheDocument();
  });

  it('mantém a lista de demonstração visível sem disparar chamadas HTTP', async () => {
    // Arrange
    const buscar = vi.fn();
    vi.stubGlobal('fetch', buscar);

    // Act
    render(<DashboardPage />);

    // Assert
    expect(screen.getByRole('table')).toHaveTextContent('ASTAH-XYZ');
    await waitFor(() => expect(buscar).not.toHaveBeenCalled());
  });
});
