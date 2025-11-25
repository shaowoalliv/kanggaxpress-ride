import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface AvailableRidesMapProps {
  rides: Array<{
    id: string;
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat: number;
    dropoff_lng: number;
    pickup_location: string;
    dropoff_location: string;
    fare_estimate: number;
  }>;
  driverLat?: number;
  driverLng?: number;
  onRideClick?: (rideId: string) => void;
  className?: string;
}

export const AvailableRidesMap = ({
  rides,
  driverLat,
  driverLng,
  onRideClick,
  className = 'h-96'
}: AvailableRidesMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

    // Initialize map centered on driver or first ride
    const centerLng = driverLng || rides[0]?.pickup_lng || 121.0244;
    const centerLat = driverLat || rides[0]?.pickup_lat || 14.5547;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLng, centerLat],
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update markers when rides change
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add driver marker if available
    if (driverLat && driverLng) {
      const driverMarker = new mapboxgl.Marker({ 
        color: '#3b82f6',
        scale: 1.2
      })
        .setLngLat([driverLng, driverLat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">🚗 You are here</p>'))
        .addTo(map.current);
      markersRef.current.push(driverMarker);
    }

    // Add ride markers
    rides.forEach((ride, index) => {
      if (!ride.pickup_lat || !ride.pickup_lng) return;

      // Pickup marker (green)
      const pickupEl = document.createElement('div');
      pickupEl.className = 'cursor-pointer';
      pickupEl.innerHTML = `
        <div class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
          ${index + 1}
        </div>
      `;
      
      if (onRideClick) {
        pickupEl.onclick = () => onRideClick(ride.id);
      }

      const pickupMarker = new mapboxgl.Marker({ element: pickupEl })
        .setLngLat([ride.pickup_lng, ride.pickup_lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="text-sm">
              <p class="font-bold mb-1">Ride #${index + 1}</p>
              <p class="text-xs mb-1"><strong>Pickup:</strong> ${ride.pickup_location}</p>
              <p class="text-xs mb-1"><strong>Dropoff:</strong> ${ride.dropoff_location}</p>
              <p class="text-xs text-green-600 font-semibold">₱${ride.fare_estimate}</p>
            </div>
          `)
        )
        .addTo(map.current);
      
      markersRef.current.push(pickupMarker);

      // Dropoff marker (small red dot)
      if (ride.dropoff_lat && ride.dropoff_lng) {
        const dropoffMarker = new mapboxgl.Marker({ 
          color: '#ef4444',
          scale: 0.6
        })
          .setLngLat([ride.dropoff_lng, ride.dropoff_lat])
          .addTo(map.current);
        
        markersRef.current.push(dropoffMarker);

        // Draw line between pickup and dropoff
        const lineId = `line-${ride.id}`;
        if (map.current.getSource(lineId)) {
          map.current.removeLayer(lineId);
          map.current.removeSource(lineId);
        }

        map.current.addSource(lineId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [ride.pickup_lng, ride.pickup_lat],
                [ride.dropoff_lng, ride.dropoff_lat]
              ]
            }
          }
        });

        map.current.addLayer({
          id: lineId,
          type: 'line',
          source: lineId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#10b981',
            'line-width': 2,
            'line-dasharray': [2, 2]
          }
        });
      }
    });

    // Fit bounds to show all markers
    if (rides.length > 0 || (driverLat && driverLng)) {
      const bounds = new mapboxgl.LngLatBounds();
      
      if (driverLat && driverLng) {
        bounds.extend([driverLng, driverLat]);
      }
      
      rides.forEach(ride => {
        if (ride.pickup_lat && ride.pickup_lng) {
          bounds.extend([ride.pickup_lng, ride.pickup_lat]);
        }
        if (ride.dropoff_lat && ride.dropoff_lng) {
          bounds.extend([ride.dropoff_lng, ride.dropoff_lat]);
        }
      });
      
      map.current.fitBounds(bounds, { padding: 80 });
    }
  }, [rides, driverLat, driverLng, onRideClick]);

  return (
    <div className="relative">
      <div ref={mapContainer} className={className} />
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold text-gray-700">
          {rides.length} Available Ride{rides.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};
