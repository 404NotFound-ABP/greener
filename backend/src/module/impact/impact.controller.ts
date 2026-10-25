import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ImpactService } from './impact.service';
import { ServidorImpactoResponseDto } from './dto/impact.dto';

@ApiTags('impacto-ambiental')
@Controller('/api/impacto')
export class ImpactController {
  constructor(private readonly impactService: ImpactService) {}

  @Get()
  @ApiOperation({ summary: 'Calcula em tempo real a potência (W), energia (kWh) e emissões (gCO2e) de todos os servidores ativos' })
  @ApiResponse({ status: 200, description: 'Lista com o cálculo de impacto ambiental de todos os servidores', type: [ServidorImpactoResponseDto] })
  async getImpactoTodos(): Promise<ServidorImpactoResponseDto[]> {
    return this.impactService.calcularImpactoTodos();
  }

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
