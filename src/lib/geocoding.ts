// Mapbox geocoding utilities
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbTVtdG5zYWwwMDhpMmpzYzBkdGM4ZXg3In0.VwrG0qJKs0R_0Gfqhzierw';

export interface PlaceSuggestion {
  id: string;
  primary: string;      // short name for first line
  secondary: string;    // city, region, country for second line
  fullAddress: string;  // full place_name
  coords: { lat: number; lng: number };
}

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    
    return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

export const searchPlaces = async (
  query: string,
  options?: { proximity?: { lat: number; lng: number } }
): Promise<PlaceSuggestion[]> => {
  try {
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      country: 'PH',
      limit: '5',
      autocomplete: 'true',
      types: 'poi,address,place',
    });

    if (options?.proximity) {
      params.set('proximity', `${options.proximity.lng},${options.proximity.lat}`);
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Mapbox search failed');
    }
    
    const data = await response.json();
    
    return (data.features || []).map((f: any) => ({
      id: f.id,
      primary: f.text || f.place_name,
      secondary: f.context ? f.context.map((c: any) => c.text).join(', ') : '',
      fullAddress: f.place_name,
      coords: { lat: f.center[1], lng: f.center[0] },
    }));
  } catch (error) {
    console.error('Search places error:', error);
    return [];
  }
};
