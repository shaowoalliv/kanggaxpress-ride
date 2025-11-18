// Mapbox geocoding utilities
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbTVtdG5zYWwwMDhpMmpzYzBkdGM4ZXg3In0.VwrG0qJKs0R_0Gfqhzierw';

export interface PlaceSuggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
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
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`;
    
    if (options?.proximity) {
      url += `&proximity=${options.proximity.lng},${options.proximity.lat}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features || [];
  } catch (error) {
    console.error('Search places error:', error);
    return [];
  }
};
