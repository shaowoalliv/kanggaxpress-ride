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

  // Update driver location marker with smooth animation
  useEffect(() => {
    if (!map.current || !driverLat || !driverLng) return;

    if (driverMarker.current) {
      // Get current position for smooth animation
      const currentPos = driverMarker.current.getLngLat();
      const newPos: [number, number] = [driverLng, driverLat];
      
      // Calculate distance to determine animation
      const distance = Math.sqrt(
        Math.pow(newPos[0] - currentPos.lng, 2) + 
        Math.pow(newPos[1] - currentPos.lat, 2)
      );

      // Only animate if movement is small (< 0.001 degrees, ~100m)
      if (distance < 0.001) {
        const markerElement = driverMarker.current.getElement();
        markerElement.style.transition = 'transform 1s ease-out';
      }

      // Update marker position
      driverMarker.current.setLngLat(newPos);
    } else {
      // Create new driver marker with animated custom element
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.innerHTML = `
        <div class="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full shadow-lg border-3 border-white animate-pulse">
          <span class="text-white text-2xl">🚗</span>
        </div>
      `;

      driverMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([driverLng, driverLat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">🚗 Your Driver</p>'))
        .addTo(map.current);
    }

    // Smoothly recenter map to show driver + destination
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([driverLng, driverLat]);
    bounds.extend([dropoffLng, dropoffLat]);
    
    map.current.fitBounds(bounds, { 
      padding: 80,
      duration: 1000,
      essential: true
    });
  }, [driverLat, driverLng, dropoffLat, dropoffLng]);

  return <div ref={mapContainer} className={className} />;
};
