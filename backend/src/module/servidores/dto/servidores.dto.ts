import { ApiProperty } from '@nestjs/swagger';

export class RegiaoServidorDto {
  @ApiProperty({ example: 'br-sudeste' })
  codigo!: string;

  @ApiProperty({ example: 'Brazil' })
  pais!: string;

  @ApiProperty({ example: 'Sudeste', required: false })
  regiao?: string;

  @ApiProperty({ example: 'Sao Paulo', nullable: true })
  cidade!: string | null;

  @ApiProperty({ example: 85 })
  carbon_intensity_gco2e_kwh!: number;

  @ApiProperty({ example: 83 })
  renewable_share_percent!: number;
}

export class UltimaColetaServidorDto {
  @ApiProperty({ example: '2026-10-25T20:47:18.311Z' })
  coletado_em!: Date;

  @ApiProperty({ example: 'disponivel', enum: ['disponivel', 'indisponivel', 'removido'], required: false })
  status?: string;

  @ApiProperty({ example: 87.61 })
  potencia_watts!: number;

  @ApiProperty({ example: 0.000292 })
  energia_kwh!: number;

  @ApiProperty({ example: 0.1104 })
  emissoes_gco2e!: number;

  @ApiProperty({ example: 85.7 })
  cpu_percent!: number;

  @ApiProperty({ example: 4.31 })
  memoria_gb!: number;

  @ApiProperty({ example: 27.0 })
  disco_gb!: number;

  @ApiProperty({ example: 1.22 })
  rede_gb!: number;
}

export class ServidorComRegiaoDto {
  @ApiProperty({ example: 'billing-api' })
  id!: string;

  @ApiProperty({ example: 'Billing API' })
  nome!: string;

  @ApiProperty({ example: 'disponivel', enum: ['disponivel', 'indisponivel', 'removido'] })
  status!: string;

  @ApiProperty({ example: true })
  ativo!: boolean;

  @ApiProperty({ example: '2026-10-25T18:00:00.000Z' })
  atualizado_em!: Date;

  @ApiProperty({ type: RegiaoServidorDto, nullable: true })
  regiao!: RegiaoServidorDto | null;

  @ApiProperty({ type: UltimaColetaServidorDto, nullable: true })
  ultima_coleta!: UltimaColetaServidorDto | null;
}

export class ResumoDashboardDto {
  @ApiProperty({ example: 8 })
  total_servidores!: number;

  @ApiProperty({ example: 7 })
  disponiveis!: number;

  @ApiProperty({ example: 0 })
  indisponiveis!: number;

  @ApiProperty({ example: 1 })
  removidos!: number;

  @ApiProperty({ example: 485.2, description: 'Soma da potência instantânea de todos os servidores ativos em Watts' })
  potencia_atual_watts!: number;

  @ApiProperty({ example: 0.45892, description: 'Consumo total de energia acumulado no histórico em kWh' })
  consumo_total_acumulado_kwh!: number;

  @ApiProperty({ example: 124.53, description: 'Emissões totais acumuladas no histórico em gCO2e' })
  emissoes_total_acumuladas_gco2e!: number;
}

export class DashboardResponseDto {
  @ApiProperty({ type: ResumoDashboardDto })
  resumo!: ResumoDashboardDto;

  @ApiProperty({ type: [ServidorComRegiaoDto] })
  servidores!: ServidorComRegiaoDto[];
}

export class RankingItemDto {
  @ApiProperty({ example: 1 })
  posicao!: number;

  @ApiProperty({ example: 'checkout-worker' })
  id!: string;

  @ApiProperty({ example: 'Checkout Worker' })
  nome!: string;

  @ApiProperty({ example: 'disponivel' })
  status!: string;

  @ApiProperty({ example: 'United States' })
  regiao!: string;

  @ApiProperty({ example: 378 })
  intensidade_carbono!: number;

  @ApiProperty({ example: 144, required: false })
  total_coletas?: number;

  @ApiProperty({ example: 0.100686, description: 'Energia em kWh (acumulada ou instantânea)' })
  energia_total_kwh?: number;

  @ApiProperty({ example: 38.0594, description: 'Emissões em gCO2e (acumuladas ou instantâneas)' })
  emissoes_total_gco2e?: number;

  @ApiProperty({ example: 77.39, description: 'Potência média em Watts' })
  potencia_media_watts?: number;

  @ApiProperty({ example: 75.39, description: 'CPU média em %' })
  cpu_media_percent?: number;

  @ApiProperty({ example: 87.61, required: false })
  potencia_watts?: number;

  @ApiProperty({ example: 0.000292, required: false })
  energia_kwh?: number;

  @ApiProperty({ example: 0.1104, required: false })
  emissoes_gco2e?: number;

  @ApiProperty({ example: 85.7, required: false })
  cpu_percent?: number;
}

export class RankingResponseDto {
  @ApiProperty({ example: 'acumulado', enum: ['acumulado', 'instantaneo'] })
  criterio!: string;

  @ApiProperty({ example: 'emissoes', enum: ['emissoes', 'energia'] })
  ordenado_por!: string;

  @ApiProperty({ example: 'desc', enum: ['desc', 'asc'] })
  direcao!: string;

  @ApiProperty({ example: 8 })
  total!: number;

  @ApiProperty({ type: [RankingItemDto] })
  ranking!: RankingItemDto[];
}

export class ComparativoItemDto {
  @ApiProperty({ example: 'checkout-worker' })
  id!: string;

  @ApiProperty({ example: 'Checkout Worker' })
  nome!: string;

  @ApiProperty({ example: 'disponivel' })
  status!: string;

  @ApiProperty({ example: 'United States' })
  regiao!: string;

  @ApiProperty({ example: 378 })
  intensidade_carbono_regional!: number;

  @ApiProperty({ example: 87.61 })
  potencia_watts!: number;

  @ApiProperty({ example: 0.000292 })
  energia_kwh!: number;

  @ApiProperty({ example: 0.1104 })
  emissoes_gco2e!: number;

  @ApiProperty({ example: 85.7 })
  cpu_percent!: number;

  @ApiProperty({ example: 4.31 })
  memoria_gb!: number;
}

export class ComparativoResponseDto {
  @ApiProperty({ example: 2 })
  total_comparados!: number;

  @ApiProperty({ type: [ComparativoItemDto] })
  servidores!: ComparativoItemDto[];
}

export class PontoHistoricoDto {
  @ApiProperty({ example: '2026-10-25T20:47:18.311Z' })
  timestamp!: Date;

  @ApiProperty({ example: 'disponivel' })
  status!: string;

  @ApiProperty({ example: 87.61 })
  potencia_watts!: number;

  @ApiProperty({ example: 0.000292 })
  energia_kwh!: number;

  @ApiProperty({ example: 0.1104 })
  emissoes_gco2e!: number;

  @ApiProperty({ example: 85.7 })
  cpu_percent!: number;

  @ApiProperty({ example: 4.31 })
  memoria_gb!: number;

  @ApiProperty({ example: 27.0 })
  disco_gb!: number;

  @ApiProperty({ example: 1.22 })
  rede_gb!: number;
}

export class HistoricoServidorResponseDto {
  @ApiProperty({
    example: {
      id: 'checkout-worker',
      nome: 'Checkout Worker',
      status: 'disponivel',
      codigo_regiao: 'us-east',
    },
  })
  servidor!: {
    id: string;
    nome: string;
    status: string;
    codigo_regiao: string | null;
  };

  @ApiProperty({ example: 30 })
  total_pontos!: number;

  @ApiProperty({ type: [PontoHistoricoDto] })
  pontos!: PontoHistoricoDto[];
}
