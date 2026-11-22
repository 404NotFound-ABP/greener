import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ServiceCard } from './ServiceCard';
import type { ServiceData } from '../types/service';

const servico: ServiceData = {
  id: '1',
  nome: 'Servidor Jacareí',
  status: 'Ativo',
  localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Jacareí' },
  valores: { kwh: 0.25, gco2e: 100 },
};

describe('ServiceCard', () => {
  it('mostra nome, estado, localização e indicadores com unidades', () => {
    // Arrange
    render(<ServiceCard service={servico} />);

    // Act
    const nomes = screen.getAllByText('Servidor Jacareí');

    // Assert
    expect(nomes.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ativo/).length).toBeGreaterThan(0);
    expect(screen.getByText('País: Brasil')).toBeInTheDocument();
    expect(screen.getByText('Região: Sudeste')).toBeInTheDocument();
    expect(screen.getByText('Cidade: Jacareí')).toBeInTheDocument();
    expect(screen.getAllByText('0,25 kWh').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100 gCO₂e').length).toBeGreaterThan(0);
  });

  it('mostra fallback quando localização não é informada', () => {
    render(
      <ServiceCard
        service={{
          ...servico,
          localizacao: undefined,
        }}
      />
    );

    expect(screen.getByText('País: Não informado')).toBeInTheDocument();
    expect(screen.getByText('Região: Não informada')).toBeInTheDocument();
    expect(screen.getByText('Cidade: Não informada')).toBeInTheDocument();
  });

  it('mostra estado indisponível quando o serviço não está ativo', () => {
    // Arrange
    render(<ServiceCard service={{ ...servico, status: 'Indisponível' }} />);

    // Act
    const estados = screen.getAllByText(/Indisponível/);

    // Assert
    expect(estados.length).toBeGreaterThan(0);
  });
});
