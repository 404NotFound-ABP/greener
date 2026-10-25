import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ServidoresService } from '@/module/servidores/servidores.service';
import { CarbonService } from '@/module/carbon/carbon.service';
import { CarbonIntensityResponse } from '@/module/interface/carbon.interface';
import { ServidorMetricsData } from '@/module/interface/servidor.interface';
import { ServidorImpactoResponseDto } from './dto/impact.dto';
import { DRIZZLE_PROVIDER, DrizzleDB, schema } from '@/database';
import { eq } from 'drizzle-orm';

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
    carbonIntensity: number | null
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
}

@Injectable()
export class ImpactService {
  constructor(
    private readonly servidoresService: ServidoresService,
    private readonly carbonService: CarbonService,
  ) {}

  async calcularImpactoPorServidor(idServidor: string): Promise<ServidorImpactoResponseDto> {
    // 1. Dados cadastrais do servidor (lança 404 se não for encontrado)
    const servidor = await this.servidoresService.servidorById(idServidor);

    // 2. Consulta a intensidade de carbono da região
    let carbono: CarbonIntensityResponse | null = null;
    try {
      carbono = await this.carbonService.getCarbonIntensityById(servidor.location.region_code);
    } catch {
      console.warn(`Não foi possível obter fator de carbono para região: ${servidor.location.region_code}`);
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
      carbono ? carbono.carbon_intensity_gco2e_per_kwh : null
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
}
