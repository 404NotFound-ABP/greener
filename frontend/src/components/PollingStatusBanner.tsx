import React from 'react';

interface PollingStatusBannerProps {
  hasError: boolean;
  isStale: boolean;
  isRefreshing: boolean;
  lastUpdate: string;
  onRetry: () => void | Promise<void>;
}

/**
 * Banner de resiliência do polling (T29.3 / US09 - #113).
 *
 * Responsabilidade:
 * - Alertar o usuário quando a última consulta falhar (`hasError`) ou os dados
 *   ultrapassarem o limite de obsolescência (`isStale` > 15s), deixando claro que
 *   o último estado válido foi preservado na tela.
 * - Permitir disparo manual de nova tentativa (`onRetry`) e desaparecer
 *   automaticamente assim que a atualização voltar a ter sucesso.
 */
export const PollingStatusBanner: React.FC<PollingStatusBannerProps> = ({
  hasError,
  isStale,
  isRefreshing,
  lastUpdate,
  onRetry,
}) => {
  // Não renderiza nada enquanto os dados estiverem atualizados e sem falhas
  if (!hasError && !isStale) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`mb-6 rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
        hasError
          ? 'bg-[#2A1215]/90 border-[#EF4444]/60 text-red-100'
          : 'bg-[#291E0B]/90 border-[#F59E0B]/60 text-amber-100'
      }`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <span
          className={`mt-0.5 sm:mt-0 w-2.5 h-2.5 rounded-full shrink-0 ${
            hasError ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'
          }`}
        />
        <div className="text-xs sm:text-sm leading-relaxed">
          <span className="font-semibold">
            {hasError
              ? 'Falha ao atualizar os dados em tempo real.'
              : 'Os dados exibidos podem estar desatualizados.'}
          </span>{' '}
          <span className="opacity-90">
            Exibindo o último registro válido obtido às <strong>{lastUpdate}</strong>.
          </span>
        </div>
      </div>

      {/* Dispara recuperação imediata após falha (remove o aviso se obtiver sucesso) */}
      <button
        type="button"
        onClick={() => void onRetry()}
        disabled={isRefreshing}
        className={`self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${
          hasError
            ? 'bg-[#EF4444]/20 hover:bg-[#EF4444]/30 border-[#EF4444] text-white'
            : 'bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 border-[#F59E0B] text-white'
        }`}
      >
        <svg
          className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>{isRefreshing ? 'Atualizando...' : 'Tentar novamente'}</span>
      </button>
    </div>
  );
};