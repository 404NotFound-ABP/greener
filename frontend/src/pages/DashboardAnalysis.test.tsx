import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

vi.mock('../components/ServiceModal', () => ({
  ServiceModal: ({ service }: { service: { name: string } }) => <div>Detalhes: {service.name}</div>,
}));

describe('DashboardPage — ranking e comparação', () => {
  it('mostra a comparação inicial com os serviços selecionados por padrão', () => {
    // Arrange
    render(<DashboardPage />);

    // Assert
    expect(screen.getByText('5 de 5 serviços')).toBeInTheDocument();
  });

  it('permite remover um serviço da comparação', () => {
    // Arrange
    render(<DashboardPage />);

    // Act
    fireEvent.click(screen.getAllByRole('button', { name: 'Selecionar ASTAH-ABC para comparação' })[0]);

    // Assert
    expect(screen.getByText('4 de 5 serviços')).toBeInTheDocument();
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
