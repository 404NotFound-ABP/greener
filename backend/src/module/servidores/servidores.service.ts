import { HttpService } from "@nestjs/axios";
import { config } from "@/config/config";
import { ServidorResponse, ServidorMetricsData } from "@/module/interface/servidor.interface";
import { Injectable, InternalServerErrorException, NotFoundException, Inject } from "@nestjs/common";
import { DRIZZLE_PROVIDER, DrizzleDB, schema } from "@/database";
import { eq, desc, inArray, sql } from "drizzle-orm";

@Injectable()
export class ServidoresService {
    constructor(
        private readonly httpService: HttpService,
        @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDB,
    ) {}

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

    // Retorna todos os servidores cadastrados no banco com seus metadados de região e última coleta
    async listServidoresDoBanco() {
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
                    .where(eq(schema.coletasMetricas.servidorId, s.id))
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
                        carbon_intensity_gco2e_kwh: Number(s.regiao.carbonIntensityGco2eKwh ?? 0),
                        renewable_share_percent: Number(s.regiao.renewableSharePercent ?? 0),
                    } : null,
                    ultima_coleta: ultimaMedicao ? {
                        potencia_watts: Number(ultimaMedicao.potenciaWatts ?? 0),
                        energia_kwh: Number(ultimaMedicao.energiaKwh ?? 0),
                        emissoes_gco2e: Number(ultimaMedicao.emissoesGco2e ?? 0),
                        cpu_percent: Number(ultimaMedicao.cpuPercent ?? 0),
                        memoria_gb: Number(ultimaMedicao.memoriaGb ?? 0),
                        disco_gb: Number(ultimaMedicao.discoGb ?? 0),
                        rede_gb: Number(ultimaMedicao.redeGb ?? 0),
                        coletado_em: ultimaMedicao.coletadoEm,
                    } : null,
                    atualizado_em: s.atualizadoEm,
                };
            })
        );

        return resultado;
    }

    // Dashboard consolidado para tela inicial do frontend
    async getDashboardData() {
        const servidores = await this.listServidoresDoBanco();

        const disponiveis = servidores.filter((s) => s.status === 'disponivel').length;
        const indisponiveis = servidores.filter((s) => s.status === 'indisponivel').length;
        const removidos = servidores.filter((s) => s.status === 'removido').length;

        // Soma total acumulada no banco
        const [totais] = await this.db
            .select({
                consumoTotalKwh: sql<string>`coalesce(sum(energia_kwh), 0)::text`,
                emissoesTotalGco2e: sql<string>`coalesce(sum(emissoes_gco2e), 0)::text`,
            })
            .from(schema.coletasMetricas);

        // Potência instantânea total dos servidores atualmente disponíveis
        const potenciaAtualWatts = servidores
            .filter((s) => s.status === 'disponivel' && s.ultima_coleta)
            .reduce((acc, s) => acc + (s.ultima_coleta?.potencia_watts ?? 0), 0);

        return {
            resumo: {
                total_servidores: servidores.length,
                disponiveis,
                indisponiveis,
                removidos,
                potencia_atual_watts: Number(potenciaAtualWatts.toFixed(2)),
                consumo_total_acumulado_kwh: Number(Number(totais?.consumoTotalKwh ?? 0).toFixed(6)),
                emissoes_total_acumuladas_gco2e: Number(Number(totais?.emissoesTotalGco2e ?? 0).toFixed(4)),
            },
            servidores,
        };
    }

    // Histórico de medições de um servidor para gráficos temporais
    async getHistoricoServidor(idServidor: string, limite: number = 30) {
        // Valida se o servidor existe no banco
        const [servidor] = await this.db
            .select()
            .from(schema.servidores)
            .where(eq(schema.servidores.id, idServidor))
            .limit(1);

        if (!servidor) {
            throw new NotFoundException(`Servidor '${idServidor}' não encontrado no histórico`);
        }

        const medicaoesDesc = await this.db
            .select()
            .from(schema.coletasMetricas)
            .where(eq(schema.coletasMetricas.servidorId, idServidor))
            .orderBy(desc(schema.coletasMetricas.coletadoEm))
            .limit(limite);

        // Inverte para retornar em ordem cronológica (ideal para gráficos de linha)
        const pontos = medicaoesDesc.reverse().map((m) => ({
            timestamp: m.coletadoEm,
            status: m.status,
            potencia_watts: Number(m.potenciaWatts ?? 0),
            energia_kwh: Number(m.energiaKwh ?? 0),
            emissoes_gco2e: Number(m.emissoesGco2e ?? 0),
            cpu_percent: Number(m.cpuPercent ?? 0),
            memoria_gb: Number(m.memoriaGb ?? 0),
            disco_gb: Number(m.discoGb ?? 0),
            rede_gb: Number(m.redeGb ?? 0),
        }));

        return {
            servidor: {
                id: servidor.id,
                nome: servidor.nome,
                status: servidor.statusAtual,
                codigo_regiao: servidor.codigoRegiao,
            },
            total_pontos: pontos.length,
            pontos,
        };
    }

    // Comparativo entre serviços selecionados (ou todos ativos)
    async getComparativo(ids?: string[]) {
        let servidores = await this.listServidoresDoBanco();

        if (ids && ids.length > 0) {
            servidores = servidores.filter((s) => ids.includes(s.id));
        }

        const comparativo = servidores.map((s) => ({
            id: s.id,
            nome: s.nome,
            status: s.status,
            regiao: s.regiao?.pais ?? 'N/D',
            intensidade_carbono_regional: s.regiao?.carbon_intensity_gco2e_kwh ?? 0,
            potencia_watts: s.ultima_coleta?.potencia_watts ?? 0,
            energia_kwh: s.ultima_coleta?.energia_kwh ?? 0,
            emissoes_gco2e: s.ultima_coleta?.emissoes_gco2e ?? 0,
            cpu_percent: s.ultima_coleta?.cpu_percent ?? 0,
            memoria_gb: s.ultima_coleta?.memoria_gb ?? 0,
        }));

        // Ordena por maior emissão de carbono
        comparativo.sort((a, b) => b.emissoes_gco2e - a.emissoes_gco2e);

        return {
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
    ) {
        if (criterio === 'acumulado') {
            // Agrega a soma histórica de emissões e energia acumuladas por servidor no banco
            const dadosAgregados = await this.db
                .select({
                    servidorId: schema.coletasMetricas.servidorId,
                    nome: schema.servidores.nome,
                    statusAtual: schema.servidores.statusAtual,
                    codigoRegiao: schema.servidores.codigoRegiao,
                    paisRegiao: schema.regioes.pais,
                    intensidadeCarbono: schema.regioes.carbonIntensityGco2eKwh,
                    totalColetas: sql<number>`count(*)::int`,
                    totalEnergiaKwh: sql<string>`coalesce(sum(${schema.coletasMetricas.energiaKwh}), 0)::text`,
                    totalEmissoesGco2e: sql<string>`coalesce(sum(${schema.coletasMetricas.emissoesGco2e}), 0)::text`,
                    potenciaMediaWatts: sql<string>`coalesce(avg(${schema.coletasMetricas.potenciaWatts}), 0)::text`,
                    cpuMediaPercent: sql<string>`coalesce(avg(${schema.coletasMetricas.cpuPercent}), 0)::text`,
                })
                .from(schema.coletasMetricas)
                .innerJoin(schema.servidores, eq(schema.coletasMetricas.servidorId, schema.servidores.id))
                .leftJoin(schema.regioes, eq(schema.servidores.codigoRegiao, schema.regioes.codigo))
                .groupBy(
                    schema.coletasMetricas.servidorId,
                    schema.servidores.nome,
                    schema.servidores.statusAtual,
                    schema.servidores.codigoRegiao,
                    schema.regioes.pais,
                    schema.regioes.carbonIntensityGco2eKwh
                );

            const ranking = dadosAgregados.map((item) => ({
                posicao: 0,
                id: item.servidorId,
                nome: item.nome,
                status: item.statusAtual,
                regiao: item.paisRegiao ?? item.codigoRegiao ?? 'N/D',
                intensidade_carbono: Number(item.intensidadeCarbono ?? 0),
                total_coletas: item.totalColetas,
                energia_total_kwh: Number(Number(item.totalEnergiaKwh).toFixed(6)),
                emissoes_total_gco2e: Number(Number(item.totalEmissoesGco2e).toFixed(4)),
                potencia_media_watts: Number(Number(item.potenciaMediaWatts).toFixed(2)),
                cpu_media_percent: Number(Number(item.cpuMediaPercent).toFixed(2)),
            }));

            ranking.sort((a, b) => {
                const valorA = ordenarPor === 'emissoes' ? a.emissoes_total_gco2e : a.energia_total_kwh;
                const valorB = ordenarPor === 'emissoes' ? b.emissoes_total_gco2e : b.energia_total_kwh;
                return ordem === 'desc' ? valorB - valorA : valorA - valorB;
            });

            ranking.forEach((item, idx) => {
                item.posicao = idx + 1;
            });

            return {
                criterio: 'acumulado',
                ordenado_por: ordenarPor,
                direcao: ordem,
                total: ranking.length,
                ranking: ranking.slice(0, limite),
            };
        } else {
            // Critério instantâneo: usa a última medição registrada
            const servidores = await this.listServidoresDoBanco();
            const ranking = servidores.map((s) => ({
                posicao: 0,
                id: s.id,
                nome: s.nome,
                status: s.status,
                regiao: s.regiao?.pais ?? 'N/D',
                intensidade_carbono: s.regiao?.carbon_intensity_gco2e_kwh ?? 0,
                potencia_watts: s.ultima_coleta?.potencia_watts ?? 0,
                energia_kwh: s.ultima_coleta?.energia_kwh ?? 0,
                emissoes_gco2e: s.ultima_coleta?.emissoes_gco2e ?? 0,
                cpu_percent: s.ultima_coleta?.cpu_percent ?? 0,
            }));

            ranking.sort((a, b) => {
                const valorA = ordenarPor === 'emissoes' ? a.emissoes_gco2e : a.energia_kwh;
                const valorB = ordenarPor === 'emissoes' ? b.emissoes_gco2e : b.energia_kwh;
                return ordem === 'desc' ? valorB - valorA : valorA - valorB;
            });

            ranking.forEach((item, idx) => {
                item.posicao = idx + 1;
            });

            return {
                criterio: 'instantaneo',
                ordenado_por: ordenarPor,
                direcao: ordem,
                total: ranking.length,
                ranking: ranking.slice(0, limite),
            };
        }
    }
}