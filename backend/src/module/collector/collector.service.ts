import { Injectable, Logger, OnApplicationBootstrap, Inject } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { config } from '@/config/config';
import { ServidoresService } from '@/module/servidores/servidores.service';
import { CarbonService } from '@/module/carbon/carbon.service';
import { ImpactService } from '@/module/impact/impact.service';
import { DRIZZLE_PROVIDER, DrizzleDB, schema } from '@/database';
import { eq, notInArray, desc, sql } from 'drizzle-orm';

@Injectable()
export class CollectorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CollectorService.name);
  private executando = false;
  private ultimaExecucao: Date | null = null;
  private totalColetasExecutadas = 0;

  constructor(
    private readonly servidoresService: ServidoresService,
    private readonly carbonService: CarbonService,
    private readonly impactService: ImpactService,
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDB,
  ) {}

  // Dispara uma coleta imediatamente quando a aplicação sobe
  async onApplicationBootstrap() {
    this.logger.log('Inicializando primeira coleta do monitoramento agendado...');
    await this.executarCicloColeta();
  }

  // Executa periodicamente com base no tempo configurado
  @Interval(config.INTERVALO_COLETA_SEGUNDOS * 1000)
  async handleInterval() {
    await this.executarCicloColeta();
  }

  // Permite disparo manual via controller
  async executarColetaManual() {
    if (this.executando) {
      return { status: 'em_andamento', mensagem: 'Uma coleta já está em andamento.' };
    }
    // Executa em segundo plano ou aguarda
    const resultado = await this.executarCicloColeta();
    return {
      status: 'sucesso',
      mensagem: 'Ciclo de coleta executado com sucesso.',
      detalhes: resultado,
    };
  }

  async executarCicloColeta() {
    if (this.executando) {
      this.logger.warn('Coleta anterior ainda em andamento. Aguardando próximo ciclo.');
      return { servidoresProcessados: 0, duracaoSegundos: 0 };
    }

    this.executando = true;
    const inicio = Date.now();
    let servidoresSalvos = 0;

    try {
      this.logger.log(`Iniciando ciclo de monitoramento (Intervalo: ${config.INTERVALO_COLETA_SEGUNDOS}s)...`);

      //  Sincroniza Regiões no banco de dados
      try {
        const regioesResponse = await this.carbonService.getCarbonRegions();
        if (regioesResponse?.regions?.length > 0) {
          for (const reg of regioesResponse.regions) {
            await this.db
              .insert(schema.regioes)
              .values({
                codigo: reg.code,
                pais: reg.country,
                regiao: reg.region,
                cidade: reg.city,
                latitude: reg.latitude?.toString(),
                longitude: reg.longitude?.toString(),
                carbonIntensityGco2eKwh: (reg.carbon_intensity_gco2e_per_kwh ?? 0).toString(),
                renewableSharePercent: (reg.renewable_share_percent ?? 0).toString(),
                atualizadoEm: new Date(),
              })
              .onConflictDoUpdate({
                target: schema.regioes.codigo,
                set: {
                  pais: reg.country,
                  regiao: reg.region,
                  cidade: reg.city,
                  latitude: reg.latitude?.toString(),
                  longitude: reg.longitude?.toString(),
                  carbonIntensityGco2eKwh: (reg.carbon_intensity_gco2e_per_kwh ?? 0).toString(),
                  renewableSharePercent: (reg.renewable_share_percent ?? 0).toString(),
                  atualizadoEm: new Date(),
                },
              });
          }
          this.logger.log(`Sincronizadas ${regioesResponse.regions.length} regiões no banco.`);
        }
      } catch (err: any) {
        this.logger.warn(`Não foi possível atualizar regiões neste ciclo: ${err.message}`);
      }

      // Consulta serviços no Agregador de Métricas
      const servidores = await this.servidoresService.listServidores();
      this.logger.log(`Encontrados ${servidores.length} servidores para monitorar.`);

      // Se a lista estiver vazia ou com servidores ausentes, marca ausentes como ativo=false e statusAtual='removido'
      const idsAtivos = servidores.map((s) => s.id);
      if (idsAtivos.length > 0) {
        await this.db
          .update(schema.servidores)
          .set({ ativo: false, statusAtual: 'removido', atualizadoEm: new Date() })
          .where(notInArray(schema.servidores.id, idsAtivos));
      } else {
        await this.db
          .update(schema.servidores)
          .set({ ativo: false, statusAtual: 'removido', atualizadoEm: new Date() });
      }

      // Para cada servidor: cadastra/atualiza e salva medição no histórico
      for (const servidor of servidores) {
        try {
          // Upsert no cadastro do servidor
          await this.db
            .insert(schema.servidores)
            .values({
              id: servidor.id,
              nome: servidor.name,
              codigoRegiao: servidor.location?.region_code ?? null,
              caminhoMetricas: servidor.metrics_path,
              statusAtual: 'disponivel',
              ativo: true,
              atualizadoEm: new Date(),
            })
            .onConflictDoUpdate({
              target: schema.servidores.id,
              set: {
                nome: servidor.name,
                codigoRegiao: servidor.location?.region_code ?? null,
                caminhoMetricas: servidor.metrics_path,
                ativo: true,
                atualizadoEm: new Date(),
              },
            });

          // Calcula impacto dinâmico
          const impacto = await this.impactService.calcularImpactoPorServidor(servidor.id);

          // Atualiza status_atual no cadastro do servidor
          await this.db
            .update(schema.servidores)
            .set({
              statusAtual: impacto.status,
              atualizadoEm: new Date(),
            })
            .where(eq(schema.servidores.id, servidor.id));

          // Insere registro no histórico de medições
          await this.db.insert(schema.coletasMetricas).values({
            servidorId: servidor.id,
            codigoRegiao: impacto.regiao?.codigo ?? servidor.location?.region_code ?? null,
            status: impacto.status,
            intervaloSegundos: impacto.metricas?.intervalo_segundos ?? null,
            cpuPercent: impacto.metricas?.cpu_percent != null ? impacto.metricas.cpu_percent.toString() : null,
            memoriaGb: impacto.metricas?.memoria_gb != null ? impacto.metricas.memoria_gb.toString() : null,
            discoGb: impacto.metricas?.disco_gb != null ? impacto.metricas.disco_gb.toString() : null,
            redeGb: impacto.metricas?.rede_gb != null ? impacto.metricas.rede_gb.toString() : null,
            potenciaWatts: impacto.impacto?.potencia_watts != null ? impacto.impacto.potencia_watts.toString() : null,
            energiaKwh: impacto.impacto?.energia_kwh != null ? impacto.impacto.energia_kwh.toString() : null,
            carbonIntensityFator: impacto.regiao?.carbon_intensity_gco2e_kwh != null ? impacto.regiao.carbon_intensity_gco2e_kwh.toString() : null,
            emissoesGco2e: impacto.impacto?.emissoes_gco2e != null ? impacto.impacto.emissoes_gco2e.toString() : null,
            coletadoEm: new Date(),
          });

          servidoresSalvos++;
          this.logger.log(
            `[${servidor.name}] Medição salva! Status: ${impacto.status} | Potência: ${impacto.impacto?.potencia_watts ?? 0}W | Energia: ${impacto.impacto?.energia_kwh ?? 0} kWh | CO2e: ${impacto.impacto?.emissoes_gco2e ?? 0}g`
          );
        } catch (err: any) {
          this.logger.error(`Falha ao processar servidor ${servidor.id}: ${err.message}`);
        }
      }

      const duracao = Number(((Date.now() - inicio) / 1000).toFixed(2));
      this.ultimaExecucao = new Date();
      this.totalColetasExecutadas++;

      this.logger.log(`Ciclo de monitoramento concluído em ${duracao}s. ${servidoresSalvos} medições persistidas.`);
      return { servidoresProcessados: servidoresSalvos, duracaoSegundos: duracao };
    } catch (error: any) {
      this.logger.error(`Erro no ciclo de coleta: ${error.message}`);
      return { servidoresProcessados: servidoresSalvos, erro: error.message };
    } finally {
      this.executando = false;
    }
  }

  // Estatísticas gerais
  async getEstatisticasColeta() {
    const totalRegistros = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.coletasMetricas);

    const totalServidores = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.servidores);

    const totalRegioes = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.regioes);

    return {
      executando: this.executando,
      intervaloConfiguradoSegundos: config.INTERVALO_COLETA_SEGUNDOS,
      ultimaExecucao: this.ultimaExecucao,
      ciclosCompletadosNestaSessao: this.totalColetasExecutadas,
      totalMedicoesNoBanco: totalRegistros[0]?.count ?? 0,
      totalServidoresCadastrados: totalServidores[0]?.count ?? 0,
      totalRegioesCadastradas: totalRegioes[0]?.count ?? 0,
    };
  }

  // Consulta histórico recente
  async getHistorico(servidorId?: string, limite: number = 20) {
    if (servidorId) {
      return this.db
        .select()
        .from(schema.coletasMetricas)
        .where(eq(schema.coletasMetricas.servidorId, servidorId))
        .orderBy(desc(schema.coletasMetricas.coletadoEm))
        .limit(limite);
    }

    return this.db
      .select()
      .from(schema.coletasMetricas)
      .orderBy(desc(schema.coletasMetricas.coletadoEm))
      .limit(limite);
  }
}
