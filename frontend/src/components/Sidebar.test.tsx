import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar';

function SidebarControlada() {
  const [activeFilters, setActiveFilters] = useState({
    ativo: true, indisponível: true, sem_metricas: true,
  });
  const toggleFilter = (status: keyof typeof activeFilters) => {
    setActiveFilters((atual) => ({ ...atual, [status]: !atual[status] }));
  };

  return <Sidebar activeFilters={activeFilters} toggleFilter={toggleFilter} />;
}

describe('Sidebar', () => {
  it('filtra a lista pelo estado selecionado', () => {
    // Arrange
    render(<SidebarControlada />);
    expect(screen.getByText('Serviço 1')).toBeInTheDocument();
    expect(screen.getByText('Serviço 2')).toBeInTheDocument();

    // Act
    fireEvent.click(screen.getByRole('checkbox', { name: 'Indisponível' }));

    // Assert
    expect(screen.getByText('Serviço 1')).toBeInTheDocument();
    expect(screen.queryByText('Serviço 2')).not.toBeInTheDocument();
  });

  it('informa quando nenhum estado selecionado tem serviços', () => {
    // Arrange
    render(<SidebarControlada />);

    // Act
    fireEvent.click(screen.getByRole('checkbox', { name: 'Ativo' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Indisponível' }));

    // Assert
    expect(screen.getByText('Nenhum serviço encontrado.')).toBeInTheDocument();
  });

  it('busca um serviço pelo nome digitado', () => {
    // Arrange
    render(<SidebarControlada />);

    // Act
    fireEvent.change(screen.getByPlaceholderText('Busque o serviço'), {
      target: { value: 'Serviço 1' },
    });

    // Assert
    expect(screen.getByText('Serviço 1')).toBeInTheDocument();
    expect(screen.queryByText('Serviço 2')).not.toBeInTheDocument();
  });
});
