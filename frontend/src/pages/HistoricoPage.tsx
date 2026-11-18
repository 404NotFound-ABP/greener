import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';

interface ColetaMetrica {
  id: number;
  servidorId: string;
  codigoRegiao: string | null;
  status: string;
  intervaloSegundos: number | null;
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

type StatusColeta = string;
type FiltrosAplicados = {
  servidorId: string;
  busca: string;
  inicio: number;
  fim: number;
};

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');
const HISTORICO_URL = `${API_BASE_URL}/coleta/historico`;
const LIMITE_HISTORICO = 10000;
const ITENS_POR_PAGINA = 10;

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

const isColetaMetrica = (value: unknown): value is ColetaMetrica => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'number' &&
    typeof record.servidorId === 'string' &&
    typeof record.status === 'string' &&
    typeof record.coletadoEm === 'string' &&
    !Number.isNaN(Date.parse(record.coletadoEm))
  );
};

const getStatusLabel = (status: string): StatusColeta => {
  const normalized = status.toLowerCase().trim();
  if (normalized === 'disponivel' || normalized === 'disponível' || normalized === 'ativo') {
    return 'Disponível';
  }
  if (normalized === 'indisponivel' || normalized === 'indisponível') return 'Indisponível';
  if (normalized === 'sem_metricas' || normalized === 'sem métricas') return 'Sem métricas';
  return status;
};

const getStatusClass = (status: string): string => {
  const label = getStatusLabel(status);
  if (label === 'Disponível') return 'border-[#14C45A] bg-[#2FA862]/20 text-[#B9F6CE]';
  if (label === 'Indisponível') return 'border-[#F35B1B] bg-[#9E2B25]/30 text-[#FFD1C2]';
  return 'border-[#B5BDB8] bg-[#46524B]/40 text-[#E1E7E3]';
};

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));

