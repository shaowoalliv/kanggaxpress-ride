import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface PassengerRideMapProps {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  driverLat?: number;
  driverLng?: number;
  className?: string;
}

export const PassengerRideMap = ({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  driverLat,
  driverLng,
  className = 'h-96'
}: PassengerRideMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [pickupLng, pickupLat],
      zoom: 13
    });

    // Add pickup marker (green)
    new mapboxgl.Marker({ color: '#10b981' })
      .setLngLat([pickupLng, pickupLat])
      .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">Pickup</p>'))
      .addTo(map.current);

    // Add dropoff marker (red)
    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([dropoffLng, dropoffLat])
      .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">Destination</p>'))
      .addTo(map.current);

    // Fit bounds to show both markers
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([pickupLng, pickupLat]);
    bounds.extend([dropoffLng, dropoffLat]);
    
    map.current.fitBounds(bounds, { padding: 50 });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng]);

  // Update driver location marker
  useEffect(() => {
    if (!map.current || !driverLat || !driverLng) return;

    if (driverMarker.current) {
      // Update existing marker
      driverMarker.current.setLngLat([driverLng, driverLat]);
    } else {
      // Create new driver marker (blue/car icon)
      driverMarker.current = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([driverLng, driverLat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">🚗 Driver</p>'))
        .addTo(map.current);
    }

    // Recenter map to show driver + destination
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([driverLng, driverLat]);
    bounds.extend([dropoffLng, dropoffLat]);
    map.current.fitBounds(bounds, { padding: 50 });
  }, [driverLat, driverLng, dropoffLat, dropoffLng]);

  return <div ref={mapContainer} className={className} />;
};
