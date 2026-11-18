import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar';
import { useServicesPolling } from '../hooks/useServicesPolling';
import type { ServiceData } from '../types/service';

const servicos: ServiceData[] = [
  {
    id: '1',
    nome: 'Serviço 1',
    status: 'Ativo',
    localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Jacareí' },
    valores: { kwh: 10, gco2e: 4.5 },
  },
  {
    id: '2',
    nome: 'Serviço 2',
    status: 'Indisponível',
    localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Jacareí' },
    valores: { kwh: 10, gco2e: 0 },
  },
];

function SidebarControlada() {
  const [activeFilters, setActiveFilters] = useState({
    ativo: true, indisponível: true, sem_metricas: true,
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const toggleFilter = (status: keyof typeof activeFilters) => {
    setActiveFilters((atual) => ({ ...atual, [status]: !atual[status] }));
  };
  const pollingState = useServicesPolling({ initialServices: servicos });

  return (
    <Sidebar
      currentTheme="dark"
      activeFilters={activeFilters}
      toggleFilter={toggleFilter}
      isMinimized={isMinimized}
      setIsMinimized={setIsMinimized}
      pollingState={pollingState}
    />
  );
}

describe('Sidebar', () => {
  it('filtra a lista pelo estado selecionado', () => {
    // Arrange
    render(<SidebarControlada />);
    expect(screen.getAllByText('Serviço 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Serviço 2').length).toBeGreaterThan(0);

    // Act
    fireEvent.click(screen.getAllByRole('button', { name: 'Indisponível' })[0]);

    // Assert
    expect(screen.getAllByText('Serviço 1').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Serviço 2')).toHaveLength(0);
  });

  it('informa quando nenhum estado selecionado tem serviços', () => {
    // Arrange
    render(<SidebarControlada />);

    // Act
    fireEvent.click(screen.getAllByRole('button', { name: 'Ativo' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Indisponível' })[0]);

    // Assert
    expect(screen.getAllByText('Nenhum serviço encontrado para os filtros ou busca atuais.').length).toBeGreaterThan(0);
  });

  it('busca um serviço pelo nome digitado', () => {
    // Arrange
    render(<SidebarControlada />);

    // Act
    fireEvent.change(screen.getByPlaceholderText('Busque por serviço ou localização'), {
      target: { value: 'Serviço 1' },
    });

    // Assert
    expect(screen.getAllByText('Serviço 1').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Serviço 2')).toHaveLength(0);
  });
});
