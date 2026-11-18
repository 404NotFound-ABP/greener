import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TileLayer: ({
    maxZoom,
    updateWhenZooming,
    keepBuffer
  }: {
    maxZoom: number;
    updateWhenZooming: boolean;
    keepBuffer: number;
  }) => (
    <div
      data-testid="camada-do-mapa"
      data-max-zoom={maxZoom}
      data-update-when-zooming={String(updateWhenZooming)}
      data-keep-buffer={keepBuffer}
    />
  ),
  CircleMarker: ({ children }: { children: ReactNode }) =>
    <div data-testid="marcador">{children}</div>,
  Tooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useMap: () => ({ closePopup: vi.fn() }),
}));

vi.mock('../hooks/useServicesPolling', () => ({
  useServicesPolling: () => ({
    services: [
      {
        id: '1',
        nome: 'Serviço Jacareí',
        status: 'Ativo',
        localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Jacareí' },
        valores: { kwh: 10, gco2e: 4.5 },
        coords: [-23.3053, -45.9658],
      },
      {
        id: '2',
        nome: 'Serviço Caçapava',
        status: 'Indisponível',
        localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Caçapava' },
        valores: { kwh: 10, gco2e: 0 },
        coords: [-23.100, -45.700],
      },
      {
        id: '3',
        nome: 'Serviço Taubaté',
        status: 'Sem métrica',
        localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Taubaté' },
        valores: { kwh: 12, gco2e: 5.4 },
        coords: [-23.020, -45.550],
      },
    ],
    lastUpdate: '12:00:00',
    isPaused: false,
    isRefreshing: false,
    hasError: false,
    isStale: false,
    togglePause: vi.fn(),
    triggerRefresh: vi.fn(),
  }),
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

  it('atualiza as camadas após o zoom e mantém tiles vizinhos em buffer', () => {
    render(<MapBackground />);

    const tileLayer = screen.getByTestId('camada-do-mapa');
    expect(tileLayer).toHaveAttribute('data-max-zoom', '19');
    expect(tileLayer).toHaveAttribute('data-update-when-zooming', 'false');
    expect(tileLayer).toHaveAttribute('data-keep-buffer', '2');
  });

  it('retira do mapa os serviços do estado desmarcado', () => {
    // Arrange
    vi.useFakeTimers();
    render(<MapBackground />);

    // Act
    fireEvent.click(screen.getAllByRole('button', { name: 'Indisponível' })[0]);
    act(() => { vi.advanceTimersByTime(50); });

    // Assert
    expect(screen.getAllByTestId('marcador')).toHaveLength(2);
    expect(screen.queryByText(/Serviço Caçapava \(Clique para abrir\)/)).not.toBeInTheDocument();
  });

  it('oculta e restaura o marcador ao alternar o checkbox do serviço', () => {
    render(<MapBackground />);

    const checkbox = screen.getAllByRole('button', { name: 'Selecionar Serviço Jacareí' })[0];
    expect(checkbox).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByTestId('marcador')).toHaveLength(3);

    fireEvent.click(checkbox);
    expect(screen.getAllByTestId('marcador')).toHaveLength(2);
    expect(checkbox).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(screen.getAllByTestId('marcador')).toHaveLength(3);
    expect(checkbox).toHaveAttribute('aria-pressed', 'true');
  });

  it('abre detalhes do card sem coordenadas sem falhar fora do contexto do mapa', () => {
    render(<MapBackground />);

    fireEvent.click(screen.getAllByText('Localização')[2]);

    expect(screen.getByRole('dialog', { name: 'Detalhes de Serviço Taubaté' })).toBeInTheDocument();
    expect(screen.getAllByText(/Cidade: Taubaté, Sudeste, Brasil/)).toHaveLength(2);
  });

  it('permite trocar o tema visual do mapa', () => {
    // Arrange
    render(<MapBackground />);
    const preview = screen.getByAltText('Prévia Satélite');

    expect(preview).toHaveAttribute(
      'src',
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/4641/3050'
    );

    // Act
    const tema = screen.getByTitle('Mudar para Satélite');
    fireEvent.click(tema);

    // Assert
    expect(screen.getByTitle('Mudar para Escuro')).toBeInTheDocument();
    expect(screen.getByAltText('Prévia Escuro')).toHaveAttribute(
      'src',
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/13/4641/3050'
    );
  });
});
