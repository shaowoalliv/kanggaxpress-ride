import { MapProvider } from './mapProviders/types';
import { MapboxProvider } from './mapProviders/mapbox';
import { GoogleMapsProvider } from './mapProviders/google';
import { StubMapProvider } from './mapProviders/stub';

let mapProviderInstance: MapProvider | null = null;

export function getMapProvider(): MapProvider {
  if (mapProviderInstance) {
    return mapProviderInstance;
  }

  // Check both MAP_PROVIDER secret and VITE_MAPS_PROVIDER env var
  const provider = import.meta.env.MAP_PROVIDER || import.meta.env.VITE_MAPS_PROVIDER || 'mapbox';
  
  if (provider === 'google') {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY is not configured');
    }
    mapProviderInstance = new GoogleMapsProvider(apiKey);
  } else if (provider === 'mapbox') {
    const accessToken = import.meta.env.MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('MAPBOX_ACCESS_TOKEN is not configured');
    }
    mapProviderInstance = new MapboxProvider(accessToken);
  } else {
    // Default to stub provider for development
    mapProviderInstance = new StubMapProvider();
  }

  return mapProviderInstance;
}

export * from './mapProviders/types';
