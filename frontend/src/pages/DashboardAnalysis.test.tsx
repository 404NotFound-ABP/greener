import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

vi.mock('../components/ServiceModal', () => ({
  ServiceModal: ({ service }: { service: { name: string } }) => <div>Detalhes: {service.name}</div>,
}));

const dashboardPayload = {
  resumo: {
    total_servidores: 2,
    disponiveis: 2,
    indisponiveis: 0,
    servidores_com_metricas: 2,
    servidores_sem_metricas: 0,
    cobertura_parcial: false,
    periodo_inicio: '2026-11-15T10:00:00.000Z',
    periodo_fim: '2026-11-15T10:00:00.000Z',
    janela_amostragem_segundos: 300,
    intervalo_atualizacao_segundos: 300,
    consumo_total_acumulado_kwh: 3,
    emissoes_total_acumuladas_gco2e: 3,
  },
  servidores: [
    {
      id: 'zeta-api',
      nome: 'Zeta API',
      status: 'disponivel',
      regiao: null,
      ultima_coleta: {
        potencia_watts: 10,
        energia_kwh: 1,
        emissoes_gco2e: 2,
        coletado_em: '2026-11-15T10:00:00.000Z',
      },
    },
    {
      id: 'alpha-api',
      nome: 'Alpha API',
      status: 'disponivel',
      regiao: null,
      ultima_coleta: {
        potencia_watts: 20,
        energia_kwh: 2,
        emissoes_gco2e: 1,
        coletado_em: '2026-11-15T10:00:00.000Z',
      },
    },
  ],
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(dashboardPayload),
      })
    )
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

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
    fireEvent.click(screen.getByRole('button', { name: 'Remover ASTAH-ABC da demonstração' }));

    // Assert
    expect(screen.getByText('4 de 5 serviços')).toBeInTheDocument();
  });

  it('ordena os serviços pelo critério escolhido no ranking', async () => {
    // Arrange
    render(<DashboardPage />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Ordem alfabética (A–Z)' }));
    const linhas = await screen.findAllByRole('row');
    const serviceRows = linhas.filter((linha) => linha.textContent?.includes('-api'));

    // Assert
    expect(serviceRows[0]).toHaveTextContent('Alpha API');
  });
});
