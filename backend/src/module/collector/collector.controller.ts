import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CollectorService } from './collector.service';

@ApiTags('Coleta e Agendamento')
@Controller('api/coleta')
export class CollectorController {
  constructor(private readonly collectorService: CollectorService) {}

  @Post('executar')
  @ApiOperation({ summary: 'Dispara manualmente um ciclo de coleta e persiste no banco' })
  @ApiResponse({ status: 200, description: 'Ciclo de coleta finalizado' })
  async dispararColeta() {
    return this.collectorService.executarColetaManual();
  }

  @Get('status')
  @ApiOperation({ summary: 'Estatísticas do monitoramento e total de medições salvas' })
  async getStatus() {
    return this.collectorService.getEstatisticasColeta();
  }

  @Get('historico')
  @ApiOperation({ summary: 'Lista as últimas medições salvas no PostgreSQL' })
  @ApiQuery({ name: 'servidorId', required: false, description: 'ID do servidor para filtrar' })
  @ApiQuery({ name: 'limite', required: false, description: 'Quantidade máxima de registros (padrão: 20)' })
  async getHistorico(
    @Query('servidorId') servidorId?: string,
    @Query('limite') limite?: string,
  ) {
    return this.collectorService.getHistorico(servidorId, Number(limite) || 20);
  }
}
