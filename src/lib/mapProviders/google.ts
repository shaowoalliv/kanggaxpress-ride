import { MapProvider, Coordinates, PlaceResult } from './types';

export class GoogleMapsProvider implements MapProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async reverseGeocode(coords: Coordinates): Promise<string> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${this.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Google reverse geocoding failed');
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    
    return 'Unknown location';
  }

  async searchPlaces(
    query: string,
    options?: { proximity?: Coordinates }
  ): Promise<PlaceResult[]> {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
    
    if (options?.proximity) {
      url += `&location=${options.proximity.lat},${options.proximity.lng}&radius=5000`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Google Places search failed');
    }

    const data = await response.json();
    
    return (data.results || []).map((place: any) => ({
      id: place.place_id,
      name: place.name,
      fullAddress: place.formatted_address,
      coords: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
    }));
  }

  getStaticMapUrl(params: {
    pickup: Coordinates;
    dropoff?: Coordinates;
    zoom?: number;
  }): string {
    const { pickup, dropoff, zoom = 14 } = params;
    
    let markers = `markers=color:brown|label:A|${pickup.lat},${pickup.lng}`;
    if (dropoff) {
      markers += `&markers=color:brown|label:B|${dropoff.lat},${dropoff.lng}`;
    }

    const centerLat = dropoff ? (pickup.lat + dropoff.lat) / 2 : pickup.lat;
    const centerLng = dropoff ? (pickup.lng + dropoff.lng) / 2 : pickup.lng;

    return `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=600x400&${markers}&key=${this.apiKey}`;
  }
}
