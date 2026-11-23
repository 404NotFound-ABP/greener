import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RankingPage } from './RankingPage';

const payload = {
  resumo: {
    total_servidores: 2, disponiveis: 2, indisponiveis: 0,
    servidores_com_metricas: 2, servidores_sem_metricas: 0,
    cobertura_parcial: false,
    periodo_inicio: '2026-11-21T10:00:00.000Z',
    periodo_fim: '2026-11-21T11:00:00.000Z',
    janela_amostragem_segundos: 3600, intervalo_atualizacao_segundos: 300,
    consumo_total_acumulado_kwh: 4, emissoes_total_acumuladas_gco2e: 7,
  },
  servidores: [
    { id: 'a', nome: 'Serviço A', status: 'disponivel', regiao: null,
      ultima_coleta: { potencia_watts: 1, energia_kwh: 3, emissoes_gco2e: 2, coletado_em: '2026-11-21T11:00:00.000Z' } },
    { id: 'b', nome: 'Serviço B', status: 'disponivel', regiao: null,
      ultima_coleta: { potencia_watts: 1, energia_kwh: 1, emissoes_gco2e: 5, coletado_em: '2026-11-21T11:00:00.000Z' } },
  ],
};

afterEach(() => vi.unstubAllGlobals());

describe('ranking por indicador', () => {
  it('ordena pela energia e depois pela emissão da janela retornada pela API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    render(<RankingPage />);
    const tabela = await screen.findByRole('region', { name: 'Tabela completa de classificação' });
    const linhas = () => Array.from(tabela.querySelectorAll('tbody tr')).filter((row) => row.textContent?.includes('Serviço'));
    await waitFor(() => expect(linhas()).toHaveLength(2));
    expect(linhas()[0]).toHaveTextContent('Serviço A');

    fireEvent.click(screen.getByRole('button', { name: 'Emissão (gCO₂e)' }));
    expect(linhas()[0]).toHaveTextContent('Serviço B');
    expect(screen.getByRole('button', { name: 'Período comum de comparação' })).toHaveTextContent('Janela atual (API)');
  });

  it('consulta o período escolhido na API antes de apresentar o ranking', async () => {
    const buscar = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal('fetch', buscar);
    render(<RankingPage />);
    await waitFor(() => expect(buscar).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Período comum de comparação' }));
    fireEvent.click(screen.getByRole('option', { name: 'Últimas 24 horas' }));

    await waitFor(() => expect(buscar.mock.calls.some(([url]) =>
      String(url).includes('/servidores/ranking') && String(url).includes('86400'))).toBe(true));
  });
});
