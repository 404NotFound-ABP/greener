import { ApiProperty } from '@nestjs/swagger';

export class CarbonRegionDto {
  @ApiProperty({ example: 'br-sudeste' })
  code!: string;

  @ApiProperty({ example: 'Brazil' })
  country!: string;

  @ApiProperty({ example: 'Sudeste' })
  region!: string;

  @ApiProperty({ example: 'Sao Paulo', nullable: true })
  city!: string | null;

  @ApiProperty({ example: -23.5505, nullable: true })
  latitude!: number | null;

  @ApiProperty({ example: -46.6333, nullable: true })
  longitude!: number | null;

  @ApiProperty({ example: 85, description: 'Intensidade de carbono em gCO2e por kWh' })
  carbon_intensity_gco2e_per_kwh!: number;

  @ApiProperty({ example: 83, description: 'Percentual de geração por fontes renováveis' })
  renewable_share_percent!: number;
}

export class CarbonIntensityDto {
  @ApiProperty({ example: 'br-sudeste' })
  region_code!: string;

  @ApiProperty({ example: 'Brazil' })
  country!: string;

  @ApiProperty({ example: 'Sudeste' })
  region!: string;

  @ApiProperty({ example: 'Sao Paulo', nullable: true })
  city!: string | null;

  @ApiProperty({ example: 85 })
  carbon_intensity_gco2e_per_kwh!: number;

  @ApiProperty({ example: 83 })
  renewable_share_percent!: number;
}

export class RegionsResponseDto {
  @ApiProperty({ type: [CarbonRegionDto] })
  regions!: CarbonRegionDto[];

  @ApiProperty({ example: 5 })
  total!: number;
}
