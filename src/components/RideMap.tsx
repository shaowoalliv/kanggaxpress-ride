import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

interface RideMapProps {
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  driverLat?: number | null;
  driverLng?: number | null;
  className?: string;
}

export function RideMap({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  driverLat,
  driverLng,
  className = '',
}: RideMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const pickupMarker = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarker = useRef<mapboxgl.Marker | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;
    if (map.current) return; // Map already initialized

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [pickupLng || 121.0244, pickupLat || 13.4124], // Default to Calapan
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update pickup marker
  useEffect(() => {
    if (!mapLoaded || !map.current || pickupLat === null || pickupLng === null) return;

    if (pickupMarker.current) {
      pickupMarker.current.setLngLat([pickupLng, pickupLat]);
    } else {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold';
      el.innerHTML = 'P';

      pickupMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([pickupLng, pickupLat])
        .addTo(map.current);
    }
  }, [mapLoaded, pickupLat, pickupLng]);

  // Update dropoff marker
  useEffect(() => {
    if (!mapLoaded || !map.current || dropoffLat === null || dropoffLng === null) return;

    if (dropoffMarker.current) {
      dropoffMarker.current.setLngLat([dropoffLng, dropoffLat]);
    } else {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 bg-success rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold';
      el.innerHTML = 'D';

      dropoffMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([dropoffLng, dropoffLat])
        .addTo(map.current);
    }
  }, [mapLoaded, dropoffLat, dropoffLng]);

  // Update driver marker
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    if (driverLat === null || driverLat === undefined || driverLng === null || driverLng === undefined) {
      // Remove driver marker if no location
      if (driverMarker.current) {
        driverMarker.current.remove();
        driverMarker.current = null;
      }
      return;
    }

    if (driverMarker.current) {
      // Smoothly update position
      driverMarker.current.setLngLat([driverLng, driverLat]);
    } else {
      // Create new marker
      const el = document.createElement('div');
      el.className = 'w-10 h-10 bg-secondary rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white animate-pulse';
      el.innerHTML = '🚗';
      el.style.fontSize = '20px';

      driverMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([driverLng, driverLat])
        .addTo(map.current);
    }
  }, [mapLoaded, driverLat, driverLng]);

  // Fit bounds when markers change
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;

    if (pickupLat !== null && pickupLng !== null) {
      bounds.extend([pickupLng, pickupLat]);
      hasPoints = true;
    }

    if (dropoffLat !== null && dropoffLng !== null) {
      bounds.extend([dropoffLng, dropoffLat]);
      hasPoints = true;
    }

    if (driverLat !== null && driverLat !== undefined && driverLng !== null && driverLng !== undefined) {
      bounds.extend([driverLng, driverLat]);
      hasPoints = true;
    }

    if (hasPoints) {
      map.current.fitBounds(bounds, {
        padding: 80,
        maxZoom: 15,
        duration: 1000,
      });
    }
  }, [mapLoaded, pickupLat, pickupLng, dropoffLat, dropoffLng, driverLat, driverLng]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-sm text-muted-foreground">Map unavailable</p>
      </div>
    );
  }

  return <div ref={mapContainer} className={`rounded-lg ${className}`} />;
}
