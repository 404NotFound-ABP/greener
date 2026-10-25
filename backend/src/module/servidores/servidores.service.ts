import { HttpService } from "@nestjs/axios";
import { config } from "@/config/config";
import { ServidorResponse, ServidorMetricsData } from "@/module/interface/servidor.interface";
import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";

@Injectable()
export class ServidoresService {
    constructor(private readonly httpService: HttpService) {}

    async listServidores(): Promise<ServidorResponse[]> {
        try {
            const { data } = await this.httpService.axiosRef.get<ServidorResponse[]>(
                `${config.URL_METRICS}/services`
            );
            return data ?? [];
        } catch (error: any) {
            console.error("Erro ao listar servidores:", error.message);
            throw new InternalServerErrorException("Erro ao buscar servidores na API de métricas");
        }
    }

    async servidorById(id: string): Promise<ServidorResponse> {
        try {
            const { data } = await this.httpService.axiosRef.get<ServidorResponse>(
                `${config.URL_METRICS}/services/${id}`
            );
            return data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new NotFoundException(`Servidor com ID '${id}' não encontrado`);
            }
            throw new InternalServerErrorException('Erro ao consultar o servidor');
        }
    }

    async metricsServidor(id_servidor: string): Promise<ServidorMetricsData> {
        try {
            const { data } = await this.httpService.axiosRef.get<ServidorMetricsData>(
                `${config.URL_METRICS}/metrics/${id_servidor}`
            );
            return data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new NotFoundException(`Servidor com ID '${id_servidor}' não encontrado`);
            }
            if (error.response?.status === 500) {
                throw new InternalServerErrorException(`Servidor '${id_servidor}' está indisponível ou sem métricas`);
            }
            throw new InternalServerErrorException('Erro ao consultar o servidor');
        }
    }

}