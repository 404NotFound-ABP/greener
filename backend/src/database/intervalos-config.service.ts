import { Injectable } from '@nestjs/common';

// Intervalos permitidos em segundos: 5m, 15m, 30m, 1h, 1d, 1 mês (30d)
export const INTERVALOS_PERMITIDOS_SEGUNDOS = [300, 900, 1800, 3600, 86400, 2592000] as const;
export const INTERVALO_PADRAO_SEGUNDOS = 300;

@Injectable()
export class IntervalosConfigService {
  private intervaloColetaSegundos = INTERVALO_PADRAO_SEGUNDOS;
  private intervaloAtualizacaoSegundos = INTERVALO_PADRAO_SEGUNDOS;
  private atualizadoEm: Date | null = null;

  getIntervaloColetaSegundos(): number {
    return this.intervaloColetaSegundos;
  }

  getIntervaloAtualizacaoSegundos(): number {
    return this.intervaloAtualizacaoSegundos;
  }

  getAtualizadoEm(): Date | null {
    return this.atualizadoEm;
  }

  setIntervalos(intervaloColetaSegundos: number, intervaloAtualizacaoSegundos: number, atualizadoEm: Date | null) {
    this.intervaloColetaSegundos = intervaloColetaSegundos;
    this.intervaloAtualizacaoSegundos = intervaloAtualizacaoSegundos;
    this.atualizadoEm = atualizadoEm;
  }
}

