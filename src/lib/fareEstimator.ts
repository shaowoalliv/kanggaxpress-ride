export type ServiceType = 'TRICYCLE' | 'MOTORCYCLE' | 'CAR' | 'SEND_PACKAGE';
export type FeeType = 'FLAT' | 'PCT';

export interface FareConfig {
  base_fare: number;
  per_km: number;
  per_min: number;
  min_fare: number;
  platform_fee_type: FeeType;
  platform_fee_value: number;
}

export interface FareEstimate {
  subtotal: number;
  platformFee: number;
  total: number;
  driverTake: number;
}

export function estimateFare(
  config: FareConfig,
  distance_km: number,
  time_min: number = 0
): FareEstimate {
  // Calculate base estimate
  const subtotal = Math.max(
    config.base_fare + (config.per_km * distance_km) + (config.per_min * time_min),
    config.min_fare
  );

  // Calculate platform fee
  let platformFee: number;
  if (config.platform_fee_type === 'FLAT') {
    platformFee = config.platform_fee_value;
  } else {
    // PCT (percentage)
    platformFee = Math.round((subtotal * (config.platform_fee_value / 100)) * 100) / 100;
  }

  const total = subtotal;
  const driverTake = subtotal - platformFee;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    total: Math.round(total * 100) / 100,
    driverTake: Math.round(driverTake * 100) / 100,
  };
}
