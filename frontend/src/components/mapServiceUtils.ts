import type { ServiceData } from '../types/service';

/**
 * Extrai e valida coordenadas de múltiplos formatos possíveis vindos da API.
 * Retorna null quando ausentes, nulas, vazias ou fora da faixa geográfica válida.
 */
export function extractValidCoordinates(service: ServiceData): [number, number] | null {
  const raw = service as ServiceData & {
    coordenadas?:
      | {
          lat?: number | null;
          lng?: number | null;
          latitude?: number | null;
          longitude?: number | null;
        }
      | [number, number]
      | null;
    coords?: [number, number] | null;
    latitude?: number | null;
    longitude?: number | null;
    lat?: number | null;
    lng?: number | null;
  };

  let lat: number | null | undefined;
  let lng: number | null | undefined;

  if (Array.isArray(raw.coords)) {
    [lat, lng] = raw.coords;
  } else if (Array.isArray(raw.coordenadas)) {
    [lat, lng] = raw.coordenadas;
  } else if (raw.coordenadas && typeof raw.coordenadas === 'object' && !Array.isArray(raw.coordenadas)) {
    lat = raw.coordenadas.lat ?? raw.coordenadas.latitude;
    lng = raw.coordenadas.lng ?? raw.coordenadas.longitude;
  } else {
    lat = raw.latitude ?? raw.lat;
    lng = raw.longitude ?? raw.lng;
  }

  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return [lat, lng];
}

/**
 * Formata a localização textual tratando ausência parcial ou total de cidade, região e país.
 */
export function formatServiceLocation(localizacao?: {
  cidade?: string | null;
  regiao?: string | null;
  pais?: string | null;
} | null): { text: string; isIncomplete: boolean } {
  const cidade = localizacao?.cidade?.trim() || '';
  const regiao = localizacao?.regiao?.trim() || '';
  const pais = localizacao?.pais?.trim() || '';
  const parts = [cidade, regiao, pais].filter(Boolean);

  if (parts.length === 0) {
    return { text: 'Localização não informada', isIncomplete: true };
  }

  if (parts.length < 3) {
    const missing: string[] = [];
    if (!cidade) missing.push('cidade');
    if (!regiao) missing.push('região');
    if (!pais) missing.push('país');

    return {
      text: `${parts.join(', ')} (${missing.join('/')} não informado)`,
      isIncomplete: true,
    };
  }

  return { text: parts.join(', '), isIncomplete: false };
}
