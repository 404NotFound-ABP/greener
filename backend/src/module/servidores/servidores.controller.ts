import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger";
import { ServidoresService } from "./servidores.service";
import {
    DashboardResponseDto,
    RankingResponseDto,
    ComparativoResponseDto,
    HistoricoServidorResponseDto,
    ServidorComRegiaoDto,
} from "./dto/servidores.dto";

@Controller('/api/servidores')
export class ServidoresController {
    constructor(private readonly servidoresService: ServidoresService) {}

    @ApiTags('Frontend - Banco de Dados')
    @Get('dashboard')
    @ApiOperation({ summary: 'Dados consolidados para o dashboard do frontend (resumo + servidores + última telemetria)' })
    @ApiQuery({ name: 'janelaSegundos', required: false, description: 'Janela de amostragem em segundos (300, 900, 1800, 3600, 86400, 2592000). Padrão: configurado no sistema' })
    @ApiResponse({ status: 200, description: 'Resumo geral e lista de servidores com última coleta', type: DashboardResponseDto })
    async getDashboard(@Query('janelaSegundos') janelaSegundos?: string): Promise<DashboardResponseDto> {
        const janela = janelaSegundos !== undefined ? Number(janelaSegundos) : undefined;
        return this.servidoresService.getDashboardData(janela);
    }

    @ApiTags('Frontend - Banco de Dados')
    @Get('comparativo')
    @ApiOperation({ summary: 'Compara consumo de energia e emissões entre servidores' })
    @ApiQuery({ name: 'ids', required: false, description: 'IDs dos servidores separados por vírgula (ex: billing-api,checkout-worker)' })
    @ApiQuery({ name: 'janelaSegundos', required: false, description: 'Janela de amostragem em segundos (300, 900, 1800, 3600, 86400, 2592000). Padrão: configurado no sistema' })
    @ApiResponse({ status: 200, description: 'Comparativo entre servidores selecionados', type: ComparativoResponseDto })
    async getComparativo(
        @Query('ids') ids?: string,
        @Query('janelaSegundos') janelaSegundos?: string,
    ): Promise<ComparativoResponseDto> {
        const idList = ids ? ids.split(',').map((id) => id.trim()).filter(Boolean) : undefined;
        const janela = janelaSegundos !== undefined ? Number(janelaSegundos) : undefined;
        return this.servidoresService.getComparativo(idList, janela);
    }

    @ApiTags('Frontend - Banco de Dados')
    @Get('ranking')
    @ApiOperation({ summary: 'Ranking de servidores por maiores emissões ou consumo de energia.' })
    @ApiQuery({ name: 'ordenarPor', required: false, enum: ['emissoes', 'energia'], description: 'Critério de ordenação (padrão: emissoes)' })
    @ApiQuery({ name: 'ordem', required: false, enum: ['desc', 'asc'], description: 'Direção da ordenação (padrão: desc)' })
    @ApiQuery({ name: 'criterio', required: false, enum: ['acumulado', 'instantaneo'], description: 'Critério: acumulado histórico ou instantâneo última coleta (padrão: acumulado)' })
    @ApiQuery({ name: 'limite', required: false, description: 'Quantidade máxima no ranking (padrão: 10)' })
    @ApiQuery({ name: 'janelaSegundos', required: false, description: 'Janela de amostragem em segundos (300, 900, 1800, 3600, 86400, 2592000). Padrão: configurado no sistema' })
    @ApiQuery({ name: 'dataInicial', required: false, description: 'Data/hora inicial em ISO 8601 (ex: 2026-11-16T00:00:00Z)' })
    @ApiQuery({ name: 'dataFinal', required: false, description: 'Data/hora final em ISO 8601 (ex: 2026-11-16T23:59:59Z)' })
    @ApiResponse({ status: 200, description: 'Ranking de servidores ordenado', type: RankingResponseDto })
    async getRanking(
        @Query('ordenarPor') ordenarPor?: 'emissoes' | 'energia',
        @Query('ordem') ordem?: 'desc' | 'asc',
        @Query('criterio') criterio?: 'acumulado' | 'instantaneo',
        @Query('limite') limite?: string,
        @Query('janelaSegundos') janelaSegundos?: string,
        @Query('dataInicial') dataInicial?: string,
        @Query('dataFinal') dataFinal?: string,
    ): Promise<RankingResponseDto> {
        const janela = janelaSegundos !== undefined ? Number(janelaSegundos) : undefined;
        return this.servidoresService.getRankingServidores(
            ordenarPor,
            ordem,
            criterio,
            Number(limite) || 10,
            janela,
            dataInicial,
            dataFinal,
        );
    }

