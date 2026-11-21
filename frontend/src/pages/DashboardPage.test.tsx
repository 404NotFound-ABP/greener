import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';
import type { DashboardService, DashboardSummary } from '../hooks/useDashboardSummary';

vi.mock('../components/ServiceModal', () => ({
  ServiceModal: ({ service }: { service: { name: string } }) => <div>Detalhes: {service.name}</div>,
}));

const summary: DashboardSummary = {
  total_servidores: 3,
  disponiveis: 1,
  indisponiveis: 1,
  servidores_com_metricas: 2,
  servidores_sem_metricas: 1,
  cobertura_parcial: true,
  periodo_inicio: '2026-11-01T10:00:00.000Z',
  periodo_fim: '2026-11-15T10:00:00.000Z',
  janela_amostragem_segundos: 2_592_000,
  intervalo_atualizacao_segundos: 300,
  consumo_total_acumulado_kwh: 123.45,
  emissoes_total_acumuladas_gco2e: 678.9,
};

const services: DashboardService[] = [
  {
    id: 'billing-api',
    nome: 'Billing API',
    status: 'disponivel',
    regiao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'São Paulo' },
    ultima_coleta: {
      potencia_watts: 42.1,
      energia_kwh: 10.25,
      emissoes_gco2e: 123.4,
      coletado_em: '2026-11-15T10:00:00.000Z',
    },
  },
  {
    id: 'search-worker',
    nome: 'Search Worker',
    status: 'indisponivel',
    regiao: { pais: 'Brasil', regiao: 'Sul', cidade: 'Curitiba' },
    ultima_coleta: {
      potencia_watts: 15,
      energia_kwh: null,
      emissoes_gco2e: null,
      coletado_em: '2026-11-14T10:00:00.000Z',
    },
  },
  {
    id: 'empty-service',
    nome: 'Empty Service',
    status: 'sem_metricas',
    regiao: null,
    ultima_coleta: null,
  },
];

function stubDashboardApi(
  dashboardSummary = summary,
  dashboardServices: DashboardService[] = services
) {
  const buscar = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    const payload = url.endsWith('/servidores/dashboard')
      ? { resumo: dashboardSummary, servidores: dashboardServices }
      : url.endsWith('/servidores')
        ? dashboardServices.map(({ id, nome }) => ({ id, nome }))
        : url.includes('/historico?')
          ? {
              pontos: [
                { timestamp: new Date(Date.now() - 30 * 60_000).toISOString(), energia_kwh: 0.4 },
                { timestamp: new Date(Date.now() - 10 * 60_000).toISOString(), energia_kwh: 0.7 },
              ],
            }
        : [];
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(payload),
    });
  });
  vi.stubGlobal('fetch', buscar);
  return buscar;
}

