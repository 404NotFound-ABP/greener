import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { config } from "@/config/config";
import { CarbonIntensityResponse, RegionsResponse } from "@/module/interface/carbon.interface";

@Injectable()
export class CarbonService {
    constructor(private readonly httpService: HttpService) {}

    // Consulta intensidade de uma região específica (ex: "br-sudeste")
    async getCarbonIntensityById(regionCode: string): Promise<CarbonIntensityResponse> {
        try {
            const { data } = await this.httpService.axiosRef.get<CarbonIntensityResponse>(
                `${config.URL_CARBON}/regions/${regionCode}/carbon-intensity`
            );
            return data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new NotFoundException(`Região '${regionCode}' não encontrada`);
            }
            throw new InternalServerErrorException('Erro ao consultar intensidade de carbono');
        }
    }

    // Lista todas as regiões e o total
    async getCarbonRegions(): Promise<RegionsResponse> {
        try {
            const { data } = await this.httpService.axiosRef.get<RegionsResponse>(
                `${config.URL_CARBON}/regions`
            );
            return data;
        } catch (error: any) {
            throw new InternalServerErrorException('Erro ao listar regiões de carbono');
        }
    }
}

