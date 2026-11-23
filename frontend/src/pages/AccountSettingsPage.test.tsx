import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountSettingsPage } from './AccountSettingsPage';

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('configuração dos intervalos', () => {
  it('consulta e salva os intervalos na API com token administrativo', async () => {
    localStorage.setItem('token', 'jwt-admin');
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'PUT') return Promise.resolve(response({
        intervalo_coleta_segundos: 900,
        intervalo_atualizacao_segundos: 1800,
      }));
      if (url.endsWith('/configuracao')) return Promise.resolve(response({
        intervalo_coleta_segundos: 300,
        intervalo_atualizacao_segundos: 300,
      }));
      return Promise.resolve(response({ intervaloConfiguradoSegundos: 300, intervaloAtualizacaoSegundos: 300 }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<AccountSettingsPage />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/coleta/configuracao'),
      expect.objectContaining({ headers: { Authorization: 'Bearer jwt-admin' } })));
    fireEvent.change(screen.getByLabelText('Intervalo de coleta dos agentes'), { target: { value: '900' } });
    fireEvent.change(screen.getByLabelText('Mudar tempo de atualização'), { target: { value: '1800' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar intervalos' }));

    await waitFor(() => expect(screen.getByText(/salvos e aplicados ao coletor com sucesso/)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/coleta/configuracao'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-admin' }),
        body: JSON.stringify({ intervalo_coleta_segundos: 900, intervalo_atualizacao_segundos: 1800 }),
      }));
  });

  it('mantém a configuração anterior quando a API recusa permissão', async () => {
    const fetchMock = vi.fn((_url: string, options?: RequestInit) =>
      Promise.resolve(options?.method === 'PUT'
        ? response({}, 403)
        : response({ intervaloConfiguradoSegundos: 300, intervaloAtualizacaoSegundos: 300 })));
    vi.stubGlobal('fetch', fetchMock);
    render(<AccountSettingsPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText('Intervalo de coleta dos agentes'), { target: { value: '900' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar intervalos' }));

    await waitFor(() => expect(screen.getByText(/Permissão de administrador necessária/)).toBeInTheDocument());
    expect(screen.getByLabelText('Intervalo de coleta dos agentes')).toHaveValue('300');
  });
});
