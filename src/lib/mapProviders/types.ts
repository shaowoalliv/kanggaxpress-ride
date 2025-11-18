export type Coordinates = {
  lat: number;
  lng: number;
};

export type PlaceResult = {
  id: string;
  name: string;
  fullAddress: string;
  coords: Coordinates;
};

export interface MapProvider {
  reverseGeocode(coords: Coordinates): Promise<string>;
  searchPlaces(
    query: string,
    options?: { proximity?: Coordinates }
  ): Promise<PlaceResult[]>;
  getStaticMapUrl(params: {
    pickup: Coordinates;
    dropoff?: Coordinates;
    zoom?: number;
  }): string;
}
