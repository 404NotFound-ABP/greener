// Representa uma região retornada na lista de GET /regions
export interface CarbonRegion {
  code: string; // Ex: "br-sudeste", "us-east"
  country: string;
  region: string;
  city: string | null;
  latitude: number;
  longitude: number;
  carbon_intensity_gco2e_per_kwh: number;
  renewable_share_percent: number;
}

// Resposta completa de GET /regions (contendo o total)
export interface RegionsResponse {
  regions: CarbonRegion[];
  total: number;
}

// Resposta de GET /regions/{code}/carbon-intensity (ou /carbon-intensity/{code})
export interface CarbonIntensityResponse {
  region_code: string; // Ex: "br-sudeste"
  country: string;
  region: string;
  city: string | null;
  carbon_intensity_gco2e_per_kwh: number;
  renewable_share_percent: number;
}
