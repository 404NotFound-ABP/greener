import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ServidoresService } from '@/module/servidores/servidores.service';
import { CarbonService } from '@/module/carbon/carbon.service';
import { ServidorImpactoResponseDto } from './dto/impact.dto';

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
    carbonIntensity: number
  ) {
    const pCpu = (cpuPercent / 100) * this.CPU_MAX_WATTS;
    const pRam = ramGb * this.RAM_WATTS_PER_GB;
    const pDisk = diskGb * this.DISK_WATTS_PER_GB;
    const pRede = networkGb * this.NETWORK_WATTS_PER_GB;
    const potenciaWatts = pCpu + pRam + pDisk + pRede;

    const tempoHoras = intervaloSegundos / 3600;
    const energiaKwh = (potenciaWatts * tempoHoras) / 1000;
    const emissoesGco2e = energiaKwh * carbonIntensity;

    return {
      potenciaWatts: Number(potenciaWatts.toFixed(2)),
      energiaKwh: Number(energiaKwh.toFixed(7)),
      emissoesGco2e: Number(emissoesGco2e.toFixed(4)),
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
    // 1. Dados cadastrais do servidor (para obter nome e region_code)
    const servidor = await this.servidoresService.servidorById(idServidor);

    // 2. Coleta de métricas atuais
    const metricasData = await this.servidoresService.metricsServidor(idServidor);
    const { collection_interval_seconds, metrics } = metricasData;

    // 3. Consulta o fator de carbono da região do servidor
    const carbono = await this.carbonService.getCarbonIntensityById(servidor.location.region_code);

    // 4. Executa o cálculo com os fatores oficiais da FATEC
    const resultado = CalculadoraImpacto.calcular(
      collection_interval_seconds,
      metrics.cpu_percent,
      metrics.memory_gb,
      metrics.disk_gb,
      metrics.network_gb,
      carbono.carbon_intensity_gco2e_per_kwh
    );

    return {
      servidor_id: servidor.id,
      nome: servidor.name,
      status: 'disponivel',
      regiao: {
        codigo: servidor.location.region_code,
        pais: servidor.location.country,
        cidade: servidor.location.city,
        carbon_intensity_gco2e_kwh: carbono.carbon_intensity_gco2e_per_kwh,
        renewable_share_percent: carbono.renewable_share_percent,
      },
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
