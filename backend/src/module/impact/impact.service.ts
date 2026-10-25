import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ServidoresService } from '@/module/servidores/servidores.service';
import { CarbonService } from '@/module/carbon/carbon.service';
import { CarbonIntensityResponse } from '@/module/interface/carbon.interface';
import { ServidorMetricsData } from '@/module/interface/servidor.interface';
import { ServidorImpactoResponseDto, ServidorImpactoDiscriminadoResponseDto } from './dto/impact.dto';
import { DRIZZLE_PROVIDER, DrizzleDB, schema } from '@/database';
import { eq, desc } from 'drizzle-orm';

export class CalculadoraImpacto {
  private static readonly CPU_MAX_WATTS = 100;
  private static readonly RAM_WATTS_PER_GB = 0.375;
  private static readonly DISK_WATTS_PER_GB = 0.01;
  private static readonly NETWORK_WATTS_PER_GB = 0.02;

  static calcular(
    intervaloSegundos: number,
    cpuPercent: number,
    ramGb: number,
    diskGb: number,
    networkGb: number,
    carbonIntensity: number | null,
  ) {
    const pCpu = (cpuPercent / 100) * this.CPU_MAX_WATTS;
    const pRam = ramGb * this.RAM_WATTS_PER_GB;
    const pDisk = diskGb * this.DISK_WATTS_PER_GB;
    const pRede = networkGb * this.NETWORK_WATTS_PER_GB;

    const potenciaWatts = pCpu + pRam + pDisk + pRede;

    const tempoHoras = intervaloSegundos / 3600;
    const energiaKwh = (potenciaWatts * tempoHoras) / 1000;
    const emissoesGco2e = carbonIntensity != null ? Number((energiaKwh * carbonIntensity).toFixed(4)) : null;

    return {
      potenciaWatts: Number(potenciaWatts.toFixed(2)),
      energiaKwh: Number(energiaKwh.toFixed(7)),
      emissoesGco2e,
    };
  }

  static calcularDiscriminado(
    intervaloSegundos: number,
    cpuPercent: number,
    ramGb: number,
    diskGb: number,
    networkGb: number,
    carbonIntensity: number | null,
  ) {
    const pCpu = (cpuPercent / 100) * this.CPU_MAX_WATTS;
    const pRam = ramGb * this.RAM_WATTS_PER_GB;
    const pDisk = diskGb * this.DISK_WATTS_PER_GB;
    const pRede = networkGb * this.NETWORK_WATTS_PER_GB;
    const potenciaTotal = pCpu + pRam + pDisk + pRede;

    const tempoHoras = intervaloSegundos / 3600;

    const calcItem = (pItem: number, valorBruto: number, unidade: string) => {
      const eKwh = (pItem * tempoHoras) / 1000;
      const emissoes = carbonIntensity != null ? Number((eKwh * carbonIntensity).toFixed(4)) : null;
      const pct = potenciaTotal > 0 ? Number(((pItem / potenciaTotal) * 100).toFixed(2)) : 0;
      return {
        valor_bruto: Number(valorBruto.toFixed(2)),
        unidade,
        potencia_watts: Number(pItem.toFixed(2)),
        energia_kwh: Number(eKwh.toFixed(7)),
        emissoes_gco2e: emissoes,
        percentual_impacto: pct,
      };
    };

    const totalEnergiaKwh = (potenciaTotal * tempoHoras) / 1000;
    const totalEmissoesGco2e = carbonIntensity != null ? Number((totalEnergiaKwh * carbonIntensity).toFixed(4)) : null;

    return {
      totais: {
        potencia_watts: Number(potenciaTotal.toFixed(2)),
        energia_kwh: Number(totalEnergiaKwh.toFixed(7)),
        emissoes_gco2e: totalEmissoesGco2e,
      },
      discriminacao: {
        cpu: calcItem(pCpu, cpuPercent, '%'),
        memoria: calcItem(pRam, ramGb, 'GB'),
        disco: calcItem(pDisk, diskGb, 'GB'),
        rede: calcItem(pRede, networkGb, 'GB'),
      },
    };
  }
}

