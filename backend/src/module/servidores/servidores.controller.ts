import { Controller, Get, Param } from "@nestjs/common";
import { ServidoresService } from "./servidores.service";

@Controller('/api/servidores')
export class ServidoresController{
    constructor(private readonly servidoresService: ServidoresService){}

    @Get()
    async listServidores(){
        return this.servidoresService.listServidores();
    }
    @Get(':id')
    async servidorById(@Param('id') id:string){
        return this.servidoresService.servidorById(id);
    }
    @Get(':id/metrics')
    async metricsServidor(@Param('id') id: string) {
        return this.servidoresService.metricsServidor(id);
    }
}