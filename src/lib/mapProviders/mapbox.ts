import { MapProvider, Coordinates, PlaceResult } from './types';

export class MapboxProvider implements MapProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async reverseGeocode(coords: Coordinates): Promise<string> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${this.accessToken}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Mapbox reverse geocoding failed');
    }

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    
    return 'Unknown location';
  }

  async searchPlaces(
    query: string,
    options?: { proximity?: Coordinates }
  ): Promise<PlaceResult[]> {
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.accessToken}&limit=5`;
    
    if (options?.proximity) {
      url += `&proximity=${options.proximity.lng},${options.proximity.lat}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Mapbox search failed');
    }

    const data = await response.json();
    
    return (data.features || []).map((feature: any) => ({
      id: feature.id,
      name: feature.text,
      fullAddress: feature.place_name,
      coords: {
        lng: feature.center[0],
        lat: feature.center[1],
      },
    }));
  }

  getStaticMapUrl(params: {
    pickup: Coordinates;
    dropoff?: Coordinates;
    zoom?: number;
  }): string {
    const { pickup, dropoff, zoom = 14 } = params;
    
    let markers = `pin-s-a+9c5a3c(${pickup.lng},${pickup.lat})`;
    if (dropoff) {
      markers += `,pin-s-b+6b4423(${dropoff.lng},${dropoff.lat})`;
    }

    const centerLng = dropoff ? (pickup.lng + dropoff.lng) / 2 : pickup.lng;
    const centerLat = dropoff ? (pickup.lat + dropoff.lat) / 2 : pickup.lat;

    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${markers}/${centerLng},${centerLat},${zoom}/600x400@2x?access_token=${this.accessToken}`;
  }
}