    @ApiTags('Frontend - Banco de Dados')
    @Get()
    @ApiOperation({ summary: 'Lista os servidores (do banco de dados ou da API externa via ?origem=externa)' })
    @ApiQuery({ name: 'origem', required: false, enum: ['banco', 'externa'], description: 'Fonte dos dados (padrão: banco)' })
    @ApiQuery({ name: 'janelaSegundos', required: false, description: 'Janela de amostragem em segundos (300, 900, 1800, 3600, 86400, 2592000). Padrão: configurado no sistema' })
    @ApiResponse({ status: 200, description: 'Lista de servidores com metadados regionais e última coleta', type: [ServidorComRegiaoDto] })
    async listServidores(
        @Query('origem') origem?: string,
        @Query('janelaSegundos') janelaSegundos?: string,
    ): Promise<any> {
        if (origem === 'externa') {
            return this.servidoresService.listServidores();
        }
        const janela = janelaSegundos !== undefined ? Number(janelaSegundos) : undefined;
        return this.servidoresService.listServidoresDoBanco(janela);
    }

    @ApiTags('Frontend - Banco de Dados')
    @Get(':id/historico')
    @ApiOperation({ summary: 'Série temporal das medições de um servidor para gráficos (com filtro opcional por data inicial e final — RF10)' })
    @ApiParam({ name: 'id', description: 'ID do servidor (ex: billing-api)' })
    @ApiQuery({ name: 'limite', required: false, description: 'Quantidade máxima de pontos (padrão: 30)' })
    @ApiQuery({ name: 'janelaSegundos', required: false, description: 'Janela de amostragem em segundos (300, 900, 1800, 3600, 86400, 2592000). Padrão: configurado no sistema' })
    @ApiQuery({ name: 'dataInicial', required: false, description: 'Data/hora inicial em ISO 8601 (ex: 2026-11-16T00:00:00Z)' })
    @ApiQuery({ name: 'dataFinal', required: false, description: 'Data/hora final em ISO 8601 (ex: 2026-11-16T23:59:59Z)' })
    @ApiResponse({ status: 200, description: 'Pontos históricos de telemetria do servidor', type: HistoricoServidorResponseDto })
    @ApiResponse({ status: 400, description: 'Parâmetro de data ou janela inválido' })
    async getHistoricoServidor(
        @Param('id') id: string,
        @Query('limite') limite?: string,
        @Query('janelaSegundos') janelaSegundos?: string,
        @Query('dataInicial') dataInicial?: string,
        @Query('dataFinal') dataFinal?: string,
    ): Promise<HistoricoServidorResponseDto> {
        const janela = janelaSegundos !== undefined ? Number(janelaSegundos) : undefined;
        return this.servidoresService.getHistoricoServidor(id, Number(limite) || 30, janela, dataInicial, dataFinal);
    }

    @ApiTags('APIs Externas - Tempo Real')
    @Get(':id')
    @ApiOperation({ summary: 'Consulta os dados cadastrais de um servidor específico direto na API externa' })
    @ApiParam({ name: 'id', description: 'ID do servidor' })
    @ApiResponse({ status: 200, description: 'Dados cadastrais do servidor' })
    async servidorById(@Param('id') id: string) {
        return this.servidoresService.servidorById(id);
    }

    @ApiTags('APIs Externas - Tempo Real')
    @Get(':id/metrics')
    @ApiOperation({ summary: 'Consulta as métricas brutas em tempo real do servidor na API externa' })
    @ApiParam({ name: 'id', description: 'ID do servidor' })
    @ApiResponse({ status: 200, description: 'Métricas brutas em tempo real do servidor' })
    async metricsServidor(@Param('id') id: string) {
        return this.servidoresService.metricsServidor(id);
    }
}