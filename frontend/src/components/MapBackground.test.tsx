import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  CircleMarker: ({ children }: { children: ReactNode }) =>
    <div data-testid="marcador">{children}</div>,
  Tooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useMap: () => ({ closePopup: vi.fn() }),
}));

import { MapBackground } from './MapBackground';

describe('MapBackground', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra os três marcadores e identifica seus serviços', () => {
    // Arrange
    render(<MapBackground />);

    // Act
    const marcadores = screen.getAllByTestId('marcador');

    // Assert
    expect(marcadores).toHaveLength(3);
    expect(screen.getAllByText(/Serviço Jacareí/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Serviço Caçapava/).length).toBeGreaterThan(0);
  });

  it('retira do mapa os serviços do estado desmarcado', () => {
    // Arrange
    vi.useFakeTimers();
    render(<MapBackground />);

    // Act
    fireEvent.click(screen.getByRole('checkbox', { name: 'Indisponível' }));
    act(() => { vi.advanceTimersByTime(50); });

    // Assert
    expect(screen.getAllByTestId('marcador')).toHaveLength(2);
    expect(screen.queryByText(/Serviço Caçapava \(Clique para abrir\)/)).not.toBeInTheDocument();
  });

  it('permite trocar o tema visual do mapa', () => {
    // Arrange
    render(<MapBackground />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Satélite' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Satélite' })).toHaveClass('border-[#2FA862]');
  });
});
