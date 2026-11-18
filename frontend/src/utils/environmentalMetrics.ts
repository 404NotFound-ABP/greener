export type EnvironmentalUnit = 'kWh' | 'kgCO₂e' | 'gCO₂e';

export interface EnvironmentalReading {
  value: number | null | undefined;
  unit: EnvironmentalUnit;
  period?: string;
  isEstimated?: boolean;
}

/**
 * Formata valores numéricos garantindo que valores pequenos (> 0 e < 0.01)
 * nunca sejam arredondados para "0" ou "0,00" (T24.2 / RF09).
 */
export function formatEnvironmentalNumber(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  if (value === 0) {
    return '0';
  }

  const abs = Math.abs(value);

  if (abs < 0.0001) {
    return '< 0,0001';
  }

  if (abs < 0.01) {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }

  if (abs < 1) {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    });
  }

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatEnvironmentalMetric(
  value: number | null | undefined,
  unit: EnvironmentalUnit
): {
  isAvailable: boolean;
  formattedValue: string;
  displayWithUnit: string;
} {
  const formatted = formatEnvironmentalNumber(value);

  if (formatted === null) {
    return {
      isAvailable: false,
      formattedValue: 'Indisponível',
      displayWithUnit: 'Indisponível',
    };
  }

  return {
    isAvailable: true,
    formattedValue: formatted,
    displayWithUnit: `${formatted} ${unit}`,
  };
}