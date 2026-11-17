import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CarbonService } from './carbon.service';
import { CarbonRegionDto, CarbonIntensityDto, RegionsResponseDto } from './dto/carbon.dto';

@ApiTags('Frontend - Banco de Dados')
@Controller('/api/carbon')
export class CarbonController {
    constructor(private readonly carbonService: CarbonService) {}

    @Get('regioes')
    @ApiOperation({ summary: 'Lista todas as regiões monitoradas com seus fatores de carbono e energia renovável' })
    @ApiResponse({ status: 200, description: 'Lista de regiões com fatores ambientais', type: RegionsResponseDto })
    async getRegioes(): Promise<RegionsResponseDto> {
        return this.carbonService.getCarbonRegions();
    }

    @Get('regioes/:code')
    @ApiOperation({ summary: 'Consulta a intensidade de carbono de uma região específica' })
    @ApiParam({ name: 'code', description: 'Código da região (ex: br-sudeste)', example: 'br-sudeste' })
    @ApiResponse({ status: 200, description: 'Intensidade de carbono da região', type: CarbonIntensityDto })
    async getRegiaoPorCodigo(@Param('code') code: string): Promise<CarbonIntensityDto> {
        return this.carbonService.getCarbonIntensityById(code);
    }
}
