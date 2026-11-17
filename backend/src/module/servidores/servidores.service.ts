import { HttpService } from "@nestjs/axios";
import { config } from "@/config/config";
import { ServidorResponse, ServidorMetricsData } from "@/module/interface/servidor.interface";
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Inject, Optional } from "@nestjs/common";
import { DRIZZLE_PROVIDER, DrizzleDB, schema } from "@/database";
import {
    INTERVALO_PADRAO_SEGUNDOS,
    INTERVALOS_PERMITIDOS_SEGUNDOS,
    IntervalosConfigService,
} from "@/database/intervalos-config.service";
import { and, eq, desc, gte, lte, sql } from "drizzle-orm";

function parseNumeroOuNulo(valor: unknown): number | null {
    if (valor === null || valor === undefined || valor === '') {
        return null;
    }
    const n = Number(valor);
    return Number.isFinite(n) ? n : null;
}

function compararNumerosComNulos(a: number | null, b: number | null, ordem: 'asc' | 'desc'): number {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return ordem === 'desc' ? b - a : a - b;
}

function compararRankingComDesempate(
    valorA: number | null,
    valorB: number | null,
    ordem: 'asc' | 'desc',
    a: { nome: string; id: string },
    b: { nome: string; id: string },
): number {
    const cmpValor = compararNumerosComNulos(valorA, valorB, ordem);
    if (cmpValor !== 0) return cmpValor;
    const cmpNome = a.nome.localeCompare(b.nome);
    if (cmpNome !== 0) return cmpNome;
    return a.id.localeCompare(b.id);
}

@Injectable()
export class ServidoresService {
    constructor(
        private readonly httpService: HttpService,
        @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDB,
        @Optional() private readonly intervalosConfig?: IntervalosConfigService,
    ) {}

    private resolverJanelaSegundos(janelaSegundos?: number): number {
        if (janelaSegundos !== undefined) {
            const permitidos = INTERVALOS_PERMITIDOS_SEGUNDOS as readonly number[];
            if (!Number.isInteger(janelaSegundos) || !permitidos.includes(janelaSegundos)) {
                throw new BadRequestException(
                    `janelaSegundos inválida. Valores permitidos: ${permitidos.join(', ')}.`,
                );
            }
            return janelaSegundos;
        }
        return this.intervalosConfig?.getIntervaloAtualizacaoSegundos() ?? INTERVALO_PADRAO_SEGUNDOS;
    }

    // 1. Chamadas externas diretas ao Agregador de Métricas
    async listServidores(): Promise<ServidorResponse[]> {
        try {
            const { data } = await this.httpService.axiosRef.get<ServidorResponse[]>(
                `${config.URL_METRICS}/services`
            );
            return data ?? [];
        } catch (error: any) {
            console.error("Erro ao listar servidores na API externa:", error.message);
            throw new InternalServerErrorException("Erro ao buscar servidores na API de métricas");
        }
    }

