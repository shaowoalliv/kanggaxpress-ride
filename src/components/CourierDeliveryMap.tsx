import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface CourierDeliveryMapProps {
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  courierLat?: number;
  courierLng?: number;
  deliveryStatus: 'assigned' | 'picked_up' | 'in_transit' | 'delivered';
  className?: string;
}

export const CourierDeliveryMap = ({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  courierLat,
  courierLng,
  deliveryStatus,
  className = 'h-96'
}: CourierDeliveryMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

    // Default center (fallback)
    let centerLng = 121.1815;
    let centerLat = 13.4108;

    if (pickupLng && pickupLat) {
      centerLng = pickupLng;
      centerLat = pickupLat;
    } else if (courierLng && courierLat) {
      centerLng = courierLng;
      centerLat = courierLat;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLng, centerLat],
      zoom: 13
    });

    const bounds = new mapboxgl.LngLatBounds();
    let hasMarkers = false;

    // Show pickup marker if not yet picked up
    if (pickupLat && pickupLng && (deliveryStatus === 'assigned')) {
      new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([pickupLng, pickupLat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">📦 Pickup</p>'))
        .addTo(map.current);
      bounds.extend([pickupLng, pickupLat]);
      hasMarkers = true;
    }

    // Show dropoff marker
    if (dropoffLat && dropoffLng) {
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([dropoffLng, dropoffLat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">🎯 Drop-off</p>'))
        .addTo(map.current);
      bounds.extend([dropoffLng, dropoffLat]);
      hasMarkers = true;
    }

    // Show courier location if available
    if (courierLat && courierLng) {
      new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([courierLng, courierLat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">🛵 You are here</p>'))
        .addTo(map.current);
      bounds.extend([courierLng, courierLat]);
      hasMarkers = true;
    }

    // Fit bounds if we have markers
    if (hasMarkers) {
      map.current.fitBounds(bounds, { padding: 50 });
    }

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, courierLat, courierLng, deliveryStatus]);

  return <div ref={mapContainer} className={className} />;
};
