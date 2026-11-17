import { Controller, Get, Post, Query, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CollectorService } from './collector.service';
import {
  ColetaExecucaoResultadoDto,
  CollectorStatusDto,
  ColetaMetricaItemDto,
} from './dto/collector.dto';

@ApiTags('Coleta e Agendamento')
@Controller('api/coleta')
export class CollectorController {
  constructor(private readonly collectorService: CollectorService) {}

  @Post('executar')
  @ApiOperation({ summary: 'Dispara manualmente um ciclo de coleta e persiste no banco' })
  @ApiResponse({ status: 200, description: 'Ciclo de coleta finalizado', type: ColetaExecucaoResultadoDto })
  @ApiResponse({ status: 503, description: 'Falha ao executar ciclo de coleta', type: ColetaExecucaoResultadoDto })
  async dispararColeta(): Promise<ColetaExecucaoResultadoDto> {
    const resultado = await this.collectorService.executarColetaManual();
    if (resultado.status === 'erro') {
      throw new ServiceUnavailableException(resultado);
    }
    return resultado;
  }

  @Get('status')
  @ApiOperation({ summary: 'Estatísticas do monitoramento e total de medições salvas' })
  @ApiResponse({ status: 200, description: 'Estatísticas operacionais do coletor', type: CollectorStatusDto })
  async getStatus(): Promise<CollectorStatusDto> {
    return this.collectorService.getEstatisticasColeta();
  }

  @Get('historico')
  @ApiOperation({ summary: 'Lista as últimas medições salvas no PostgreSQL' })
  @ApiQuery({ name: 'servidorId', required: false, description: 'ID do servidor para filtrar' })
  @ApiQuery({ name: 'limite', required: false, description: 'Quantidade máxima de registros (padrão: 20)' })
  @ApiResponse({ status: 200, description: 'Lista de snapshots de medições históricas', type: [ColetaMetricaItemDto] })
  async getHistorico(
    @Query('servidorId') servidorId?: string,
    @Query('limite') limite?: string,
  ): Promise<any> {
    return this.collectorService.getHistorico(servidorId, Number(limite) || 20);
  }
}
