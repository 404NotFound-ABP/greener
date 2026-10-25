import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger";
import { ServidoresService } from "./servidores.service";

@Controller('/api/servidores')
export class ServidoresController {
    constructor(private readonly servidoresService: ServidoresService) {}

    @ApiTags('Frontend - Banco de Dados')
    @Get('dashboard')
    @ApiOperation({ summary: 'Dados consolidados para o dashboard do frontend (resumo + servidores + última telemetria)' })
    @ApiResponse({ status: 200, description: 'Resumo geral e lista de servidores com última coleta' })
    async getDashboard() {
        return this.servidoresService.getDashboardData();
    }

    @ApiTags('Frontend - Banco de Dados')
    @Get('comparativo')
    @ApiOperation({ summary: 'Compara consumo de energia e emissões entre servidores' })
    @ApiQuery({ name: 'ids', required: false, description: 'IDs dos servidores separados por vírgula (ex: billing-api,checkout-worker)' })
    async getComparativo(@Query('ids') ids?: string) {
        const idList = ids ? ids.split(',').map((id) => id.trim()).filter(Boolean) : undefined;
        return this.servidoresService.getComparativo(idList);
    }

    @ApiTags('Frontend - Banco de Dados')
    @Get('ranking')
    @ApiOperation({ summary: 'Ranking de servidores por maiores emissões ou consumo de energia.' })
    @ApiQuery({ name: 'ordenarPor', required: false, enum: ['emissoes', 'energia'], description: 'Critério de ordenação (padrão: emissoes)' })
    @ApiQuery({ name: 'ordem', required: false, enum: ['desc', 'asc'], description: 'Direção da ordenação (padrão: desc)' })
    @ApiQuery({ name: 'criterio', required: false, enum: ['acumulado', 'instantaneo'], description: 'Critério: acumulado histórico ou instantâneo última coleta (padrão: acumulado)' })
    @ApiQuery({ name: 'limite', required: false, description: 'Quantidade máxima no ranking (padrão: 10)' })
    async getRanking(
        @Query('ordenarPor') ordenarPor?: 'emissoes' | 'energia',
        @Query('ordem') ordem?: 'desc' | 'asc',
        @Query('criterio') criterio?: 'acumulado' | 'instantaneo',
        @Query('limite') limite?: string,
    ) {
        return this.servidoresService.getRankingServidores(
            ordenarPor,
            ordem,
            criterio,
            Number(limite) || 10,
        );
    }

    @ApiTags('Frontend - Banco de Dados')
    @Get()
    @ApiOperation({ summary: 'Lista os servidores (do banco de dados ou da API externa via ?origem=externa)' })
    @ApiQuery({ name: 'origem', required: false, enum: ['banco', 'externa'], description: 'Fonte dos dados (padrão: banco)' })
    async listServidores(@Query('origem') origem?: string) {
        if (origem === 'externa') {
            return this.servidoresService.listServidores();
        }
        return this.servidoresService.listServidoresDoBanco();
    }

    @ApiTags('Frontend - Banco de Dados')
    @Get(':id/historico')
    @ApiOperation({ summary: 'Série temporal das medições de um servidor para gráficos' })
    @ApiParam({ name: 'id', description: 'ID do servidor (ex: billing-api)' })
    @ApiQuery({ name: 'limite', required: false, description: 'Quantidade máxima de pontos (padrão: 30)' })
    async getHistoricoServidor(
        @Param('id') id: string,
        @Query('limite') limite?: string,
    ) {
        return this.servidoresService.getHistoricoServidor(id, Number(limite) || 30);
    }

    @ApiTags('APIs Externas - Tempo Real')
    @Get(':id')
    @ApiOperation({ summary: 'Consulta os dados cadastrais de um servidor específico direto na API externa' })
    @ApiParam({ name: 'id', description: 'ID do servidor' })
    async servidorById(@Param('id') id: string) {
        return this.servidoresService.servidorById(id);
    }

    @ApiTags('APIs Externas - Tempo Real')
    @Get(':id/metrics')
    @ApiOperation({ summary: 'Consulta as métricas brutas em tempo real do servidor na API externa' })
    @ApiParam({ name: 'id', description: 'ID do servidor' })
    async metricsServidor(@Param('id') id: string) {
        return this.servidoresService.metricsServidor(id);
    }
}