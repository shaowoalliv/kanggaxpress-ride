import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X } from 'lucide-react';
import { reverseGeocode } from '@/lib/geocoding';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import mapPinIcon from '@/assets/map-pin-icon.png';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbTVtdG5zYWwwMDhpMmpzYzBkdGM4ZXg3In0.VwrG0qJKs0R_0Gfqhzierw';

interface DestinationMapPickerProps {
  mode?: 'pickup' | 'dropoff';
  initialCenter?: { lat: number; lng: number };
  onConfirm: (destination: { address: string; coords: { lat: number; lng: number } }) => void;
  onClose: () => void;
}

export function DestinationMapPicker({ mode = 'dropoff', initialCenter, onConfirm, onClose }: DestinationMapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const [centerCoords, setCenterCoords] = useState(initialCenter || { lat: 14.5995, lng: 120.9842 }); // Default to Manila
  const [currentAddress, setCurrentAddress] = useState<string>('Locating address...');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const reverseGeocodeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerCoords.lng, centerCoords.lat],
      zoom: 15,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Update center coordinates when map moves
    map.current.on('move', () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      setCenterCoords({ lat: center.lat, lng: center.lng });
    });

    // Trigger reverse geocode after user stops moving
    map.current.on('moveend', () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      
      // Clear previous timeout
      if (reverseGeocodeTimeout.current) {
        clearTimeout(reverseGeocodeTimeout.current);
      }
      
      // Debounce reverse geocode by 500ms
      reverseGeocodeTimeout.current = setTimeout(async () => {
        setIsLoadingAddress(true);
        try {
          const address = await reverseGeocode(center.lat, center.lng);
          setCurrentAddress(address);
        } catch (error) {
          console.error('Reverse geocode error:', error);
          setCurrentAddress(`Location at ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`);
        } finally {
          setIsLoadingAddress(false);
        }
      }, 500);
    });

    // Initial reverse geocode
    reverseGeocode(centerCoords.lat, centerCoords.lng)
      .then(setCurrentAddress)
      .catch(() => setCurrentAddress(`Location at ${centerCoords.lat.toFixed(4)}, ${centerCoords.lng.toFixed(4)}`));

    return () => {
      if (reverseGeocodeTimeout.current) {
        clearTimeout(reverseGeocodeTimeout.current);
      }
      map.current?.remove();
    };
  }, []);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      // Ensure we have the latest address
      let finalAddress = currentAddress;
      if (isLoadingAddress) {
        finalAddress = await reverseGeocode(centerCoords.lat, centerCoords.lng);
      }
      
      onConfirm({
        address: finalAddress,
        coords: centerCoords,
      });
    } catch (error) {
      console.error('Error confirming destination:', error);
      onConfirm({
        address: currentAddress,
        coords: centerCoords,
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-4 flex items-center justify-between shadow-md">
        <h2 className="text-lg font-semibold">
          {mode === 'pickup' ? 'Set Pickup Location' : 'Set Destination on Map'}
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-primary-foreground/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 px-4 py-2 text-sm text-center">
        {mode === 'pickup' 
          ? 'Drag the map to position the pin on your pickup location'
          : 'Drag the map to position the pin on your drop-off location'
        }
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Fixed center pin */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative transform -translate-y-1/2">
            <div className="relative w-12 h-16">
              {/* Red pin shape */}
              <div className="absolute inset-0 flex items-end justify-center">
                <div className="w-12 h-12 bg-red-600 rounded-full border-4 border-white shadow-xl relative">
                  {/* Inner circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-red-800 rounded-full"></div>
                </div>
              </div>
              {/* Pin point */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-red-600 drop-shadow-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom panel with address and confirm */}
      <div className="bg-card border-t border-border shadow-lg">
        <div className="px-4 py-4 space-y-3">
          {/* Address display */}
          <div className="bg-muted/30 rounded-lg px-3 py-3">
            <div className="text-xs text-muted-foreground mb-1">
              {mode === 'pickup' ? 'Pickup location:' : 'Drop-off location:'}
            </div>
            <div className="font-medium text-sm">
              {isLoadingAddress ? (
                <span className="text-muted-foreground">Loading address...</span>
              ) : (
                currentAddress
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {centerCoords.lat.toFixed(6)}, {centerCoords.lng.toFixed(6)}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <SecondaryButton
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton
              onClick={handleConfirm}
              disabled={isLoadingAddress || isConfirming}
              isLoading={isConfirming}
              className="flex-1"
            >
              {mode === 'pickup' ? 'Confirm Pickup' : 'Confirm Destination'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
