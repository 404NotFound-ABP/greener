import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardPage } from './DashboardPage';

describe('DashboardPage — ranking e comparação', () => {
  it('mostra a comparação quando dois serviços são selecionados', () => {
    // Arrange
    render(<DashboardPage />);

    // Act
    fireEvent.click(screen.getByRole('row', { name: /ASTAH-ABC/ }));

    // Assert
    expect(screen.getByText('Comparando 2 serviços')).toBeInTheDocument();
  });

  it('orienta a seleção de pelo menos dois serviços para comparar', () => {
    // Arrange
    render(<DashboardPage />);

    // Act
    const orientacao = screen.queryByText(/selecione pelo menos dois serviços/i);

    // Assert
    expect(orientacao).toBeInTheDocument();
  });

  it('ordena os serviços pelo critério escolhido no ranking', () => {
    // Arrange
    render(<DashboardPage />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Ordem alfabética (A–Z)' }));
    const linhas = screen.getAllByRole('row').filter((linha) => linha.textContent?.includes('ASTAH-'));

    // Assert
    expect(linhas[0]).toHaveTextContent('ASTAH-ABC');
  });
});