    async servidorById(id: string): Promise<ServidorResponse> {
        try {
            const { data } = await this.httpService.axiosRef.get<ServidorResponse>(
                `${config.URL_METRICS}/services/${id}`
            );
            return data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new NotFoundException(`Servidor com ID '${id}' não encontrado`);
            }
            throw new InternalServerErrorException('Erro ao consultar o servidor');
        }
    }

    async metricsServidor(id_servidor: string): Promise<ServidorMetricsData> {
        try {
            const { data } = await this.httpService.axiosRef.get<ServidorMetricsData>(
                `${config.URL_METRICS}/metrics/${id_servidor}`
            );
            return data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new NotFoundException(`Servidor com ID '${id_servidor}' não encontrado`);
            }
            if (error.response?.status === 500) {
                throw new InternalServerErrorException(`Servidor '${id_servidor}' está indisponível ou sem métricas`);
            }
            throw new InternalServerErrorException('Erro ao consultar o servidor');
        }
    }

    // Consultas ao Banco de Dados (PostgreSQL) para entrega ao Frontend

    // Retorna todos os servidores cadastrados no banco com seus metadados de região e última coleta na janela
    async listServidoresDoBanco(janelaSegundos?: number) {
        const janela = this.resolverJanelaSegundos(janelaSegundos);
        const dataCorte = new Date(Date.now() - janela * 1000);
        const servidores = await this.db
            .select({
                id: schema.servidores.id,
                nome: schema.servidores.nome,
                codigoRegiao: schema.servidores.codigoRegiao,
                caminhoMetricas: schema.servidores.caminhoMetricas,
                statusAtual: schema.servidores.statusAtual,
                ativo: schema.servidores.ativo,
                atualizadoEm: schema.servidores.atualizadoEm,
                regiao: {
                    codigo: schema.regioes.codigo,
                    pais: schema.regioes.pais,
                    regiao: schema.regioes.regiao,
                    cidade: schema.regioes.cidade,
                    latitude: schema.regioes.latitude,
                    longitude: schema.regioes.longitude,
                    carbonIntensityGco2eKwh: schema.regioes.carbonIntensityGco2eKwh,
                    renewableSharePercent: schema.regioes.renewableSharePercent,
                },
            })
            .from(schema.servidores)
            .leftJoin(schema.regioes, eq(schema.servidores.codigoRegiao, schema.regioes.codigo));

        // Para cada servidor, busca a medição mais recente
        const resultado = await Promise.all(
            servidores.map(async (s) => {
                const [ultimaMedicao] = await this.db
                    .select()
                    .from(schema.coletasMetricas)
                    .where(
                        and(
                            eq(schema.coletasMetricas.servidorId, s.id),
                            gte(schema.coletasMetricas.coletadoEm, dataCorte),
                        ),
                    )
                    .orderBy(desc(schema.coletasMetricas.coletadoEm))
                    .limit(1);

                return {
                    id: s.id,
                    nome: s.nome,
                    status: s.statusAtual,
                    ativo: s.ativo,
                    regiao: s.regiao ? {
                        codigo: s.regiao.codigo,
                        pais: s.regiao.pais,
                        regiao: s.regiao.regiao,
                        cidade: s.regiao.cidade,
                        latitude: parseNumeroOuNulo(s.regiao.latitude),
                        longitude: parseNumeroOuNulo(s.regiao.longitude),
                        carbon_intensity_gco2e_kwh: parseNumeroOuNulo(s.regiao.carbonIntensityGco2eKwh),
                        renewable_share_percent: parseNumeroOuNulo(s.regiao.renewableSharePercent),
                    } : null,
                    ultima_coleta: ultimaMedicao ? {
                        potencia_watts: parseNumeroOuNulo(ultimaMedicao.potenciaWatts),
                        energia_kwh: parseNumeroOuNulo(ultimaMedicao.energiaKwh),
                        emissoes_gco2e: parseNumeroOuNulo(ultimaMedicao.emissoesGco2e),
                        cpu_percent: parseNumeroOuNulo(ultimaMedicao.cpuPercent),
                        memoria_gb: parseNumeroOuNulo(ultimaMedicao.memoriaGb),
                        disco_gb: parseNumeroOuNulo(ultimaMedicao.discoGb),
                        rede_gb: parseNumeroOuNulo(ultimaMedicao.redeGb),
                        coletado_em: ultimaMedicao.coletadoEm,
                    } : null,
                    atualizado_em: s.atualizadoEm,
                };
            })
        );

        return resultado;
    }

    // Dashboard consolidado para tela inicial do frontend
    async getDashboardData(janelaSegundos?: number) {
        const janela = this.resolverJanelaSegundos(janelaSegundos);
        const dataCorte = new Date(Date.now() - janela * 1000);
        const servidores = await this.listServidoresDoBanco(janela);

        const disponiveis = servidores.filter((s) => s.status === 'disponivel').length;
        const indisponiveis = servidores.filter((s) => s.status === 'indisponivel').length;
        const removidos = servidores.filter((s) => s.status === 'removido').length;

        // Soma total acumulada na janela configurada e janela temporal das coletas
        const [totais] = await this.db
            .select({
                consumoTotalKwh: sql<string | null>`sum(energia_kwh)::text`,
                emissoesTotalGco2e: sql<string | null>`sum(emissoes_gco2e)::text`,
                periodoInicio: sql<Date | null>`min(coletado_em)`,
                periodoFim: sql<Date | null>`max(coletado_em)`,
            })
            .from(schema.coletasMetricas)
            .where(gte(schema.coletasMetricas.coletadoEm, dataCorte));

        // Potência instantânea total dos servidores atualmente disponíveis com leitura válida
        const potenciaAtualWatts = servidores
            .filter((s) => s.status === 'disponivel' && s.ultima_coleta?.potencia_watts != null)
            .reduce((acc, s) => acc + (s.ultima_coleta?.potencia_watts ?? 0), 0);

        const servidoresComMetricas = servidores.filter(
            (s) => s.ultima_coleta !== null && s.ultima_coleta.potencia_watts !== null,
        ).length;
        const servidoresSemMetricas = servidores.length - servidoresComMetricas;
        const consumoTotal = parseNumeroOuNulo(totais?.consumoTotalKwh);
        const emissoesTotal = parseNumeroOuNulo(totais?.emissoesTotalGco2e);

        return {
            resumo: {
                total_servidores: servidores.length,
                disponiveis,
                indisponiveis,
                removidos,
                servidores_com_metricas: servidoresComMetricas,
                servidores_sem_metricas: servidoresSemMetricas,
                cobertura_parcial: servidores.length > 0 && servidoresComMetricas < servidores.length,
                periodo_inicio: totais?.periodoInicio ?? null,
                periodo_fim: totais?.periodoFim ?? null,
                janela_amostragem_segundos: janela,
                intervalo_atualizacao_segundos: this.resolverJanelaSegundos(),
                potencia_atual_watts: Number(potenciaAtualWatts.toFixed(2)),
                consumo_total_acumulado_kwh: consumoTotal !== null ? Number(consumoTotal.toFixed(6)) : null,
                emissoes_total_acumuladas_gco2e: emissoesTotal !== null ? Number(emissoesTotal.toFixed(4)) : null,
            },
            servidores,
        };
    }

    private parseDataParametro(valor: string | undefined, nomeCampo: string): Date | undefined {
        if (valor === undefined || valor.trim() === '') {
            return undefined;
        }
        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) {
            throw new BadRequestException(`${nomeCampo} inválida. Use formato ISO 8601 (ex: 2026-11-16T00:00:00Z).`);
        }
        return data;
    }

    // Histórico de medições de um servidor para gráficos temporais dentro do período/janela
    async getHistoricoServidor(
        idServidor: string,
        limite: number = 30,
        janelaSegundos?: number,
        dataInicial?: string,
        dataFinal?: string,
    ) {
        const inicioInformado = this.parseDataParametro(dataInicial, 'dataInicial');
        const fimInformado = this.parseDataParametro(dataFinal, 'dataFinal');

        if (inicioInformado && fimInformado && inicioInformado > fimInformado) {
            throw new BadRequestException('dataInicial não pode ser posterior a dataFinal.');
        }

        const janela = this.resolverJanelaSegundos(janelaSegundos);
        const agora = new Date();
        const usarPeriodoExplicito = Boolean(inicioInformado || fimInformado);
        const inicioEfetivo = usarPeriodoExplicito
            ? (inicioInformado ?? null)
            : new Date(agora.getTime() - janela * 1000);
        const fimEfetivo = usarPeriodoExplicito ? (fimInformado ?? null) : agora;

        // Valida se o servidor existe no banco
        const [servidor] = await this.db
            .select()
            .from(schema.servidores)
            .where(eq(schema.servidores.id, idServidor))
            .limit(1);

        if (!servidor) {
            throw new NotFoundException(`Servidor '${idServidor}' não encontrado no histórico`);
        }

        const condicoes = [eq(schema.coletasMetricas.servidorId, idServidor)];
        if (inicioEfetivo) {
            condicoes.push(gte(schema.coletasMetricas.coletadoEm, inicioEfetivo));
        }
        if (fimEfetivo) {
            condicoes.push(lte(schema.coletasMetricas.coletadoEm, fimEfetivo));
        }

        const medicaoesDesc = await this.db
            .select()
            .from(schema.coletasMetricas)
            .where(and(...condicoes))
            .orderBy(desc(schema.coletasMetricas.coletadoEm))
            .limit(limite);

        // Inverte para retornar em ordem cronológica (ideal para gráficos de linha)
        const pontos = medicaoesDesc.reverse().map((m) => ({
            timestamp: m.coletadoEm,
            status: m.status,
            potencia_watts: parseNumeroOuNulo(m.potenciaWatts),
            energia_kwh: parseNumeroOuNulo(m.energiaKwh),
            emissoes_gco2e: parseNumeroOuNulo(m.emissoesGco2e),
            cpu_percent: parseNumeroOuNulo(m.cpuPercent),
            memoria_gb: parseNumeroOuNulo(m.memoriaGb),
            disco_gb: parseNumeroOuNulo(m.discoGb),
            rede_gb: parseNumeroOuNulo(m.redeGb),
        }));

        return {
            servidor: {
                id: servidor.id,
                nome: servidor.nome,
                status: servidor.statusAtual,
                codigo_regiao: servidor.codigoRegiao,
            },
            janela_amostragem_segundos: janela,
            periodo: {
                inicio: inicioEfetivo,
                fim: fimEfetivo,
            },
            total_pontos: pontos.length,
            pontos,
        };
    }

    // Comparativo entre serviços selecionados (ou todos ativos)
    async getComparativo(ids?: string[], janelaSegundos?: number) {
        const janela = this.resolverJanelaSegundos(janelaSegundos);
        const fim = new Date();
        const inicio = new Date(fim.getTime() - janela * 1000);
        let servidores = await this.listServidoresDoBanco(janela);

        if (ids && ids.length > 0) {
            servidores = servidores.filter((s) => ids.includes(s.id));
        }

        const comparativo = servidores.map((s) => ({
            id: s.id,
            nome: s.nome,
            status: s.status,
            regiao: s.regiao?.pais ?? 'N/D',
            intensidade_carbono_regional: s.regiao?.carbon_intensity_gco2e_kwh ?? null,
            potencia_watts: s.ultima_coleta?.potencia_watts ?? null,
            energia_kwh: s.ultima_coleta?.energia_kwh ?? null,
            emissoes_gco2e: s.ultima_coleta?.emissoes_gco2e ?? null,
            cpu_percent: s.ultima_coleta?.cpu_percent ?? null,
            memoria_gb: s.ultima_coleta?.memoria_gb ?? null,
            disco_gb: s.ultima_coleta?.disco_gb ?? null,
            rede_gb: s.ultima_coleta?.rede_gb ?? null,
        }));

        // Ordena por maior emissão de carbono, mantendo nulos ao final
        comparativo.sort((a, b) => compararNumerosComNulos(a.emissoes_gco2e, b.emissoes_gco2e, 'desc'));

        return {
            janela_amostragem_segundos: janela,
            periodo: { inicio, fim },
            unidades: {
                cpu_percent: '%',
                memoria_gb: 'GB',
                disco_gb: 'GB',
                rede_gb: 'GB',
                potencia_watts: 'W',
                energia_kwh: 'kWh',
                emissoes_gco2e: 'gCO2e',
                intensidade_carbono_regional: 'gCO2e/kWh',
            },
            total_comparados: comparativo.length,
            servidores: comparativo,
        };
    }

    // Ranking de servidores por impacto ambiental
    async getRankingServidores(
        ordenarPor: 'emissoes' | 'energia' = 'emissoes',
        ordem: 'desc' | 'asc' = 'desc',
        criterio: 'acumulado' | 'instantaneo' = 'acumulado',
        limite: number = 10,
        janelaSegundos?: number,
        dataInicial?: string,
        dataFinal?: string,
    ) {
        const inicioInformado = this.parseDataParametro(dataInicial, 'dataInicial');
        const fimInformado = this.parseDataParametro(dataFinal, 'dataFinal');

        if (inicioInformado && fimInformado && inicioInformado > fimInformado) {
            throw new BadRequestException('dataInicial não pode ser posterior a dataFinal.');
        }

        const janela = this.resolverJanelaSegundos(janelaSegundos);
        const agora = new Date();
        const usarPeriodoExplicito = Boolean(inicioInformado || fimInformado);
        const inicioEfetivo = usarPeriodoExplicito
            ? (inicioInformado ?? null)
            : new Date(agora.getTime() - janela * 1000);
        const fimEfetivo = usarPeriodoExplicito ? (fimInformado ?? null) : agora;

        if (criterio === 'acumulado') {
            const condicoes: ReturnType<typeof gte>[] = [];
            if (inicioEfetivo) {
                condicoes.push(gte(schema.coletasMetricas.coletadoEm, inicioEfetivo));
            }
            if (fimEfetivo) {
                condicoes.push(lte(schema.coletasMetricas.coletadoEm, fimEfetivo));
            }

            // Agrega a soma histórica de emissões e energia acumuladas por servidor no banco
            const consulta = this.db
                .select({
                    servidorId: schema.coletasMetricas.servidorId,
                    nome: schema.servidores.nome,
                    statusAtual: schema.servidores.statusAtual,
                    codigoRegiao: schema.servidores.codigoRegiao,
                    paisRegiao: schema.regioes.pais,
                    intensidadeCarbono: schema.regioes.carbonIntensityGco2eKwh,
                    totalColetas: sql<number>`count(*)::int`,
                    totalEnergiaKwh: sql<string | null>`sum(${schema.coletasMetricas.energiaKwh})::text`,
                    totalEmissoesGco2e: sql<string | null>`sum(${schema.coletasMetricas.emissoesGco2e})::text`,
                    potenciaMediaWatts: sql<string | null>`avg(${schema.coletasMetricas.potenciaWatts})::text`,
                    cpuMediaPercent: sql<string | null>`avg(${schema.coletasMetricas.cpuPercent})::text`,
                })
                .from(schema.coletasMetricas)
                .innerJoin(schema.servidores, eq(schema.coletasMetricas.servidorId, schema.servidores.id))
                .leftJoin(schema.regioes, eq(schema.servidores.codigoRegiao, schema.regioes.codigo));

            const dadosAgregados = await (condicoes.length > 0 ? consulta.where(and(...condicoes)) : consulta)
                .groupBy(
                    schema.coletasMetricas.servidorId,
                    schema.servidores.nome,
                    schema.servidores.statusAtual,
                    schema.servidores.codigoRegiao,
                    schema.regioes.pais,
                    schema.regioes.carbonIntensityGco2eKwh
                );

            const ranking = dadosAgregados.map((item) => {
                const energiaTotal = parseNumeroOuNulo(item.totalEnergiaKwh);
                const emissoesTotal = parseNumeroOuNulo(item.totalEmissoesGco2e);
                const potenciaMedia = parseNumeroOuNulo(item.potenciaMediaWatts);
                const cpuMedia = parseNumeroOuNulo(item.cpuMediaPercent);

                return {
                    posicao: 0,
                    id: item.servidorId,
                    nome: item.nome,
                    status: item.statusAtual,
                    regiao: item.paisRegiao ?? item.codigoRegiao ?? 'N/D',
                    intensidade_carbono: parseNumeroOuNulo(item.intensidadeCarbono),
                    total_coletas: item.totalColetas,
                    energia_total_kwh: energiaTotal !== null ? Number(energiaTotal.toFixed(6)) : null,
                    emissoes_total_gco2e: emissoesTotal !== null ? Number(emissoesTotal.toFixed(4)) : null,
                    potencia_media_watts: potenciaMedia !== null ? Number(potenciaMedia.toFixed(2)) : null,
                    cpu_media_percent: cpuMedia !== null ? Number(cpuMedia.toFixed(2)) : null,
                };
            });

            ranking.sort((a, b) => {
                const valorA = ordenarPor === 'emissoes' ? a.emissoes_total_gco2e : a.energia_total_kwh;
                const valorB = ordenarPor === 'emissoes' ? b.emissoes_total_gco2e : b.energia_total_kwh;
                return compararRankingComDesempate(valorA, valorB, ordem, a, b);
            });

            ranking.forEach((item, idx) => {
                item.posicao = idx + 1;
            });

            return {
                criterio: 'acumulado',
                ordenado_por: ordenarPor,
                direcao: ordem,
                janela_amostragem_segundos: janela,
                periodo: {
                    inicio: inicioEfetivo,
                    fim: fimEfetivo,
                },
                total: ranking.length,
                ranking: ranking.slice(0, limite),
            };
        } else {
            // Critério instantâneo: usa a última medição registrada na janela
            const servidores = await this.listServidoresDoBanco(janela);
            const ranking = servidores.map((s) => ({
                posicao: 0,
                id: s.id,
                nome: s.nome,
                status: s.status,
                regiao: s.regiao?.pais ?? 'N/D',
                intensidade_carbono: s.regiao?.carbon_intensity_gco2e_kwh ?? null,
                potencia_watts: s.ultima_coleta?.potencia_watts ?? null,
                energia_kwh: s.ultima_coleta?.energia_kwh ?? null,
                emissoes_gco2e: s.ultima_coleta?.emissoes_gco2e ?? null,
                cpu_percent: s.ultima_coleta?.cpu_percent ?? null,
            }));

            ranking.sort((a, b) => {
                const valorA = ordenarPor === 'emissoes' ? a.emissoes_gco2e : a.energia_kwh;
                const valorB = ordenarPor === 'emissoes' ? b.emissoes_gco2e : b.energia_kwh;
                return compararRankingComDesempate(valorA, valorB, ordem, a, b);
            });

            ranking.forEach((item, idx) => {
                item.posicao = idx + 1;
            });

            return {
                criterio: 'instantaneo',
                ordenado_por: ordenarPor,
                direcao: ordem,
                janela_amostragem_segundos: janela,
                periodo: {
                    inicio: inicioEfetivo,
                    fim: fimEfetivo,
                },
                total: ranking.length,
                ranking: ranking.slice(0, limite),
            };
        }
    }
}