@Injectable()
export class ImpactService {
  constructor(
    private readonly servidoresService: ServidoresService,
    private readonly carbonService: CarbonService,
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDB,
  ) {}

  async calcularImpactoPorServidor(idServidor: string): Promise<ServidorImpactoResponseDto> {
    // 1. Busca dados cadastrais do servidor
    let servidor;
    try {
      servidor = await this.servidoresService.servidorById(idServidor);
    } catch (err: any) {
      // Se não encontrou na API externa (404), verifica se é um servidor previamente cadastrado no banco (removido)
      const [servidorDb] = await this.db
        .select()
        .from(schema.servidores)
        .where(eq(schema.servidores.id, idServidor))
        .limit(1);

      if (servidorDb && (servidorDb.statusAtual === 'removido' || !servidorDb.ativo)) {
        let regiaoDb: typeof schema.regioes.$inferSelect | undefined = undefined;
        if (servidorDb.codigoRegiao) {
          const [r] = await this.db
            .select()
            .from(schema.regioes)
            .where(eq(schema.regioes.codigo, servidorDb.codigoRegiao))
            .limit(1);
          regiaoDb = r;
        }

        return {
          servidor_id: servidorDb.id,
          nome: servidorDb.nome,
          status: 'removido',
          regiao: {
            codigo: servidorDb.codigoRegiao ?? '',
            pais: regiaoDb?.pais ?? '',
            cidade: regiaoDb?.cidade ?? null,
            carbon_intensity_gco2e_kwh: Number(regiaoDb?.carbonIntensityGco2eKwh ?? 0),
            renewable_share_percent: Number(regiaoDb?.renewableSharePercent ?? 0),
          },
          metricas: null,
          impacto: null,
        };
      }

      // Se não existir nem no banco de dados, lança 404 Not Found
      throw new NotFoundException(`Servidor com ID '${idServidor}' não encontrado`);
    }

    // 2. Consulta a intensidade de carbono da região (com fallback para cache no banco)
    let carbono: CarbonIntensityResponse | null = null;
    const regionCode = servidor.location.region_code;
    try {
      carbono = await this.carbonService.getCarbonIntensityById(regionCode);
    } catch {
      // Tenta fallback para a tabela de regiões no banco
      const [regiaoSalva] = await this.db
        .select()
        .from(schema.regioes)
        .where(eq(schema.regioes.codigo, regionCode))
        .limit(1);

      if (regiaoSalva) {
        carbono = {
          region_code: regiaoSalva.codigo,
          country: regiaoSalva.pais,
          region: regiaoSalva.regiao,
          city: regiaoSalva.cidade,
          carbon_intensity_gco2e_per_kwh: Number(regiaoSalva.carbonIntensityGco2eKwh),
          renewable_share_percent: Number(regiaoSalva.renewableSharePercent),
        };
      }
    }

    const regiaoInfo = {
      codigo: servidor.location.region_code,
      pais: servidor.location.country,
      cidade: servidor.location.city,
      carbon_intensity_gco2e_kwh: carbono?.carbon_intensity_gco2e_per_kwh ?? 0,
      renewable_share_percent: carbono?.renewable_share_percent ?? 0,
    };

    // 3. Tenta coletar métricas atuais da API externa
    let metricasData: ServidorMetricsData | null = null;
    try {
      metricasData = await this.servidoresService.metricsServidor(idServidor);
    } catch {
      // Se a API externa responder com 500 ou falha de conexão, o servidor está "indisponível"
      return {
        servidor_id: servidor.id,
        nome: servidor.name,
        status: 'indisponivel',
        regiao: regiaoInfo,
        metricas: null,
        impacto: null,
      };
    }

    // 4. Se o serviço responder, mas não contiver as métricas esperadas: "indisponivel"
    if (!metricasData || !metricasData.metrics) {
      return {
        servidor_id: servidor.id,
        nome: servidor.name,
        status: 'indisponivel',
        regiao: regiaoInfo,
        metricas: null,
        impacto: null,
      };
    }

    // 5. Servidor disponível e com métricas: executa o cálculo oficial
    const { collection_interval_seconds, metrics } = metricasData;
    const resultado = CalculadoraImpacto.calcular(
      collection_interval_seconds,
      metrics.cpu_percent,
      metrics.memory_gb,
      metrics.disk_gb,
      metrics.network_gb,
      carbono ? carbono.carbon_intensity_gco2e_per_kwh : null,
    );

    return {
      servidor_id: servidor.id,
      nome: servidor.name,
      status: 'disponivel',
      regiao: regiaoInfo,
      metricas: {
        intervalo_segundos: collection_interval_seconds,
        cpu_percent: metrics.cpu_percent,
        memoria_gb: metrics.memory_gb,
        disco_gb: metrics.disk_gb,
        rede_gb: metrics.network_gb,
      },
      impacto: {
        potencia_watts: resultado.potenciaWatts,
        energia_kwh: resultado.energiaKwh,
        emissoes_gco2e: resultado.emissoesGco2e,
      },
    };
  }

