import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DriverRideMapProps {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  driverLat?: number;
  driverLng?: number;
  rideStatus: 'accepted' | 'in_progress' | 'completed';
  className?: string;
}

export const DriverRideMap = ({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  driverLat,
  driverLng,
  rideStatus,
  className = 'h-96'
}: DriverRideMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [pickupLng, pickupLat],
      zoom: 13
    });

    // Show pickup marker if ride not yet started
    if (rideStatus === 'accepted') {
      new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([pickupLng, pickupLat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">📍 Pickup Point</p>'))
        .addTo(map.current);
    }

    // Show dropoff marker
    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([dropoffLng, dropoffLat])
      .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">🎯 Destination</p>'))
      .addTo(map.current);

    // Show driver location if available
    if (driverLat && driverLng) {
      new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([driverLng, driverLat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">🚗 You are here</p>'))
        .addTo(map.current);
    }

    // Fit bounds to show all markers
    const bounds = new mapboxgl.LngLatBounds();
    if (driverLat && driverLng) {
      bounds.extend([driverLng, driverLat]);
    }
    if (rideStatus === 'accepted') {
      bounds.extend([pickupLng, pickupLat]);
    }
    bounds.extend([dropoffLng, dropoffLat]);
    
    map.current.fitBounds(bounds, { padding: 50 });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, driverLat, driverLng, rideStatus]);

  return <div ref={mapContainer} className={className} />;
};
