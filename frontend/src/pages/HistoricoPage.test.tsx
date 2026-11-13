import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HistoricoPage } from './HistoricoPage';

describe('HistoricoPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra registros com serviço, data, evento e estado', () => {
    // Arrange
    render(<HistoricoPage />);

    // Act
    const tabela = screen.getByRole('table');

    // Assert
    expect(tabela).toHaveTextContent('ASTAH-XYZ');
    expect(tabela).toHaveTextContent('17/10/2026 14:20');
    expect(tabela).toHaveTextContent('Perdeu conexão');
    expect(tabela).toHaveTextContent('Indisponível');
  });

  it('filtra os registros pelo serviço pesquisado', () => {
    // Arrange
    render(<HistoricoPage />);

    // Act
    fireEvent.change(screen.getByPlaceholderText('Pesquise por um serviço aqui'), {
      target: { value: 'ASTAH-XYZ' },
    });

    // Assert
    expect(screen.getByRole('row', { name: /ASTAH-XYZ/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /ASTAH-ABC/ })).not.toBeInTheDocument();
  });

  it('oferece controle para selecionar o período do histórico', () => {
    // Arrange
    render(<HistoricoPage />);

    // Act
    const periodo = screen.queryByRole('button', { name: /últimos 30 dias/i });

    // Assert
    expect(periodo).toBeInTheDocument();
  });

  it('exibe coletas recebidas da API em vez de registros fixos', async () => {
    // Arrange
    const buscar = vi.fn().mockResolvedValue({ ok: true, json: async () => ([{
      servidorId: 'SERVICO-REAL', coletadoEm: '2026-11-12T12:00:00Z',
      status: 'disponivel', energiaKwh: 0.02,
    }]) });
    vi.stubGlobal('fetch', buscar);

    // Act
    render(<HistoricoPage />);

    // Assert
    await waitFor(() => expect(buscar).toHaveBeenCalled());
    expect(screen.getByText('SERVICO-REAL')).toBeInTheDocument();
  });
});
