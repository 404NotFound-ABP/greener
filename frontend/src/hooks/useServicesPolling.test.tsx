import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useServicesPolling } from './useServicesPolling';
import type { ServiceRepository } from '../adapters/serviceAdapter';
import type { ServiceData } from '../types/service';

const service = (id: string): ServiceData => ({
  id,
  nome: id,
  status: 'Ativo',
  localizacao: { pais: 'Brasil', regiao: 'Sudeste', cidade: 'Taubaté' },
  valores: { kwh: 1, gco2e: 2 },
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('atualização dos serviços', () => {
  it('consulta novamente no intervalo e registra a última atualização bem-sucedida', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-21T12:00:00'));
    const fetchAll = vi.fn()
      .mockResolvedValueOnce([service('primeiro')])
      .mockResolvedValueOnce([service('segundo')]);
    const repository = { fetchAll } as unknown as ServiceRepository;
    const { result } = renderHook(() => useServicesPolling({
      repository, initialServices: [], pollingIntervalMs: 5000,
    }));

    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.services.map((item) => item.id)).toEqual(['primeiro']);
    const firstSuccess = result.current.lastSuccessTimestamp;

    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(fetchAll).toHaveBeenCalledTimes(2);
    expect(result.current.services.map((item) => item.id)).toEqual(['segundo']);
    expect(result.current.lastSuccessTimestamp).toBeGreaterThan(firstSuccess);
    expect(result.current.lastUpdate).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('preserva os últimos serviços e horário de sucesso após falha', async () => {
    const fetchAll = vi.fn()
      .mockResolvedValueOnce([service('conhecido')])
      .mockRejectedValueOnce(new Error('rede indisponível'));
    const repository = { fetchAll } as unknown as ServiceRepository;
    const { result } = renderHook(() => useServicesPolling({
      repository, initialServices: [], pollingIntervalMs: 5000,
    }));

    await waitFor(() => expect(result.current.services.map((item) => item.id)).toEqual(['conhecido']));
    const firstSuccess = result.current.lastSuccessTimestamp;
    await act(async () => { await result.current.triggerRefresh(); });

    expect(result.current.hasError).toBe(true);
    expect(result.current.services.map((item) => item.id)).toEqual(['conhecido']);
    expect(result.current.lastSuccessTimestamp).toBe(firstSuccess);
  });
});
