import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: 30, description: 'Intervalo configurado em segundos' })
  intervaloConfiguradoSegundos!: number;

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