describe('DashboardPage', () => {
  beforeEach(() => {
    stubDashboardApi();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra indicadores integrados, período e cobertura parcial', async () => {
    const buscar = stubDashboardApi();
    render(<DashboardPage />);

    const energia = screen.getByRole('article', { name: 'Energia total' });
    await waitFor(() => expect(energia).toHaveTextContent('123,45 kWh'));
    await waitFor(() =>
      expect(screen.getByRole('article', { name: 'Emissão total' })).toHaveTextContent(
        '678,9 gCO₂e'
      )
    );
    expect(screen.getByRole('article', { name: 'Serviços ativos' })).toHaveTextContent('1');
    expect(screen.getByRole('article', { name: 'Serviços indisponíveis' })).toHaveTextContent('1');
    expect(screen.getByText(/Período das coletas:/)).toHaveTextContent('janela de 1 mês (30d)');
    expect(screen.getByText('Totais parciais: métricas disponíveis para 2 de 3 serviços; 1 sem métricas.')).toBeInTheDocument();
    expect(screen.getByText('Dados da API')).toBeInTheDocument();
    expect(buscar).toHaveBeenCalledWith(
      'http://localhost:3001/api/servidores/dashboard',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('não transforma métricas ausentes em zero', async () => {
    stubDashboardApi({
      ...summary,
      consumo_total_acumulado_kwh: null,
      emissoes_total_acumuladas_gco2e: null,
    });
    render(<DashboardPage />);

    await waitFor(() =>
      expect(screen.getByRole('article', { name: 'Energia total' })).toHaveTextContent(
        'Indisponível'
      )
    );
    expect(screen.getByRole('article', { name: 'Emissão total' })).toHaveTextContent('Indisponível');
  });

  it('mostra identificadores e métricas reais da última coleta com as unidades da API', async () => {
    render(<DashboardPage />);

    const tabela = await screen.findByRole('table');

    expect(tabela).toHaveTextContent('Billing API');
    expect(tabela).toHaveTextContent('ID: billing-api');
    expect(tabela).toHaveTextContent('10,25');
    expect(tabela).toHaveTextContent('123,4');
    expect(tabela).toHaveTextContent('Energia na última coleta (kWh)');
    expect(tabela).toHaveTextContent('Emissão na última coleta (gCO₂e)');
    expect(tabela).not.toHaveTextContent('ASTAH-XYZ');
  });

  it('preserva métricas nulas e informa quando não há leitura', async () => {
    render(<DashboardPage />);

    const tabela = await screen.findByRole('table');
    const workerRow = screen.getByRole('row', { name: /Search Worker/ });
    const emptyRow = screen.getByRole('row', { name: /Empty Service/ });

    expect(workerRow).toHaveTextContent('Indisponível');
    expect(emptyRow).toHaveTextContent('Indisponível');
    expect(tabela).toHaveTextContent('Sem leitura');
  });

  it('normaliza os três estados da API e mostra texto com ícone', async () => {
    render(<DashboardPage />);
    await screen.findByRole('table');

    const activeRow = screen.getByRole('row', { name: /Billing API/ });
    const unavailableRow = screen.getByRole('row', { name: /Search Worker/ });
    const noMetricsRow = screen.getByRole('row', { name: /Empty Service/ });

    expect(activeRow).toHaveTextContent('Ativo');
    expect(unavailableRow).toHaveTextContent('Indisponível');
    expect(noMetricsRow).toHaveTextContent('Sem métricas');
    expect(activeRow.querySelector('svg')).not.toBeNull();
    expect(unavailableRow.querySelector('svg')).not.toBeNull();
    expect(noMetricsRow.querySelector('svg')).not.toBeNull();
  });

  it('filtra os serviços pelo nome e identificador vindos da API', async () => {
    render(<DashboardPage />);

    fireEvent.change(screen.getByPlaceholderText('Pesquise por um serviço aqui'), {
      target: { value: 'billing-api' },
    });

    expect(await screen.findByRole('row', { name: /Billing API/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Search Worker/ })).not.toBeInTheDocument();
  });

  it('preenche e aplica os filtros geográficos com dados da API', async () => {
    render(<DashboardPage />);
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: 'Todas as regiões' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sul' }));

    expect(screen.getByRole('row', { name: /Search Worker/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Billing API/ })).not.toBeInTheDocument();
  });

  it('filtra serviços usando os estados normalizados da API', async () => {
    render(<DashboardPage />);
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: 'Todos os status' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sem métricas' }));

    expect(screen.getByRole('row', { name: /Empty Service/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Billing API/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Search Worker/ })).not.toBeInTheDocument();
  });

  it('informa quando a busca não encontra serviços', async () => {
    render(<DashboardPage />);

    fireEvent.change(screen.getByPlaceholderText('Pesquise por um serviço aqui'), {
      target: { value: 'serviço-inexistente' },
    });

    expect(await screen.findByText('Nenhum serviço encontrado')).toBeInTheDocument();
  });

  it('não mostra exemplos fixos durante o carregamento da API', async () => {
    const buscar = stubDashboardApi();
    render(<DashboardPage />);

    expect(screen.getByText('Carregando serviços')).toBeInTheDocument();
    await waitFor(() =>
      expect(buscar).toHaveBeenCalledWith(
        'http://localhost:3001/api/servidores/dashboard',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    );
    const row = await screen.findByRole('row', { name: /Billing API/ });
    expect(row).toBeInTheDocument();
    expect(screen.getByRole('table')).not.toHaveTextContent('ASTAH-XYZ');
  });

  it('carrega históricos reais e permite selecionar serviços da API para o gráfico', async () => {
    const additionalServices = Array.from({ length: 3 }, (_, index) => ({
      ...services[2],
      id: `extra-service-${index + 1}`,
      nome: `Serviço extra ${index + 1}`,
    }));
    const buscar = stubDashboardApi(summary, [...services, ...additionalServices]);
    render(<DashboardPage />);

    const billing = await screen.findByRole('checkbox', { name: 'Billing API' });
    const searchWorker = screen.getByRole('checkbox', { name: 'Search Worker' });
    const extraService = screen.getByRole('checkbox', { name: 'Serviço extra 3' });
    await waitFor(() => {
      expect(billing).toBeChecked();
      expect(searchWorker).toBeChecked();
      expect(extraService).toBeDisabled();
    });

    await waitFor(() =>
      expect(buscar).toHaveBeenCalledWith(
        expect.stringMatching(/\/servidores\/billing-api\/historico\?limite=1000&janelaSegundos=3600/),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    );
    expect(await screen.findByRole('button', { name: /Billing API: 0\.4 kWh/ })).toBeInTheDocument();

    fireEvent.click(billing);
    fireEvent.click(extraService);
    expect(billing).not.toBeChecked();
    expect(extraService).toBeChecked();
  });

  it('informa quando a API retorna uma lista vazia', async () => {
    stubDashboardApi(summary, []);
    render(<DashboardPage />);

    expect(await screen.findByText('A API não retornou serviços')).toBeInTheDocument();
  });

  it('abre os detalhes usando o identificador real do serviço', async () => {
    render(<DashboardPage />);

    fireEvent.click(await screen.findByRole('row', { name: /Billing API/ }));
    expect(await screen.findByText('Detalhes: Billing API')).toBeInTheDocument();
  });

  it('abre e fecha a página de comparação de serviços', async () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Comparar serviços' }));

    expect(await screen.findByRole('heading', { name: 'Comparação de serviços' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar aos dashboards' }));
    expect(screen.getByRole('heading', { name: 'Dashboards' })).toBeInTheDocument();
  });
});
