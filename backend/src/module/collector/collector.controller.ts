import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  ServiceUnavailableException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CollectorService } from './collector.service';
import {
  AtualizarIntervalosDto,
  ColetaExecucaoResultadoDto,
  CollectorStatusDto,
  ColetaMetricaItemDto,
  ConfiguracaoIntervalosDto,
} from './dto/collector.dto';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/module/auth/decorators/roles.decorator';

@ApiTags('Coleta e Agendamento')
@Controller('api/coleta')
export class CollectorController {
  constructor(private readonly collectorService: CollectorService) {}

  @Get('configuracao')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Consulta os intervalos configurados de coleta e atualização do frontend (RF16)' })
  @ApiResponse({ status: 200, description: 'Configuração atual dos intervalos', type: ConfiguracaoIntervalosDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getConfiguracao(): Promise<ConfiguracaoIntervalosDto> {
    return this.collectorService.getConfiguracaoIntervalos();
  }

  @Put('configuracao')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Atualiza os intervalos de coleta e atualização do frontend (exclusivo Admin, RF16)' })
  @ApiResponse({ status: 200, description: 'Intervalos atualizados e coletor reagendado', type: ConfiguracaoIntervalosDto })
  @ApiResponse({ status: 400, description: 'Intervalo inválido fora da lista permitida' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado: requer perfil de admin' })
  async atualizarConfiguracao(@Body() dto: AtualizarIntervalosDto): Promise<ConfiguracaoIntervalosDto> {
    return this.collectorService.atualizarConfiguracaoIntervalos(dto);
  }

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