const formatMetric = (value: string | number | null, unit: string): string => {
  if (value === null || value === '') return 'Não informado';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 'Valor inválido';
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 6 }).format(numericValue)} ${unit}`;
};

const METRICAS: Array<{
  label: string;
  field: keyof Pick<
    ColetaMetrica,
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
}> = [
  { label: 'CPU', field: 'cpuPercent', unit: '%' },
  { label: 'Memória', field: 'memoriaGb', unit: 'GB' },
  { label: 'Disco', field: 'discoGb', unit: 'GB' },
  { label: 'Rede', field: 'redeGb', unit: 'GB' },
  { label: 'Potência', field: 'potenciaWatts', unit: 'W' },
  { label: 'Energia', field: 'energiaKwh', unit: 'kWh' },
  { label: 'Intensidade de carbono', field: 'carbonIntensityFator', unit: 'gCO₂e/kWh' },
  { label: 'Emissões', field: 'emissoesGco2e', unit: 'gCO₂e' },
];

function MetricasColeta({ coleta }: { coleta: ColetaMetrica }) {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {METRICAS.map(({ label, field, unit }) => (
        <div key={field} className="min-w-0 rounded-lg bg-[#07150E] px-3 py-2">
          <dt className="text-[11px] text-[#9DB0A4]">{label}</dt>
          <dd className="break-words text-xs font-medium text-[#F2FAF5]">
            {formatMetric(coleta[field], unit)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export const HistoricoPage = () => {
  const [periodoInicial] = useState(() => {
    const fim = new Date();
    const inicio = new Date(fim);
    inicio.setDate(inicio.getDate() - 29);
    return {
      dataInicio: formatDateInput(inicio),
      dataFim: formatDateInput(fim),
      inicio: new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate()).getTime(),
      fim: new Date(fim.getFullYear(), fim.getMonth(), fim.getDate(), 23, 59, 59, 999).getTime(),
    };
  });
  const [coletas, setColetas] = useState<ColetaMetrica[]>([]);
  const [servidorId, setServidorId] = useState('');
  const [busca, setBusca] = useState('');
  const [dataInicio, setDataInicio] = useState(periodoInicial.dataInicio);
  const [dataFim, setDataFim] = useState(periodoInicial.dataFim);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosAplicados>({
    servidorId: '',
    busca: '',
    inicio: periodoInicial.inicio,
    fim: periodoInicial.fim,
  });
  const [ordem, setOrdem] = useState<'desc' | 'asc'>('desc');
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [erroPeriodo, setErroPeriodo] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [servicosConhecidos, setServicosConhecidos] = useState<string[]>([]);
  const requestRef = useRef<AbortController | null>(null);

  const carregarHistorico = useCallback(async (filtroServidorId: string) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setCarregando(true);
    setErro(null);

    try {
      const url = new URL(HISTORICO_URL);
      url.searchParams.set('limite', String(LIMITE_HISTORICO));
      if (filtroServidorId) url.searchParams.set('servidorId', filtroServidorId);

      const response = await fetch(url.toString(), { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`A API respondeu com erro HTTP ${response.status}.`);
      }

      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error('A resposta da API não está no formato esperado para o histórico.');
      }
      const registros = payload.filter(isColetaMetrica);
      if (registros.length !== payload.length) {
        throw new Error('A resposta da API contém coletas com formato inválido.');
      }
      if (controller.signal.aborted) return;

      setColetas(registros);
      setServicosConhecidos((atuais) =>
        [...new Set([...atuais, ...registros.map((registro) => registro.servidorId)])]
          .sort((a, b) => a.localeCompare(b)),
      );
      setAtualizadoEm(new Date());
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setErro(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao consultar o histórico.');
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    void Promise.resolve().then(() => {
      if (ativo) void carregarHistorico('');
    });
    return () => {
      ativo = false;
      requestRef.current?.abort();
    };
  }, [carregarHistorico]);

  const coletasFiltradas = useMemo(() => {
    const termo = filtrosAplicados.busca.toLocaleLowerCase('pt-BR');
    return coletas
      .filter((coleta) => {
        const instante = Date.parse(coleta.coletadoEm);
        const correspondePeriodo = instante >= filtrosAplicados.inicio && instante <= filtrosAplicados.fim;
        const correspondeServico =
          !filtrosAplicados.servidorId || coleta.servidorId === filtrosAplicados.servidorId;
        const correspondeBusca = !termo || coleta.servidorId.toLocaleLowerCase('pt-BR').includes(termo);
        return correspondePeriodo && correspondeServico && correspondeBusca;
      })
      .sort((a, b) =>
        ordem === 'desc'
          ? Date.parse(b.coletadoEm) - Date.parse(a.coletadoEm)
          : Date.parse(a.coletadoEm) - Date.parse(b.coletadoEm),
      );
  }, [coletas, filtrosAplicados, ordem]);

  const totalPaginas = Math.max(1, Math.ceil(coletasFiltradas.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const coletasVisiveis = coletasFiltradas.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA,
  );

  const enviarFiltros = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const inicio = parseDateInput(dataInicio);
    const fim = parseDateInput(dataFim);
    if (!inicio || !fim) {
      setErroPeriodo('Informe datas válidas para o período.');
      return;
    }
    if (inicio.getTime() > fim.getTime()) {
      setErroPeriodo('A data inicial não pode ser posterior à data final.');
      return;
    }

    setErroPeriodo(null);
    setPagina(1);
    setFiltrosAplicados({
      servidorId,
      busca: busca.trim(),
      inicio: inicio.getTime(),
      fim: fim.getTime() + 24 * 60 * 60 * 1000 - 1,
    });
    void carregarHistorico(servidorId);
  };

  const contagemStatus = (status: string) =>
    coletasFiltradas.filter((coleta) => getStatusLabel(coleta.status) === status).length;

  const atualizarHorario = atualizadoEm
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(atualizadoEm)
    : null;

  return (
    <div className="min-h-full bg-[#07150E] p-4 pb-24 font-sans text-[#F2FAF5] sm:p-6 md:p-8">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Histórico de coletas</h1>
          <p className="mt-1 text-sm text-[#9DB0A4]">
            Consulte as medições salvas por serviço e período.
          </p>
        </div>
        {atualizarHorario && (
          <p className="text-xs text-[#9DB0A4]">Última consulta: {atualizarHorario}</p>
        )}
      </header>

      <form
        onSubmit={enviarFiltros}
        className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border-2 border-[#385E47] bg-[#0D2115] p-4 sm:grid-cols-2 lg:grid-cols-5 sm:p-5"
      >
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[#D4E3DA]">
          Serviço
          <select
            aria-label="Serviço"
            value={servidorId}
            onChange={(event) => setServidorId(event.target.value)}
            className="min-h-11 rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 text-sm text-[#F2FAF5] focus:border-[#14C45A] focus:outline-none"
          >
            <option value="">Todos os serviços</option>
            {servicosConhecidos.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-[#D4E3DA]">
          Buscar serviço
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Digite o ID do serviço"
            className="min-h-11 rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 text-sm text-[#F2FAF5] placeholder-[#9DB0A4] focus:border-[#14C45A] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-[#D4E3DA]">
          Data inicial
          <input
            aria-label="Data inicial"
            type="date"
            value={dataInicio}
            onChange={(event) => setDataInicio(event.target.value)}
            className="min-h-11 rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 text-sm text-[#F2FAF5] focus:border-[#14C45A] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-[#D4E3DA]">
          Data final
          <input
            aria-label="Data final"
            type="date"
            value={dataFim}
            onChange={(event) => setDataFim(event.target.value)}
            className="min-h-11 rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 text-sm text-[#F2FAF5] focus:border-[#14C45A] focus:outline-none"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={carregando}
            className="min-h-11 w-full rounded-lg border-2 border-[#14C45A] bg-[#1F8A4C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2FA862] disabled:cursor-wait disabled:opacity-60"
          >
            {carregando ? 'Carregando...' : 'Aplicar filtros'}
          </button>
        </div>
        {erroPeriodo && (
          <p role="alert" className="text-sm text-[#FFD1C2] sm:col-span-2 lg:col-span-5">
            {erroPeriodo}
          </p>
        )}
      </form>

      {erro && (
        <div role="alert" className="mb-5 flex flex-col gap-3 rounded-xl border border-red-500/60 bg-red-950/40 p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between">
          <span>Não foi possível carregar o histórico: {erro}</span>
          <button
            type="button"
            onClick={() => void carregarHistorico(filtrosAplicados?.servidorId ?? '')}
            disabled={carregando}
            className="self-start rounded-lg border border-red-300/70 px-3 py-2 font-semibold hover:bg-red-900/50 disabled:opacity-60 sm:self-auto"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {filtrosAplicados && (
        <>
          <section aria-label="Resumo das coletas no período" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Coletas no período', value: coletasFiltradas.length },
              { label: 'Disponíveis', value: contagemStatus('Disponível') },
              { label: 'Indisponíveis', value: contagemStatus('Indisponível') },
              { label: 'Sem métricas', value: contagemStatus('Sem métricas') },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border-2 border-[#385E47] bg-[#0D2115] p-4">
                <p className="text-xs text-[#9DB0A4]">{item.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border-2 border-[#385E47] bg-[#0D2115] p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold sm:text-xl">Medições registradas</h2>
                <p className="mt-1 text-xs text-[#9DB0A4]">
                  {ordem === 'desc' ? 'Mais recentes primeiro' : 'Mais antigas primeiro'} · {coletasFiltradas.length} registros
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPagina(1);
                  setOrdem((atual) => (atual === 'desc' ? 'asc' : 'desc'));
                }}
                className="min-h-10 rounded-lg border border-[#4A6B57] bg-[#07150E] px-3 text-sm hover:border-[#14C45A]"
              >
                Ordenar: {ordem === 'desc' ? 'mais recentes' : 'mais antigas'}
              </button>
            </div>

            {carregando && (
              <p role="status" aria-live="polite" className="rounded-lg bg-[#07150E] p-5 text-center text-sm text-[#D4E3DA]">
                Carregando coletas salvas...
              </p>
            )}

            {!carregando && !erro && coletasFiltradas.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#4A6B57] bg-[#09180F] px-4 py-10 text-center">
                <p className="font-semibold">Nenhuma coleta encontrada neste período.</p>
                <p className="mt-1 text-sm text-[#9DB0A4]">
                  Verifique o serviço selecionado e as datas informadas.
                </p>
              </div>
            )}

            {!carregando && !erro && coletasFiltradas.length > 0 && (
              <>
                <div className="space-y-3 md:hidden">
                  {coletasVisiveis.map((coleta) => (
                    <article key={coleta.id} className="space-y-3 rounded-xl border border-[#385E47] bg-[#09180F] p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{coleta.servidorId}</h3>
                          <p className="text-xs text-[#9DB0A4]">{formatDateTime(coleta.coletadoEm)}</p>
                        </div>
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${getStatusClass(coleta.status)}`}>
                          {getStatusLabel(coleta.status)}
                        </span>
                      </div>
                      <MetricasColeta coleta={coleta} />
                      <p className="text-xs text-[#9DB0A4]">
                        Região: {coleta.codigoRegiao ?? 'Não informada'}
                        {coleta.intervaloSegundos !== null && ` · Intervalo: ${coleta.intervaloSegundos} s`}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#96AA9E] text-xs font-semibold text-[#07150E]">
                        <th className="rounded-l-lg px-3 py-3">Serviço · data e hora</th>
                        <th className="px-3 py-3">Status</th>
                        {METRICAS.map(({ label, unit, field }) => (
                          <th key={field} className="px-3 py-3">{label} ({unit})</th>
                        ))}
                        <th className="rounded-r-lg px-3 py-3">Indicadores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coletasVisiveis.map((coleta) => (
                        <tr key={coleta.id} className="border-b border-[#243F2F] align-top">
                          <td className="px-3 py-3">
                            <div className="font-semibold">{coleta.servidorId}</div>
                            <time className="text-xs text-[#9DB0A4]" dateTime={coleta.coletadoEm}>
                              {formatDateTime(coleta.coletadoEm)}
                            </time>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`whitespace-nowrap rounded-lg border px-2 py-1 text-xs font-semibold ${getStatusClass(coleta.status)}`}>
                              {getStatusLabel(coleta.status)}
                            </span>
                          </td>
                          {METRICAS.map(({ field, unit }) => (
                            <td key={field} className="whitespace-nowrap px-3 py-3 text-[#D4E3DA]">
                              {formatMetric(coleta[field], unit)}
                            </td>
                          ))}
                          <td className="px-3 py-3 text-xs text-[#D4E3DA]">
                            <div>Região: {coleta.codigoRegiao ?? 'Não informada'}</div>
                            <div>Intervalo: {coleta.intervaloSegundos === null ? 'Não informado' : `${coleta.intervaloSegundos} s`}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <footer className="mt-5 flex flex-col items-center justify-between gap-3 text-xs text-[#9DB0A4] sm:flex-row">
                  <span>
                    Mostrando {(paginaAtual - 1) * ITENS_POR_PAGINA + 1}–{Math.min(paginaAtual * ITENS_POR_PAGINA, coletasFiltradas.length)} de {coletasFiltradas.length} coletas
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Página anterior"
                      onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
                      disabled={paginaAtual === 1}
                      className="min-h-10 rounded-lg border border-[#4A6B57] px-3 disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <span aria-live="polite">Página {paginaAtual} de {totalPaginas}</span>
                    <button
                      type="button"
                      aria-label="Próxima página"
                      onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className="min-h-10 rounded-lg border border-[#4A6B57] px-3 disabled:opacity-40"
                    >
                      Próxima
                    </button>
                  </div>
                </footer>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
};
