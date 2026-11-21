import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ApiService {
  id: string;
  name: string;
}

interface CollectionRecord {
  id: number;
  servidorId: string;
  status: string;
  cpuPercent: string | number | null;
  memoriaGb: string | number | null;
  discoGb: string | number | null;
  redeGb: string | number | null;
  potenciaWatts: string | number | null;
  energiaKwh: string | number | null;
  carbonIntensityFator: string | number | null;
  emissoesGco2e: string | number | null;
  coletadoEm: string;
}

interface ComparisonResult {
  service: ApiService;
  records: CollectionRecord[];
}

interface ServiceComparisonPageProps {
  onBack: () => void;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');
const SERVICE_URL = `${API_BASE_URL}/servidores`;
const HISTORY_URL = `${API_BASE_URL}/coleta/historico`;
const MAX_COLLECTIONS_PER_SERVICE = 10000;

const METRICS: Array<{
  label: string;
  field: keyof Pick<
    CollectionRecord,
    | 'cpuPercent'
    | 'memoriaGb'
    | 'discoGb'
    | 'redeGb'
    | 'potenciaWatts'
    | 'energiaKwh'
    | 'carbonIntensityFator'
    | 'emissoesGco2e'
  >;
  unit: string;
  aggregation: 'average' | 'sum';
}> = [
  { label: 'CPU', field: 'cpuPercent', unit: '%', aggregation: 'average' },
  { label: 'Memória', field: 'memoriaGb', unit: 'GB', aggregation: 'average' },
  { label: 'Disco', field: 'discoGb', unit: 'GB', aggregation: 'average' },
  { label: 'Rede', field: 'redeGb', unit: 'GB', aggregation: 'average' },
  { label: 'Potência', field: 'potenciaWatts', unit: 'W', aggregation: 'average' },
  { label: 'Energia', field: 'energiaKwh', unit: 'kWh', aggregation: 'sum' },
  {
    label: 'Intensidade de carbono',
    field: 'carbonIntensityFator',
    unit: 'gCO₂e/kWh',
    aggregation: 'average'
  },
  { label: 'Emissões', field: 'emissoesGco2e', unit: 'gCO₂e', aggregation: 'sum' }
];

const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
  if (
    date.getFullYear() !== Number(yearText) ||
    date.getMonth() !== Number(monthText) - 1 ||
    date.getDate() !== Number(dayText)
  ) {
    return null;
  }
  return date;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function parseServices(payload: unknown): ApiService[] {
  if (!Array.isArray(payload)) {
    throw new Error('A resposta da API não está no formato esperado para a lista de serviços.');
  }

  return payload.map((item, index) => {
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id.trim()) {
      throw new Error(`O serviço ${index + 1} recebido da API não possui um ID válido.`);
    }
    const name =
      typeof item.nome === 'string' && item.nome.trim()
        ? item.nome.trim()
        : typeof item.name === 'string' && item.name.trim()
        ? item.name.trim()
        : item.id;
    return { id: item.id, name };
  });
}

function isCollectionRecord(value: unknown): value is CollectionRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'number' &&
    typeof value.servidorId === 'string' &&
    typeof value.status === 'string' &&
    typeof value.coletadoEm === 'string' &&
    !Number.isNaN(Date.parse(value.coletadoEm))
  );
}

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`A API respondeu com erro HTTP ${response.status}.`);
  }
  return response.json();
}

function aggregateMetric(
  records: CollectionRecord[],
  field: (typeof METRICS)[number]['field'],
  aggregation: 'average' | 'sum'
): number | null {
  const values = records
    .map(record => record[field])
    .filter((value): value is string | number => value !== null && value !== '')
    .map(Number)
    .filter(Number.isFinite);
  if (values.length === 0) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  return aggregation === 'sum' ? total : total / values.length;
}

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 6 });

