import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ImpactService } from './impact.service';
import { ServidorImpactoResponseDto, ServidorImpactoDiscriminadoResponseDto } from './dto/impact.dto';

@Controller('/api/impacto')
export class ImpactController {
  constructor(private readonly impactService: ImpactService) {}

  @ApiTags('Frontend - Banco de Dados')
  @Get(':id/discriminado')
  @ApiOperation({ summary: 'Detalhamento do consumo e emissões de carbono discriminados por métrica (CPU, Memória, Disco, Rede)' })
  @ApiParam({ name: 'id', description: 'ID do servidor (ex: billing-api)', example: 'billing-api' })
  @ApiQuery({ name: 'criterio', required: false, enum: ['instantaneo', 'acumulado'], description: 'Critério: instantaneo (coleta atual) ou acumulado (soma histórica de todas as medições salvas no PostgreSQL). Padrão: instantaneo' })
  @ApiResponse({ status: 200, description: 'Cálculo de impacto ambiental discriminado por recurso', type: ServidorImpactoDiscriminadoResponseDto })
  @ApiResponse({ status: 404, description: 'Servidor não encontrado' })
  async getImpactoDiscriminado(
    @Param('id') id: string,
    @Query('criterio') criterio?: 'instantaneo' | 'acumulado',
  ): Promise<ServidorImpactoDiscriminadoResponseDto> {
    return this.impactService.calcularImpactoDiscriminadoPorServidor(id, criterio);
  }

  @ApiTags('APIs Externas - Tempo Real')
  @Get()
  @ApiOperation({ summary: 'Calcula em tempo real a potência (W), energia (kWh) e emissões (gCO2e) de todos os servidores ativos' })
  @ApiResponse({ status: 200, description: 'Lista com o cálculo de impacto ambiental de todos os servidores', type: [ServidorImpactoResponseDto] })
  async getImpactoTodos(): Promise<ServidorImpactoResponseDto[]> {
    return this.impactService.calcularImpactoTodos();
  }

  @ApiTags('APIs Externas - Tempo Real')
  @Get(':id')
  @ApiOperation({ summary: 'Calcula em tempo real a potência (W), energia (kWh) e emissões (gCO2e) do servidor' })
  @ApiParam({ name: 'id', description: 'ID do servidor (ex: billing-api)', example: 'billing-api' })
  @ApiResponse({ status: 200, description: 'Cálculo de impacto ambiental realizado com sucesso', type: ServidorImpactoResponseDto })
  @ApiResponse({ status: 404, description: 'Servidor ou região não encontrados' })
  @ApiResponse({ status: 500, description: 'Servidor indisponível ou sem métricas' })
  async getImpactoPorServidor(@Param('id') id: string): Promise<ServidorImpactoResponseDto> {
    return this.impactService.calcularImpactoPorServidor(id);
  }
}
