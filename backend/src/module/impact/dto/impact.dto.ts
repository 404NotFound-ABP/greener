import { ApiProperty } from '@nestjs/swagger';

export class RegiaoDetalhesDto {
  @ApiProperty({ example: 'br-sudeste' })
  codigo!: string;

  @ApiProperty({ example: 'Brazil' })
  pais!: string;

  @ApiProperty({ example: 'Sao Paulo', nullable: true })
  cidade!: string | null;

  @ApiProperty({ example: 85, description: 'gCO2e emitidos por kWh na região' })
  carbon_intensity_gco2e_kwh!: number;

  @ApiProperty({ example: 83, description: 'Porcentagem de energia renovável' })
  renewable_share_percent!: number;
}

export class MetricasUsoDto {
  @ApiProperty({ example: 27, description: 'Intervalo da coleta em segundos' })
  intervalo_segundos!: number;

  @ApiProperty({ example: 50.0, description: 'Uso de CPU em %' })
  cpu_percent!: number;

  @ApiProperty({ example: 2.0, description: 'Memória alocada em GB' })
  memoria_gb!: number;

  @ApiProperty({ example: 10.0, description: 'Disco utilizado em GB' })
  disco_gb!: number;

  @ApiProperty({ example: 1.0, description: 'Tráfego de rede em GB' })
  rede_gb!: number;
}

export class CalculosImpactoDto {
  @ApiProperty({ example: 50.87, description: 'Potência média calculada em Watts' })
  potencia_watts!: number;

  @ApiProperty({ example: 0.0003815, description: 'Consumo de energia no período em kWh' })
  energia_kwh!: number;

  @ApiProperty({ example: 0.0324, description: 'Emissão de CO2 equivalente gerada em gCO2e', nullable: true })
  emissoes_gco2e!: number | null;
}

export class ServidorImpactoResponseDto {
  @ApiProperty({ example: 'billing-api' })
  servidor_id!: string;

  @ApiProperty({ example: 'Billing API' })
  nome!: string;

  @ApiProperty({ example: 'disponivel', enum: ['disponivel', 'indisponivel', 'sem_metricas'] })
  status!: string;

  @ApiProperty({ type: RegiaoDetalhesDto })
  regiao!: RegiaoDetalhesDto;

  @ApiProperty({ type: MetricasUsoDto, nullable: true })
  metricas!: MetricasUsoDto | null;

  @ApiProperty({ type: CalculosImpactoDto, nullable: true })
  impacto!: CalculosImpactoDto | null;
}
