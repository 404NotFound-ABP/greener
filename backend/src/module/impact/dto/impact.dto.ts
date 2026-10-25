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

  @ApiProperty({ example: 'disponivel', enum: ['disponivel', 'indisponivel', 'removido'] })
  status!: string;

  @ApiProperty({ type: RegiaoDetalhesDto })
  regiao!: RegiaoDetalhesDto;

  @ApiProperty({ type: MetricasUsoDto, nullable: true })
  metricas!: MetricasUsoDto | null;

  @ApiProperty({ type: CalculosImpactoDto, nullable: true })
  impacto!: CalculosImpactoDto | null;
}

export class MetricaDiscriminadaDto {
  @ApiProperty({ example: 75.5, description: 'Valor bruto medido' })
  valor_bruto!: number;

  @ApiProperty({ example: '%', description: 'Unidade de medição (%, GB)' })
  unidade!: string;

  @ApiProperty({ example: 75.5, description: 'Potência calculada gerada por este recurso em Watts' })
  potencia_watts!: number;

  @ApiProperty({ example: 0.000629, description: 'Energia consumida por este recurso em kWh' })
  energia_kwh!: number;

  @ApiProperty({ example: 0.2378, description: 'Emissões de carbono geradas por este recurso em gCO2e', nullable: true })
  emissoes_gco2e!: number | null;

  @ApiProperty({ example: 92.45, description: 'Participação percentual deste recurso no consumo total (%)' })
  percentual_impacto!: number;
}

export class DiscriminacaoImpactoDto {
  @ApiProperty({ type: MetricaDiscriminadaDto })
  cpu!: MetricaDiscriminadaDto;

  @ApiProperty({ type: MetricaDiscriminadaDto })
  memoria!: MetricaDiscriminadaDto;

  @ApiProperty({ type: MetricaDiscriminadaDto })
  disco!: MetricaDiscriminadaDto;

  @ApiProperty({ type: MetricaDiscriminadaDto })
  rede!: MetricaDiscriminadaDto;
}

export class ServidorImpactoDiscriminadoResponseDto {
  @ApiProperty({ example: 'checkout-worker' })
  servidor_id!: string;

  @ApiProperty({ example: 'Checkout Worker' })
  nome!: string;

  @ApiProperty({ example: 'disponivel', enum: ['disponivel', 'indisponivel', 'removido'] })
  status!: string;

  @ApiProperty({ example: 'tempo_real', enum: ['tempo_real', 'banco_historico'] })
  origem!: string;

  @ApiProperty({ type: RegiaoDetalhesDto })
  regiao!: RegiaoDetalhesDto;

  @ApiProperty({ example: 30, description: 'Intervalo de medição em segundos' })
  intervalo_segundos!: number;

  @ApiProperty({ type: CalculosImpactoDto, nullable: true })
  totais!: CalculosImpactoDto | null;

  @ApiProperty({ type: DiscriminacaoImpactoDto, nullable: true })
  discriminacao!: DiscriminacaoImpactoDto | null;
}

