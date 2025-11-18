import { MapProvider } from './mapProviders/types';
import { MapboxProvider } from './mapProviders/mapbox';
import { GoogleMapsProvider } from './mapProviders/google';

let mapProviderInstance: MapProvider | null = null;

export function getMapProvider(): MapProvider {
  if (mapProviderInstance) {
    return mapProviderInstance;
  }

  const provider = import.meta.env.VITE_MAP_PROVIDER || 'mapbox';
  
  if (provider === 'google') {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY is not configured');
    }
    mapProviderInstance = new GoogleMapsProvider(apiKey);
  } else {
    // Default to Mapbox
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('MAPBOX_ACCESS_TOKEN is not configured');
    }
    mapProviderInstance = new MapboxProvider(accessToken);
  }

  return mapProviderInstance;
}

export * from './mapProviders/types';
