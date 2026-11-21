import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const pollingMock = vi.hoisted(() => ({
  services: [
    {
      id: '1', nome: 'Serviço Jacareí', status: 'Ativo',
      localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Jacareí' },
      valores: { kwh: 10, gco2e: 4.5 }, coords: [-23.3053, -45.9658]
    },
    {
      id: '2', nome: 'Serviço Caçapava', status: 'Indisponível',
      localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Caçapava' },
      valores: { kwh: 10, gco2e: 0 }, coords: [-23.1, -45.7]
    },
    {
      id: '3', nome: 'Serviço Taubaté', status: 'Sem métricas',
      localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Taubaté' },
      valores: { kwh: 12, gco2e: 5.4 }, coords: [-23.02, -45.55]
    },
    {
      id: '4', nome: 'Serviço sem coordenadas válidas', status: 'Ativo',
      localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'São Paulo' },
      valores: { kwh: 10, gco2e: 4.5 }, coords: [123, 456]
    }
  ] as unknown[],
  isRefreshing: false,
  hasError: false,
  triggerRefresh: vi.fn()
}));

vi.mock('react-leaflet', async () => {
  const React = await import('react');
  const MarkerPopupContext = React.createContext(false);

  return {
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TileLayer: ({
    maxZoom,
    updateWhenZooming,
    keepBuffer,
    eventHandlers
  }: {
    maxZoom: number;
    updateWhenZooming: boolean;
    keepBuffer: number;
    eventHandlers?: { tileerror?: () => void };
  }) => (
    <div
      data-testid="camada-do-mapa"
      data-max-zoom={maxZoom}
      data-update-when-zooming={String(updateWhenZooming)}
      data-keep-buffer={keepBuffer}
    >
      <button type="button" aria-label="Simular falha de camada" onClick={() => eventHandlers?.tileerror?.()} />
    </div>
  ),
  CircleMarker: ({ children, center }: { children: ReactNode; center: [number, number] }) => {
    const [isPopupOpen, setIsPopupOpen] = React.useState(false);
    return (
      <MarkerPopupContext.Provider value={isPopupOpen}>
        <div
          data-testid="marcador"
          data-center={JSON.stringify(center)}
          role="button"
          aria-label={`Abrir serviço em ${JSON.stringify(center)}`}
          onClick={() => setIsPopupOpen(true)}
        >
          {children}
        </div>
      </MarkerPopupContext.Provider>
    );
  },
  Tooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Popup: ({ children }: { children: ReactNode }) => {
    return React.useContext(MarkerPopupContext) ? <div data-testid="popup-servico">{children}</div> : null;
  },
  useMap: () => ({ closePopup: vi.fn() }),
  };
});

vi.mock('../hooks/useServicesPolling', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useServicesPolling')>();

  return {
    ...actual,
    useServicesPolling: () => ({
      services: pollingMock.services,
      lastUpdate: '12:00:00',
      isPaused: false,
      isRefreshing: pollingMock.isRefreshing,
      hasError: pollingMock.hasError,
      isStale: false,
      togglePause: vi.fn(),
      triggerRefresh: pollingMock.triggerRefresh,
    }),
  };
});

import { MapBackground } from './MapBackground';

