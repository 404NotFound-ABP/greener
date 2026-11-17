import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt } from 'class-validator';

// Intervalos permitidos em segundos: 5m, 15m, 30m, 1h, 1d, 1 mês (30d)
export const INTERVALOS_PERMITIDOS_SEGUNDOS = [300, 900, 1800, 3600, 86400, 2592000] as const;
export const INTERVALO_PADRAO_SEGUNDOS = 300;

export class AtualizarIntervalosDto {
  @ApiProperty({
    example: 300,
    enum: INTERVALOS_PERMITIDOS_SEGUNDOS,
    description: 'Frequência do coletor em segundos: 300 (5m), 900 (15m), 1800 (30m), 3600 (1h), 86400 (1d) ou 2592000 (1 mês)',
  })
  @IsInt({ message: 'intervalo_coleta_segundos deve ser um número inteiro.' })
  @IsIn(INTERVALOS_PERMITIDOS_SEGUNDOS, {
    message: 'intervalo_coleta_segundos inválido. Valores permitidos: 300, 900, 1800, 3600, 86400, 2592000.',
  })
  intervalo_coleta_segundos!: number;

  @ApiProperty({
    example: 300,
    enum: INTERVALOS_PERMITIDOS_SEGUNDOS,
    description: 'Intervalo de atualização da apresentação no frontend em segundos: 300 (5m), 900 (15m), 1800 (30m), 3600 (1h), 86400 (1d) ou 2592000 (1 mês)',
  })
  @IsInt({ message: 'intervalo_atualizacao_segundos deve ser um número inteiro.' })
  @IsIn(INTERVALOS_PERMITIDOS_SEGUNDOS, {
    message: 'intervalo_atualizacao_segundos inválido. Valores permitidos: 300, 900, 1800, 3600, 86400, 2592000.',
  })
  intervalo_atualizacao_segundos!: number;
}

export class ConfiguracaoIntervalosDto {
  @ApiProperty({ example: 300, description: 'Frequência configurada para o coletor em segundos' })
  intervalo_coleta_segundos!: number;

  @ApiProperty({ example: 300, description: 'Intervalo de atualização configurado para o frontend em segundos' })
  intervalo_atualizacao_segundos!: number;

  @ApiProperty({ example: [...INTERVALOS_PERMITIDOS_SEGUNDOS], type: [Number] })
  intervalos_permitidos_segundos!: number[];

  @ApiProperty({ example: '2026-11-16T23:41:00.000Z', nullable: true })
  atualizado_em!: Date | null;
}

export class DetalhesColetaDto {
  @ApiProperty({ example: 8 })
  servidoresProcessados!: number;

  @ApiProperty({ example: 3.25, required: false })
  duracaoSegundos?: number;

  @ApiProperty({ example: 'Erro de timeout', required: false })
  erro?: string;
}

export class ColetaExecucaoResultadoDto {
  @ApiProperty({ example: 'sucesso' })
  status!: string;

  @ApiProperty({ example: 'Ciclo de coleta executado com sucesso.' })
  mensagem!: string;

  @ApiProperty({ type: DetalhesColetaDto, required: false })
  detalhes?: DetalhesColetaDto;
}

export class CollectorStatusDto {
  @ApiProperty({ example: false })
  executando!: boolean;

  @ApiProperty({ example: 300, description: 'Intervalo configurado do coletor em segundos' })
  intervaloConfiguradoSegundos!: number;

  @ApiProperty({ example: 300, description: 'Intervalo de atualização para o frontend em segundos' })
  intervaloAtualizacaoSegundos!: number;

  @ApiProperty({ example: '2026-10-25T20:47:18.311Z', nullable: true })
  ultimaExecucao!: Date | null;

  @ApiProperty({ example: 145 })
  ciclosCompletadosNestaSessao!: number;

  @ApiProperty({ example: 1250, description: 'Total de medições históricas persistidas no PostgreSQL' })
  totalMedicoesNoBanco!: number;

  @ApiProperty({ example: 8 })
  totalServidoresCadastrados!: number;

  @ApiProperty({ example: 5 })
  totalRegioesCadastradas!: number;
}

export class ColetaMetricaItemDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'checkout-worker' })
  servidorId!: string;

  @ApiProperty({ example: 'us-east', nullable: true })
  codigoRegiao!: string | null;

  @ApiProperty({ example: 'disponivel' })
  status!: string;

  @ApiProperty({ example: 30, nullable: true })
  intervaloSegundos!: number | null;

  @ApiProperty({ example: '85.7', nullable: true })
  cpuPercent!: string | null;

  @ApiProperty({ example: '4.31', nullable: true })
  memoriaGb!: string | null;

  @ApiProperty({ example: '27.0', nullable: true })
  discoGb!: string | null;

  @ApiProperty({ example: '1.22', nullable: true })
  redeGb!: string | null;

  @ApiProperty({ example: '87.61', nullable: true })
  potenciaWatts!: string | null;

  @ApiProperty({ example: '0.000292', nullable: true })
  energiaKwh!: string | null;

  @ApiProperty({ example: '378', nullable: true })
  carbonIntensityFator!: string | null;

  @ApiProperty({ example: '0.1104', nullable: true })
  emissoesGco2e!: string | null;

  @ApiProperty({ example: '2026-10-25T20:47:18.311Z' })
  coletadoEm!: Date;
}