  // Calcula em lote o impacto de todos os servidores ativos
  async calcularImpactoTodos(): Promise<ServidorImpactoResponseDto[]> {
    const servidores = await this.servidoresService.listServidores();
    const resultados: ServidorImpactoResponseDto[] = [];

    for (const s of servidores) {
      try {
        const impacto = await this.calcularImpactoPorServidor(s.id);
        resultados.push(impacto);
      } catch {
        resultados.push({
          servidor_id: s.id,
          nome: s.name,
          status: 'indisponivel',
          regiao: {
            codigo: s.location?.region_code ?? '',
            pais: s.location?.country ?? '',
            cidade: s.location?.city ?? null,
            carbon_intensity_gco2e_kwh: 0,
            renewable_share_percent: 0,
          },
          metricas: null,
          impacto: null,
        });
      }
    }

    return resultados;
  }

  // Detalhamento do impacto discriminado por métrica (CPU, Memória, Disco, Rede)
  async calcularImpactoDiscriminadoPorServidor(
    idServidor: string,
    criterio: 'instantaneo' | 'acumulado' = 'instantaneo',
  ): Promise<ServidorImpactoDiscriminadoResponseDto> {
    // 1. Busca dados cadastrais do servidor
    let servidor;
    let servidorDb: typeof schema.servidores.$inferSelect | undefined = undefined;

    try {
      servidor = await this.servidoresService.servidorById(idServidor);
    } catch {
      const [sDb] = await this.db
        .select()
        .from(schema.servidores)
        .where(eq(schema.servidores.id, idServidor))
        .limit(1);
      servidorDb = sDb;
      if (!servidorDb) {
        throw new NotFoundException(`Servidor com ID '${idServidor}' não encontrado`);
      }
    }

    const nome = servidor?.name ?? servidorDb?.nome ?? idServidor;
    const regionCode = servidor?.location?.region_code ?? servidorDb?.codigoRegiao ?? '';

    // 2. Busca intensidade de carbono
    let carbono: CarbonIntensityResponse | null = null;
    let regiaoDb: typeof schema.regioes.$inferSelect | undefined = undefined;

    if (regionCode) {
      try {
        carbono = await this.carbonService.getCarbonIntensityById(regionCode);
      } catch {
        const [r] = await this.db
          .select()
          .from(schema.regioes)
          .where(eq(schema.regioes.codigo, regionCode))
          .limit(1);
        regiaoDb = r;
      }
    }

    const regiaoInfo = {
      codigo: regionCode,
      pais: servidor?.location?.country ?? regiaoDb?.pais ?? '',
      cidade: servidor?.location?.city ?? regiaoDb?.cidade ?? null,
      carbon_intensity_gco2e_kwh: carbono?.carbon_intensity_gco2e_per_kwh ?? Number(regiaoDb?.carbonIntensityGco2eKwh ?? 0),
      renewable_share_percent: carbono?.renewable_share_percent ?? Number(regiaoDb?.renewableSharePercent ?? 0),
    };

    const statusAtual = servidorDb?.statusAtual ?? (servidor ? 'disponivel' : 'indisponivel');

    // 3. Critério ACUMULADO: agrega todas as coletas históricas registradas no banco
    if (criterio === 'acumulado') {
      const coletas = await this.db
        .select({
          cpuPercent: schema.coletasMetricas.cpuPercent,
          memoriaGb: schema.coletasMetricas.memoriaGb,
          discoGb: schema.coletasMetricas.discoGb,
          redeGb: schema.coletasMetricas.redeGb,
          intervaloSegundos: schema.coletasMetricas.intervaloSegundos,
          carbonIntensityFator: schema.coletasMetricas.carbonIntensityFator,
        })
        .from(schema.coletasMetricas)
        .where(eq(schema.coletasMetricas.servidorId, idServidor));

      if (coletas.length > 0) {
        let totalEnergiaCpu = 0;
        let totalEnergiaRam = 0;
        let totalEnergiaDisco = 0;
        let totalEnergiaRede = 0;

        let totalEmissoesCpu = 0;
        let totalEmissoesRam = 0;
        let totalEmissoesDisco = 0;
        let totalEmissoesRede = 0;

        let somaPotenciaCpu = 0;
        let somaPotenciaRam = 0;
        let somaPotenciaDisco = 0;
        let somaPotenciaRede = 0;

        let somaCpuPercent = 0;
        let somaRamGb = 0;
        let somaDiskGb = 0;
        let somaRedeGb = 0;

        for (const c of coletas) {
          const cpu = Number(c.cpuPercent ?? 0);
          const ram = Number(c.memoriaGb ?? 0);
          const disk = Number(c.discoGb ?? 0);
          const rede = Number(c.redeGb ?? 0);
          const dtHoras = Number(c.intervaloSegundos ?? 30) / 3600;
          const ci = Number(c.carbonIntensityFator ?? regiaoInfo.carbon_intensity_gco2e_kwh);

          const pCpu = (cpu / 100) * CalculadoraImpacto.CPU_MAX_WATTS;
          const pRam = ram * CalculadoraImpacto.RAM_WATTS_PER_GB;
          const pDisk = disk * CalculadoraImpacto.DISK_WATTS_PER_GB;
          const pRede = rede * CalculadoraImpacto.NETWORK_WATTS_PER_GB;

          const eCpu = (pCpu * dtHoras) / 1000;
          const eRam = (pRam * dtHoras) / 1000;
          const eDisk = (pDisk * dtHoras) / 1000;
          const eRede = (pRede * dtHoras) / 1000;

          totalEnergiaCpu += eCpu;
          totalEnergiaRam += eRam;
          totalEnergiaDisco += eDisk;
          totalEnergiaRede += eRede;

          totalEmissoesCpu += eCpu * ci;
          totalEmissoesRam += eRam * ci;
          totalEmissoesDisco += eDisk * ci;
          totalEmissoesRede += eRede * ci;

          somaPotenciaCpu += pCpu;
          somaPotenciaRam += pRam;
          somaPotenciaDisco += pDisk;
          somaPotenciaRede += pRede;

          somaCpuPercent += cpu;
          somaRamGb += ram;
          somaDiskGb += disk;
          somaRedeGb += rede;
        }

        const n = coletas.length;
        const totalEnergiaKwh = totalEnergiaCpu + totalEnergiaRam + totalEnergiaDisco + totalEnergiaRede;
        const totalEmissoesGco2e = totalEmissoesCpu + totalEmissoesRam + totalEmissoesDisco + totalEmissoesRede;
        const potenciaMediaWatts = (somaPotenciaCpu + somaPotenciaRam + somaPotenciaDisco + somaPotenciaRede) / n;

        const calcItemAcumulado = (
          pTotalEnergia: number,
          pTotalEmissoes: number,
          somaPotencia: number,
          somaBruto: number,
          unidade: string,
        ) => {
          const pct = totalEnergiaKwh > 0 ? Number(((pTotalEnergia / totalEnergiaKwh) * 100).toFixed(2)) : 0;
          return {
            valor_bruto: Number((somaBruto / n).toFixed(2)),
            unidade,
            potencia_watts: Number((somaPotencia / n).toFixed(2)),
            energia_kwh: Number(pTotalEnergia.toFixed(7)),
            emissoes_gco2e: Number(pTotalEmissoes.toFixed(4)),
            percentual_impacto: pct,
          };
        };

        return {
          servidor_id: idServidor,
          nome,
          status: statusAtual,
          criterio: 'acumulado',
          origem: 'banco_historico',
          total_coletas: n,
          regiao: regiaoInfo,
          intervalo_segundos: 30,
          totais: {
            potencia_watts: Number(potenciaMediaWatts.toFixed(2)),
            energia_kwh: Number(totalEnergiaKwh.toFixed(7)),
            emissoes_gco2e: Number(totalEmissoesGco2e.toFixed(4)),
          },
          discriminacao: {
            cpu: calcItemAcumulado(totalEnergiaCpu, totalEmissoesCpu, somaPotenciaCpu, somaCpuPercent, '%'),
            memoria: calcItemAcumulado(totalEnergiaRam, totalEmissoesRam, somaPotenciaRam, somaRamGb, 'GB'),
            disco: calcItemAcumulado(totalEnergiaDisco, totalEmissoesDisco, somaPotenciaDisco, somaDiskGb, 'GB'),
            rede: calcItemAcumulado(totalEnergiaRede, totalEmissoesRede, somaPotenciaRede, somaRedeGb, 'GB'),
          },
        };
      }
    }

    // 4. Critério INSTANTÂNEO (padrão): Tenta coletar métricas em tempo real
    let metricasData: ServidorMetricsData | null = null;
    if (servidor) {
      try {
        metricasData = await this.servidoresService.metricsServidor(idServidor);
      } catch {
        // Ignora falha de tempo real e tenta buscar última coleta no banco
      }
    }

    // Se temos métricas em tempo real:
    if (metricasData && metricasData.metrics) {
      const { collection_interval_seconds, metrics } = metricasData;
      const calc = CalculadoraImpacto.calcularDiscriminado(
        collection_interval_seconds,
        metrics.cpu_percent,
        metrics.memory_gb,
        metrics.disk_gb,
        metrics.network_gb,
        regiaoInfo.carbon_intensity_gco2e_kwh,
      );

      return {
        servidor_id: idServidor,
        nome,
        status: 'disponivel',
        criterio: 'instantaneo',
        origem: 'tempo_real',
        regiao: regiaoInfo,
        intervalo_segundos: collection_interval_seconds,
        totais: calc.totais,
        discriminacao: calc.discriminacao,
      };
    }

    // Caso contrário (servidor indisponível ou removido), busca a última coleta gravada no banco
    const [ultimaColeta] = await this.db
      .select()
      .from(schema.coletasMetricas)
      .where(eq(schema.coletasMetricas.servidorId, idServidor))
      .orderBy(desc(schema.coletasMetricas.coletadoEm))
      .limit(1);

    if (ultimaColeta) {
      const calc = CalculadoraImpacto.calcularDiscriminado(
        30,
        Number(ultimaColeta.cpuPercent ?? 0),
        Number(ultimaColeta.memoriaGb ?? 0),
        Number(ultimaColeta.discoGb ?? 0),
        Number(ultimaColeta.redeGb ?? 0),
        Number(ultimaColeta.carbonIntensityFator ?? regiaoInfo.carbon_intensity_gco2e_kwh),
      );

      return {
        servidor_id: idServidor,
        nome,
        status: statusAtual,
        criterio: 'instantaneo',
        origem: 'banco_historico',
        regiao: regiaoInfo,
        intervalo_segundos: 30,
        totais: calc.totais,
        discriminacao: calc.discriminacao,
      };
    }

    return {
      servidor_id: idServidor,
      nome,
      status: statusAtual,
      criterio: criterio,
      origem: 'indisponivel',
      regiao: regiaoInfo,
      intervalo_segundos: 0,
      totais: null,
      discriminacao: null,
    };
  }
}
