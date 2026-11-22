import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HistoricoPage } from './HistoricoPage';

const hoje = new Date();
const coletaHoje = new Date(
  hoje.getFullYear(),
  hoje.getMonth(),
  hoje.getDate(),
  14,
  20,
).toISOString();

const criarColeta = (sobrescritos: Record<string, unknown> = {}) => ({
  id: 1,
  servidorId: 'SERVICO-REAL',
  codigoRegiao: 'br-sudeste',
  status: 'disponivel',
  intervaloSegundos: 300,
  cpuPercent: '12.5',
  memoriaGb: '3.2',
  discoGb: '18',
  redeGb: '0.5',
  potenciaWatts: '85.7',
  energiaKwh: '0.02',
  carbonIntensityFator: '85',
  emissoesGco2e: '1.7',
  coletadoEm: coletaHoje,
  ...sobrescritos,
});

const respostaJson = (dados: unknown) => ({
  ok: true,
  status: 200,
  json: async () => dados,
});

describe('HistoricoPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exibe as coletas da API com data, status, métricas e unidades', async () => {
    const buscar = vi.fn().mockResolvedValue(
      respostaJson([criarColeta({ cpuPercent: '0', memoriaGb: null })]),
    );
    vi.stubGlobal('fetch', buscar);

    render(<HistoricoPage />);

    const linha = await screen.findByRole('row', { name: /SERVICO-REAL/ });
    expect(linha).toHaveTextContent('0 %');
    expect(linha).toHaveTextContent('Não informado');
    expect(linha).toHaveTextContent('0,02 kWh');
    expect(linha).toHaveTextContent('1,7 gCO₂e');
    expect(linha).toHaveTextContent('Disponível');
    expect(linha).toHaveTextContent('br-sudeste');
    expect(buscar).toHaveBeenCalledOnce();
    expect(String(buscar.mock.calls[0][0])).toContain('/api/coleta/historico?limite=10000');
  });

  it('filtra por serviço usando o parâmetro suportado pela API', async () => {
    const buscar = vi.fn().mockResolvedValue(
      respostaJson([
        criarColeta(),
        criarColeta({ id: 2, servidorId: 'SERVICO-OUTRO' }),
      ]),
    );
    vi.stubGlobal('fetch', buscar);

    render(<HistoricoPage />);
    await screen.findByRole('option', { name: 'SERVICO-OUTRO' });

    fireEvent.change(screen.getByRole('combobox', { name: 'Serviço' }), {
      target: { value: 'SERVICO-OUTRO' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => expect(buscar).toHaveBeenCalledTimes(2));
    const url = new URL(String(buscar.mock.calls[1][0]));
    expect(url.searchParams.get('servidorId')).toBe('SERVICO-OUTRO');
    expect(url.searchParams.get('inicio')).toBeTruthy();
    expect(url.searchParams.get('fim')).toBeTruthy();
    expect(screen.getByRole('row', { name: /SERVICO-OUTRO/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /SERVICO-REAL/ })).not.toBeInTheDocument();
  });

  it('recusa um período inválido sem fazer uma nova consulta', async () => {
    const buscar = vi.fn().mockResolvedValue(respostaJson([criarColeta()]));
    vi.stubGlobal('fetch', buscar);

    render(<HistoricoPage />);
    await screen.findByRole('row', { name: /SERVICO-REAL/ });

    fireEvent.change(screen.getByLabelText('Data inicial'), {
      target: { value: '2026-11-20' },
    });
    fireEvent.change(screen.getByLabelText('Data final'), {
      target: { value: '2026-11-18' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'A data inicial não pode ser posterior à data final.',
    );
    expect(buscar).toHaveBeenCalledOnce();
  });

  it('filtra as coletas pelo período escolhido', async () => {
    const buscar = vi.fn().mockResolvedValue(
      respostaJson([
        criarColeta(),
        criarColeta({
          id: 2,
          servidorId: 'SERVICO-FORA-DO-PERIODO',
          coletadoEm: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ]),
    );
    vi.stubGlobal('fetch', buscar);

    render(<HistoricoPage />);
    await screen.findByRole('row', { name: /SERVICO-REAL/ });

    const dataHoje = [
      hoje.getFullYear(),
      String(hoje.getMonth() + 1).padStart(2, '0'),
      String(hoje.getDate()).padStart(2, '0'),
    ].join('-');
    fireEvent.change(screen.getByLabelText('Data inicial'), {
      target: { value: dataHoje },
    });
    fireEvent.change(screen.getByLabelText('Data final'), {
      target: { value: dataHoje },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => expect(buscar).toHaveBeenCalledTimes(2));
    const urlPeriodo = new URL(String(buscar.mock.calls[1][0]));
    expect(urlPeriodo.searchParams.get('inicio')).toContain(dataHoje);
    expect(urlPeriodo.searchParams.get('fim')).toContain(dataHoje);
    expect(screen.getByRole('row', { name: /SERVICO-REAL/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /SERVICO-FORA-DO-PERIODO/ })).not.toBeInTheDocument();
  });

  it('informa quando a API não retorna coletas no período', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson([])));

    render(<HistoricoPage />);

    expect(await screen.findByText('Nenhuma coleta encontrada neste período.')).toBeInTheDocument();
  });

  it('apresenta o erro da API e permite tentar novamente', async () => {
    const buscar = vi
      .fn()
      .mockRejectedValueOnce(new Error('rede indisponível'))
      .mockResolvedValueOnce(respostaJson([criarColeta()]));
    vi.stubGlobal('fetch', buscar);

    render(<HistoricoPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('rede indisponível');

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('row', { name: /SERVICO-REAL/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('mostra mensagem de carregamento enquanto a consulta está pendente', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

    render(<HistoricoPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando coletas salvas');
  });

  it('ordena cronologicamente e mantém a paginação sincronizada com os resultados', async () => {
    const dados = Array.from({ length: 12 }, (_, index) =>
      criarColeta({
        id: index + 1,
        servidorId: `SERVICO-${String(index + 1).padStart(2, '0')}`,
        coletadoEm: new Date(Date.now() - index * 60_000).toISOString(),
      }),
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson(dados)));

    render(<HistoricoPage />);
    const primeiraPagina = await screen.findByRole('row', { name: /SERVICO-01/ });
    expect(primeiraPagina).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /SERVICO-11/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));

    expect(await screen.findByRole('row', { name: /SERVICO-11/ })).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3);
  });
});
