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

  @ApiProperty({ example: -23.5505, nullable: true })
  latitude!: number | null;

  @ApiProperty({ example: -46.6333, nullable: true })
  longitude!: number | null;

  @ApiProperty({ example: 85, nullable: true })
  carbon_intensity_gco2e_kwh!: number | null;

  @ApiProperty({ example: 83, nullable: true })
  renewable_share_percent!: number | null;
}

export class UltimaColetaServidorDto {
  @ApiProperty({ example: '2026-10-25T20:47:18.311Z' })
  coletado_em!: Date;

  @ApiProperty({ example: 'disponivel', enum: ['disponivel', 'indisponivel', 'removido'], required: false })
  status?: string;

  @ApiProperty({ example: 87.61, nullable: true })
  potencia_watts!: number | null;

  @ApiProperty({ example: 0.000292, nullable: true })
  energia_kwh!: number | null;

  @ApiProperty({ example: 0.1104, nullable: true })
  emissoes_gco2e!: number | null;

  @ApiProperty({ example: 85.7, nullable: true })
  cpu_percent!: number | null;

  @ApiProperty({ example: 4.31, nullable: true })
  memoria_gb!: number | null;

  @ApiProperty({ example: 27.0, nullable: true })
  disco_gb!: number | null;

  @ApiProperty({ example: 1.22, nullable: true })
  rede_gb!: number | null;
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

  @ApiProperty({ example: 7 })
  servidores_com_metricas!: number;

  @ApiProperty({ example: 1 })
  servidores_sem_metricas!: number;

  @ApiProperty({ example: true })
  cobertura_parcial!: boolean;

  @ApiProperty({ example: '2026-10-25T18:00:00.000Z', nullable: true })
  periodo_inicio!: Date | null;

  @ApiProperty({ example: '2026-10-25T20:47:18.311Z', nullable: true })
  periodo_fim!: Date | null;

  @ApiProperty({ example: 300, description: 'Janela de amostragem aplicada em segundos' })
  janela_amostragem_segundos!: number;

  @ApiProperty({ example: 300, description: 'Intervalo de atualização configurado para o frontend em segundos' })
  intervalo_atualizacao_segundos!: number;

  @ApiProperty({ example: 485.2, description: 'Soma da potência instantânea de todos os servidores ativos em Watts' })
  potencia_atual_watts!: number;

  @ApiProperty({ example: 0.45892, description: 'Consumo total de energia acumulado no histórico em kWh', nullable: true })
  consumo_total_acumulado_kwh!: number | null;

  @ApiProperty({ example: 124.53, description: 'Emissões totais acumuladas no histórico em gCO2e', nullable: true })
  emissoes_total_acumuladas_gco2e!: number | null;
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

  @ApiProperty({ example: 378, nullable: true })
  intensidade_carbono!: number | null;

  @ApiProperty({ example: 144, required: false })
  total_coletas?: number;

  @ApiProperty({ example: 0.100686, description: 'Energia em kWh (acumulada ou instantânea)', nullable: true })
  energia_total_kwh?: number | null;

  @ApiProperty({ example: 38.0594, description: 'Emissões em gCO2e (acumuladas ou instantâneas)', nullable: true })
  emissoes_total_gco2e?: number | null;

  @ApiProperty({ example: 77.39, description: 'Potência média em Watts', nullable: true })
  potencia_media_watts?: number | null;

  @ApiProperty({ example: 75.39, description: 'CPU média em %', nullable: true })
  cpu_media_percent?: number | null;

  @ApiProperty({ example: 87.61, required: false, nullable: true })
  potencia_watts?: number | null;

  @ApiProperty({ example: 0.000292, required: false, nullable: true })
  energia_kwh?: number | null;

  @ApiProperty({ example: 0.1104, required: false, nullable: true })
  emissoes_gco2e?: number | null;

  @ApiProperty({ example: 85.7, required: false, nullable: true })
  cpu_percent?: number | null;
}

export class RankingResponseDto {
  @ApiProperty({ example: 'acumulado', enum: ['acumulado', 'instantaneo'] })
  criterio!: string;

  @ApiProperty({ example: 'emissoes', enum: ['emissoes', 'energia'] })
  ordenado_por!: string;

  @ApiProperty({ example: 'desc', enum: ['desc', 'asc'] })
  direcao!: string;

  @ApiProperty({ example: 300, description: 'Janela de amostragem aplicada em segundos' })
  janela_amostragem_segundos!: number;

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

  @ApiProperty({ example: 378, nullable: true })
  intensidade_carbono_regional!: number | null;

  @ApiProperty({ example: 87.61, nullable: true })
  potencia_watts!: number | null;

  @ApiProperty({ example: 0.000292, nullable: true })
  energia_kwh!: number | null;

  @ApiProperty({ example: 0.1104, nullable: true })
  emissoes_gco2e!: number | null;

  @ApiProperty({ example: 85.7, nullable: true })
  cpu_percent!: number | null;

  @ApiProperty({ example: 4.31, nullable: true })
  memoria_gb!: number | null;
}

export class ComparativoResponseDto {
  @ApiProperty({ example: 300, description: 'Janela de amostragem aplicada em segundos' })
  janela_amostragem_segundos!: number;

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

  @ApiProperty({ example: 87.61, nullable: true })
  potencia_watts!: number | null;

  @ApiProperty({ example: 0.000292, nullable: true })
  energia_kwh!: number | null;

  @ApiProperty({ example: 0.1104, nullable: true })
  emissoes_gco2e!: number | null;

  @ApiProperty({ example: 85.7, nullable: true })
  cpu_percent!: number | null;

  @ApiProperty({ example: 4.31, nullable: true })
  memoria_gb!: number | null;

  @ApiProperty({ example: 27.0, nullable: true })
  disco_gb!: number | null;

  @ApiProperty({ example: 1.22, nullable: true })
  rede_gb!: number | null;
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

  @ApiProperty({ example: 300, description: 'Janela de amostragem aplicada em segundos' })
  janela_amostragem_segundos!: number;

  @ApiProperty({
    example: { inicio: '2026-11-16T00:00:00.000Z', fim: '2026-11-16T23:59:59.000Z' },
    description: 'Período utilizado para filtrar o histórico',
  })
  periodo!: {
    inicio: Date | null;
    fim: Date | null;
  };

  @ApiProperty({ example: 30 })
  total_pontos!: number;

  @ApiProperty({ type: [PontoHistoricoDto] })
  pontos!: PontoHistoricoDto[];
}