export const ServiceComparisonPage: React.FC<ServiceComparisonPageProps> = ({ onBack }) => {
  const [services, setServices] = useState<ApiService[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState(() => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { start: formatDateInput(start), end: formatDateInput(end) };
  });
  const [results, setResults] = useState<ComparisonResult[] | null>(null);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const servicesRequest = useRef<AbortController | null>(null);
  const comparisonRequest = useRef<AbortController | null>(null);

  const loadServices = useCallback(async () => {
    servicesRequest.current?.abort();
    const controller = new AbortController();
    servicesRequest.current = controller;
    setLoadingServices(true);
    setError(null);
    try {
      const payload = await fetchJson(SERVICE_URL, controller.signal);
      if (controller.signal.aborted) return;
      setServices(parseServices(payload));
    } catch (requestError: unknown) {
      if (requestError instanceof Error && requestError.name === 'AbortError') return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível carregar os serviços.'
      );
    } finally {
      if (servicesRequest.current === controller) {
        servicesRequest.current = null;
        setLoadingServices(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadServices();
    });
    return () => {
      active = false;
      servicesRequest.current?.abort();
      comparisonRequest.current?.abort();
    };
  }, [loadServices]);

  const filteredServices = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return services.filter(
      service =>
        !term ||
        service.name.toLocaleLowerCase('pt-BR').includes(term) ||
        service.id.toLocaleLowerCase('pt-BR').includes(term)
    );
  }, [search, services]);

  const toggleService = (id: string) => {
    setSelectedIds(current =>
      current.includes(id) ? current.filter(selectedId => selectedId !== id) : [...current, id]
    );
  };

  const compareServices = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPeriodError(null);
    setError(null);
    setResults(null);

    if (selectedIds.length < 2) {
      setPeriodError('Selecione pelo menos dois serviços para comparar.');
      return;
    }

    const start = parseDateInput(period.start);
    const end = parseDateInput(period.end);
    if (!start || !end) {
      setPeriodError('Informe datas válidas para o período.');
      return;
    }
    if (start.getTime() > end.getTime()) {
      setPeriodError('A data inicial não pode ser posterior à data final.');
      return;
    }

    const periodStart = start.getTime();
    const periodEnd = end.getTime() + 24 * 60 * 60 * 1000 - 1;
    const controller = new AbortController();
    comparisonRequest.current?.abort();
    comparisonRequest.current = controller;
    setLoadingComparison(true);

    try {
      const comparisons = await Promise.all(
        selectedIds.map(async id => {
          const url = new URL(HISTORY_URL);
          url.searchParams.set('servidorId', id);
          url.searchParams.set('limite', String(MAX_COLLECTIONS_PER_SERVICE));
          const payload = await fetchJson(url.toString(), controller.signal);
          if (!Array.isArray(payload)) {
            throw new Error(`O histórico de ${id} não está no formato esperado.`);
          }
          const records = payload.filter(isCollectionRecord);
          if (records.length !== payload.length) {
            throw new Error(`O histórico de ${id} contém registros inválidos.`);
          }
          return {
            service: services.find(service => service.id === id) ?? { id, name: id },
            records: records.filter(record => {
              const timestamp = Date.parse(record.coletadoEm);
              return timestamp >= periodStart && timestamp <= periodEnd;
            })
          };
        })
      );
      if (controller.signal.aborted) return;
      setResults(comparisons);
    } catch (requestError: unknown) {
      if (requestError instanceof Error && requestError.name === 'AbortError') return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível comparar os serviços.'
      );
    } finally {
      if (comparisonRequest.current === controller) {
        comparisonRequest.current = null;
        setLoadingComparison(false);
      }
    }
  };

  return (
    <div className="min-h-full bg-[#07150E] p-4 pb-24 font-sans text-[#F2FAF5] sm:p-6 md:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 text-sm text-[#A6DEBD] underline hover:text-white"
          >
            Voltar aos dashboards
          </button>
          <h1 className="text-2xl font-bold sm:text-3xl">Comparação de serviços</h1>
          <p className="mt-1 text-sm text-[#9DB0A4]">
            Compare os indicadores das coletas salvas em um mesmo período.
          </p>
        </div>
      </header>

      <form
        onSubmit={event => void compareServices(event)}
        className="mb-6 rounded-2xl border-2 border-[#385E47] bg-[#0D2115] p-4 sm:p-6"
      >
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-[#D4E3DA]">
            Data inicial
            <input
              aria-label="Data inicial"
              type="date"
              value={period.start}
              onChange={event => setPeriod(current => ({ ...current, start: event.target.value }))}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 text-[#F2FAF5]"
            />
          </label>
          <label className="text-sm font-medium text-[#D4E3DA]">
            Data final
            <input
              aria-label="Data final"
              type="date"
              value={period.end}
              onChange={event => setPeriod(current => ({ ...current, end: event.target.value }))}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 text-[#F2FAF5]"
            />
          </label>
        </div>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Serviços</h2>
            <p className="text-xs text-[#9DB0A4]">
              Selecione dois ou mais serviços para comparar.
            </p>
          </div>
          <label className="text-xs text-[#9DB0A4]">
            Buscar serviço
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Nome ou ID"
              className="mt-1 block min-h-10 w-full rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 text-sm text-[#F2FAF5] sm:w-64"
            />
          </label>
        </div>

        {loadingServices ? (
          <p role="status" className="py-4 text-sm text-[#A6DEBD]">
            Carregando serviços...
          </p>
        ) : services.length === 0 ? (
          <p className="py-4 text-sm text-[#9DB0A4]">A API não retornou serviços disponíveis.</p>
        ) : (
          <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map(service => (
              <label
                key={service.id}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#385E47] bg-[#09180F] px-3 py-2 text-sm hover:border-[#2FA862]"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(service.id)}
                  onChange={() => toggleService(service.id)}
                  className="h-4 w-4 accent-[#2FA862]"
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{service.name}</span>
                  <span className="block truncate text-xs text-[#9DB0A4]">{service.id}</span>
                </span>
              </label>
            ))}
            {filteredServices.length === 0 && (
              <p className="py-3 text-sm text-[#9DB0A4]">Nenhum serviço corresponde à busca.</p>
            )}
          </div>
        )}

        {periodError && (
          <p role="alert" className="mt-3 text-sm text-[#FFD1C2]">
            {periodError}
          </p>
        )}
        {error && (
          <div role="alert" className="mt-3 flex flex-col gap-2 text-sm text-[#FFD1C2] sm:flex-row sm:items-center">
            <span>Não foi possível carregar a comparação: {error}</span>
            {!loadingServices && services.length === 0 && (
              <button
                type="button"
                onClick={() => void loadServices()}
                className="self-start rounded-lg border border-[#F35B1B]/70 px-3 py-1.5 font-semibold hover:bg-red-900/40"
              >
                Tentar novamente
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loadingServices || loadingComparison || services.length === 0}
          className="mt-4 min-h-11 rounded-lg bg-[#1F8A4C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2FA862] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingComparison ? 'Comparando...' : 'Comparar serviços'}
        </button>
      </form>

      {loadingComparison && (
        <p role="status" className="mb-4 text-sm text-[#A6DEBD]">
          Carregando coletas do período selecionado...
        </p>
      )}

      {results && results.every(result => result.records.length === 0) && (
        <div role="status" className="rounded-xl border border-[#4A6B57] bg-[#0D2115] p-5 text-sm text-[#D4E3DA]">
          Não há coletas registradas para os serviços selecionados nesse período.
        </div>
      )}

      {results && results.some(result => result.records.length > 0) && (
        <section aria-label="Resultados da comparação" className="rounded-2xl border-2 border-[#385E47] bg-[#0D2115] p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-bold">Indicadores no período comum</h2>
          <p className="mb-4 text-xs text-[#9DB0A4]">
            Médias para uso e capacidade; totais para energia e emissões. Campos nulos são ignorados.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#96AA9E] text-xs font-semibold text-[#07150E]">
                  <th scope="col" className="rounded-l-lg px-3 py-3">Indicador</th>
                  {results.map(result => (
                    <th scope="col" key={result.service.id} className="px-3 py-3">
                      <span className="block">{result.service.name}</span>
                      <span className="block font-normal">{result.service.id}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map(metric => (
                  <tr key={metric.field} className="border-b border-[#243F2F]">
                    <th scope="row" className="px-3 py-3 font-medium">
                      {metric.label} ({metric.unit})
                    </th>
                    {results.map(result => {
                      const value = aggregateMetric(result.records, metric.field, metric.aggregation);
                      return (
                        <td key={result.service.id} className="px-3 py-3">
                          {result.records.length === 0
                            ? 'Sem registros'
                            : value === null
                            ? 'Não informado'
                            : `${numberFormatter.format(value)} ${metric.unit}`}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="px-3 py-3 font-medium">Coletas consideradas</th>
                  {results.map(result => (
                    <td key={result.service.id} className="px-3 py-3">
                      {result.records.length}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
