import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface SenderDeliveryMapProps {
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  courierLat?: number;
  courierLng?: number;
  className?: string;
}

export const SenderDeliveryMap = ({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  courierLat,
  courierLng,
  className = 'h-96'
}: SenderDeliveryMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const courierMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

    // Default center (Calapan, Philippines)
    let centerLng = 121.1815;
    let centerLat = 13.4108;

    if (pickupLng && pickupLat) {
      centerLng = pickupLng;
      centerLat = pickupLat;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLng, centerLat],
      zoom: 13
    });

    const bounds = new mapboxgl.LngLatBounds();
    let hasMarkers = false;

    // Add pickup marker (green)
    if (pickupLat && pickupLng) {
      new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([pickupLng, pickupLat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">📦 Pickup</p>'))
        .addTo(map.current);
      bounds.extend([pickupLng, pickupLat]);
      hasMarkers = true;
    }

    // Add dropoff marker (red)
    if (dropoffLat && dropoffLng) {
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([dropoffLng, dropoffLat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">🎯 Drop-off</p>'))
        .addTo(map.current);
      bounds.extend([dropoffLng, dropoffLat]);
      hasMarkers = true;
    }

    // Fit bounds to show both markers
    if (hasMarkers) {
      map.current.fitBounds(bounds, { padding: 50 });
    }

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng]);

  // Update courier location marker (live tracking)
  useEffect(() => {
    if (!map.current || !courierLat || !courierLng) return;

    if (courierMarker.current) {
      // Update existing marker
      courierMarker.current.setLngLat([courierLng, courierLat]);
    } else {
      // Create new courier marker (blue/courier icon)
      courierMarker.current = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([courierLng, courierLat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">🛵 Courier</p>'))
        .addTo(map.current);
    }

    // Recenter map to show courier + destination
    if (dropoffLat && dropoffLng) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([courierLng, courierLat]);
      bounds.extend([dropoffLng, dropoffLat]);
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [courierLat, courierLng, dropoffLat, dropoffLng]);

  return <div ref={mapContainer} className={className} />;
};
