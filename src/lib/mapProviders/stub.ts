import { MapProvider, Coordinates, PlaceResult } from './types';

export class StubMapProvider implements MapProvider {
  async reverseGeocode(coords: Coordinates): Promise<string> {
    return `Location at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
  }

  async searchPlaces(
    query: string,
    options?: { proximity?: Coordinates }
  ): Promise<PlaceResult[]> {
    // Return mock results for development
    return [
      {
        id: '1',
        name: query,
        fullAddress: `${query}, Sample City, Philippines`,
        coords: options?.proximity || { lat: 14.5995, lng: 120.9842 },
      },
      {
        id: '2',
        name: `${query} Station`,
        fullAddress: `${query} Station, Sample City, Philippines`,
        coords: { lat: 14.6042, lng: 120.9822 },
      },
    ];
  }

  getStaticMapUrl(params: {
    pickup: Coordinates;
    dropoff?: Coordinates;
    zoom?: number;
  }): string {
    // Return a placeholder image for development
    return `https://via.placeholder.com/600x400/e5e7eb/6b7280?text=Map+Preview`;
  }
}