describe('MapBackground', () => {
  afterEach(() => {
    vi.useRealTimers();
    pollingMock.services = [
      {
        id: '1', nome: 'Serviço Jacareí', status: 'Ativo',
        localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Jacareí' },
        valores: { kwh: 10, gco2e: 4.5 }, coords: [-23.3053, -45.9658]
      },
      {
        id: '2', nome: 'Serviço Caçapava', status: 'Indisponível',
        localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Caçapava' },
        valores: { kwh: 10, gco2e: 0 }, coords: [-23.1, -45.7]
      },
      {
        id: '3', nome: 'Serviço Taubaté', status: 'Sem métricas',
        localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Taubaté' },
        valores: { kwh: 12, gco2e: 5.4 }, coords: [-23.02, -45.55]
      },
      {
        id: '4', nome: 'Serviço sem coordenadas válidas', status: 'Ativo',
        localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'São Paulo' },
        valores: { kwh: 10, gco2e: 4.5 }, coords: [123, 456]
      }
    ];
    pollingMock.isRefreshing = false;
    pollingMock.hasError = false;
    pollingMock.triggerRefresh.mockClear();
  });

  it('mostra os três marcadores e identifica seus serviços', () => {
    // Arrange
    render(<MapBackground />);

    // Act
    const marcadores = screen.getAllByTestId('marcador');

    // Assert
    expect(marcadores).toHaveLength(3);
    expect(marcadores.map(marker => marker.getAttribute('data-center'))).toEqual([
      '[-23.3053,-45.9658]',
      '[-23.1,-45.7]',
      '[-23.02,-45.55]',
    ]);
    expect(marcadores.some(marker => marker.textContent?.includes('Serviço sem coordenadas válidas'))).toBe(false);
    expect(screen.getAllByText(/Serviço Jacareí/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Serviço Caçapava/).length).toBeGreaterThan(0);
  });

  it('abre os detalhes vinculados ao marcador selecionado', () => {
    render(<MapBackground />);

    const marcadorCacapava = screen.getAllByTestId('marcador').find(
      marker => marker.getAttribute('data-center') === '[-23.1,-45.7]'
    );
    expect(marcadorCacapava).toBeDefined();

    fireEvent.click(marcadorCacapava!);
    expect(within(marcadorCacapava!).getByTestId('popup-servico')).toHaveTextContent('Serviço Caçapava');
    expect(within(marcadorCacapava!).getByTestId('popup-servico')).not.toHaveTextContent('Serviço Jacareí');
  });

  it('atualiza as camadas após o zoom e mantém tiles vizinhos em buffer', () => {
    render(<MapBackground />);

    const tileLayer = screen.getByTestId('camada-do-mapa');
    expect(tileLayer).toHaveAttribute('data-max-zoom', '19');
    expect(tileLayer).toHaveAttribute('data-update-when-zooming', 'false');
    expect(tileLayer).toHaveAttribute('data-keep-buffer', '2');
  });

  it('informa carregamento e falha da consulta da lista com nova tentativa', () => {
    pollingMock.services = [];
    pollingMock.isRefreshing = true;
    const { rerender } = render(<MapBackground />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando serviços e marcadores no mapa');
    expect(screen.queryByText('Nenhum serviço disponível no momento')).not.toBeInTheDocument();

    pollingMock.isRefreshing = false;
    pollingMock.hasError = true;
    rerender(<MapBackground />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao sincronizar serviços');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(pollingMock.triggerRefresh).toHaveBeenCalledTimes(1);
  });

  it('mantém os serviços acessíveis na lista quando nenhum deles tem coordenadas válidas', () => {
    pollingMock.services = [
      {
        id: 'sem-coordenadas', nome: 'Serviço sem localização no mapa', status: 'Ativo',
        localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'São Paulo' },
        valores: { kwh: 10, gco2e: 4.5 }
      }
    ];

    render(<MapBackground onSelectTab={vi.fn()} />);

    expect(screen.queryAllByTestId('marcador')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('Nenhum serviço filtrado possui coordenadas');
    fireEvent.click(screen.getByRole('button', { name: /Abrir lista de serviços/ }));
    expect(screen.getAllByText('Serviço sem localização no mapa').length).toBeGreaterThan(0);
  });

  it('informa falha de camada do mapa e mantém atalhos para a lista e o dashboard', () => {
    const onSelectTab = vi.fn();
    render(<MapBackground onSelectTab={onSelectTab} />);

    const tileFailure = screen.getByRole('button', { name: 'Simular falha de camada' });
    fireEvent.click(tileFailure);
    fireEvent.click(tileFailure);
    fireEvent.click(tileFailure);
    fireEvent.click(tileFailure);

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar camadas do mapa');
    expect(screen.getByRole('alert')).toHaveTextContent('dashboards continuam disponíveis');
    fireEvent.click(screen.getByRole('button', { name: 'Acessar serviços' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abrir dashboards' }));
    expect(onSelectTab).toHaveBeenCalledWith('dashboards');
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

  it('abre detalhes do card sem coordenadas e fecha ao filtrar o serviço', () => {
    vi.useFakeTimers();
    render(<MapBackground />);

    fireEvent.click(screen.getAllByText('Localização')[2]);

    const dialog = screen.getByRole('dialog', { name: 'Detalhes de Serviço Taubaté' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Cidade: Taubaté')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Sem métricas' })[0]);
    act(() => { vi.advanceTimersByTime(60); });
    expect(screen.queryByRole('dialog', { name: 'Detalhes de Serviço Taubaté' })).not.toBeInTheDocument();
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
      'https://tile.openstreetmap.org/13/3050/4641.png'
    );
  });
});
