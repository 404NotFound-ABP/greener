export interface Location {
  region_code: string;
  country: string;
  region: string;
  city: string | null;
  latitude: number;
  longitude: number;
}

export interface ServidorResponse {
  id: string;
  name: string;
  location: Location;
  metrics_path: string;
}

export interface ServidorMetricsResponse {
  cpu_percent: number;
  memory_gb: number;
  disk_gb: number;
  network_gb: number;
}

export interface ServidorMetricsData {
  collection_interval_seconds: number;
  metrics: ServidorMetricsResponse;
}

export interface CarbonIntensityResponse {
  region_code: string;
  country: string;
  region: string;
  city: string | null;
  carbon_intensity_gco2e_per_kwh: number;
  renewable_share_percent: number;
}
