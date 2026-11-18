import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServiceComparisonPage } from './ServiceComparisonPage';

const services = [
  { id: 'api-a', nome: 'Serviço A' },
  { id: 'api-b', nome: 'Serviço B' }
];

const record = (id: number, servidorId: string, values: Record<string, unknown> = {}) => ({
  id,
  servidorId,
  codigoRegiao: 'br-sudeste',
  status: 'disponivel',
  intervaloSegundos: 30,
  cpuPercent: '20',
  memoriaGb: '4',
  discoGb: '10',
  redeGb: '1',
  potenciaWatts: '40',
  energiaKwh: '0.5',
  carbonIntensityFator: '400',
  emissoesGco2e: '200',
  coletadoEm: '2026-01-02T12:00:00.000Z',
  ...values
});

const jsonResponse = (payload: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(payload)
  });

const selectServices = async () => {
  const serviceA = await screen.findByLabelText(/Serviço A/);
  const serviceB = screen.getByLabelText(/Serviço B/);
  fireEvent.click(serviceA);
  fireEvent.click(serviceB);
};

const setPeriod = () => {
  fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-01-01' } });
  fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2026-01-03' } });
};

describe('ServiceComparisonPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('compara dois serviços no mesmo período usando os indicadores da API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith('/servidores')) return jsonResponse(services);
        const serviceId = url.searchParams.get('servidorId');
        return jsonResponse([
          record(1, serviceId ?? '', serviceId === 'api-b' ? { cpuPercent: '60', energiaKwh: '1' } : {})
        ]);
      })
    );

    render(<ServiceComparisonPage onBack={vi.fn()} />);
    await selectServices();
    setPeriod();
    fireEvent.click(screen.getByRole('button', { name: 'Comparar serviços' }));

    expect(await screen.findByRole('region', { name: 'Resultados da comparação' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('CPU (%)');
    expect(screen.getByRole('table')).toHaveTextContent('Energia (kWh)');
    expect(screen.getByRole('table')).toHaveTextContent('Intensidade de carbono (gCO₂e/kWh)');
    expect(screen.getByRole('table')).toHaveTextContent('Emissões (gCO₂e)');
    expect(screen.getByRole('table')).toHaveTextContent('20 %');
    expect(screen.getByRole('table')).toHaveTextContent('60 %');
    expect(screen.getByRole('table')).toHaveTextContent('0,5 kWh');
    expect(screen.getByRole('table')).toHaveTextContent('1 kWh');
  });

  it('informa seleção insuficiente sem consultar o histórico', async () => {
    const fetchMock = vi.fn(() => jsonResponse(services));
    vi.stubGlobal('fetch', fetchMock);
    render(<ServiceComparisonPage onBack={vi.fn()} />);

    await screen.findByLabelText(/Serviço A/);
    fireEvent.click(screen.getByRole('button', { name: 'Comparar serviços' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Selecione pelo menos dois serviços');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('recusa um período inválido', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = new URL(String(input));
      return url.pathname.endsWith('/servidores') ? jsonResponse(services) : jsonResponse([]);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<ServiceComparisonPage onBack={vi.fn()} />);
    await selectServices();
    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-02-02' } });
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2026-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comparar serviços' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'A data inicial não pode ser posterior à data final.'
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('informa quando não há coletas para o período comum', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = new URL(String(input));
        return url.pathname.endsWith('/servidores') ? jsonResponse(services) : jsonResponse([]);
      })
    );
    render(<ServiceComparisonPage onBack={vi.fn()} />);
    await selectServices();
    setPeriod();
    fireEvent.click(screen.getByRole('button', { name: 'Comparar serviços' }));

    expect(
      await screen.findByText('Não há coletas registradas para os serviços selecionados nesse período.')
    ).toBeInTheDocument();
  });

  it('mostra erro quando a API falha ao carregar o histórico', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = new URL(String(input));
        return url.pathname.endsWith('/servidores')
          ? jsonResponse(services)
          : jsonResponse({}, false, 503);
      })
    );
    render(<ServiceComparisonPage onBack={vi.fn()} />);
    await selectServices();
    setPeriod();
    fireEvent.click(screen.getByRole('button', { name: 'Comparar serviços' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('erro HTTP 503')
    );
  });
});
