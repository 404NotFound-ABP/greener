import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ServiceCard } from './ServiceCard';

const servico = {
  id: 1,
  name: 'Servidor Jacareí',
  isActive: true,
  location: { country: 'Brasil', region: 'Sudeste', city: 'Jacareí' },
  metrics: { kwh: 0.25, co2: '100 gCO₂e' },
};

describe('ServiceCard', () => {
  it('mostra nome, estado, localização e indicadores com unidades', () => {
    // Arrange
    render(<ServiceCard data={servico} />);

    // Act
    const nome = screen.getByText('Servidor Jacareí');

    // Assert
    expect(nome).toBeInTheDocument();
    expect(screen.getByText(/Ativo/)).toBeInTheDocument();
    expect(screen.getByText('Cidade: Jacareí')).toBeInTheDocument();
    expect(screen.getByText('0.25 kWh')).toBeInTheDocument();
    expect(screen.getByText('100 gCO₂e')).toBeInTheDocument();
  });

  it('mostra estado indisponível quando o serviço não está ativo', () => {
    // Arrange
    render(<ServiceCard data={{ ...servico, isActive: false }} />);

    // Act
    const estado = screen.getByText(/Indisponível/);

    // Assert
    expect(estado).toBeInTheDocument();
  });
});
