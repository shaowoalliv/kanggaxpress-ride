/**
 * Calculate ETA (Estimated Time of Arrival) based on distance
 */

interface ETAResult {
  distanceKm: number;
  durationMinutes: number;
  etaText: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Calculate ETA based on distance and average speed
 * @param distanceKm - Distance in kilometers
 * @param averageSpeedKmh - Average speed in km/h (default: 30 km/h for city driving)
 */
export function calculateETA(
  distanceKm: number,
  averageSpeedKmh: number = 30
): ETAResult {
  const durationHours = distanceKm / averageSpeedKmh;
  const durationMinutes = Math.ceil(durationHours * 60);
  
  let etaText: string;
  if (durationMinutes < 1) {
    etaText = 'Less than a minute';
  } else if (durationMinutes === 1) {
    etaText = '1 minute';
  } else if (durationMinutes < 60) {
    etaText = `${durationMinutes} minutes`;
  } else {
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    etaText = mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMinutes,
    etaText
  };
}

/**
 * Calculate ETA from current location to destination
 */
export function calculateETAFromTo(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  averageSpeedKmh?: number
): ETAResult {
  const distance = calculateDistance(fromLat, fromLng, toLat, toLng);
  return calculateETA(distance, averageSpeedKmh);
}
