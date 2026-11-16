import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

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
    fireEvent.click(screen.getByRole('row', { name: /ASTAH-ABC/ }));

    // Assert
    expect(screen.getByText(/2 de 2 selecionado/)).toBeInTheDocument();
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

  it('consulta o resumo real do backend em vez de depender da lista fixa', async () => {
    // Arrange
    const buscar = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      resumo: { total_servidores: 1 }, servidores: [{ id: 'SERVICO-REAL', nome: 'Serviço real' }],
    }) });
    vi.stubGlobal('fetch', buscar);

    // Act
    render(<DashboardPage />);

    // Assert
    await waitFor(() => expect(buscar).toHaveBeenCalled());
    expect(screen.getByText('SERVICO-REAL')).toBeInTheDocument();
  });
});
