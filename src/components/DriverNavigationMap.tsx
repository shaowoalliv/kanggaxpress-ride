import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Navigation, MapPin, Volume2, VolumeX } from 'lucide-react';
import { ThemedCard } from './ui/ThemedCard';
import { toast } from 'sonner';

interface DriverNavigationMapProps {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  driverLat?: number;
  driverLng?: number;
  rideStatus: 'accepted' | 'in_progress';
  className?: string;
  onRouteLoaded?: (distance: number, duration: number) => void;
}

interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
}

export const DriverNavigationMap = ({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  driverLat,
  driverLng,
  rideStatus,
  className = 'h-96',
  onRouteLoaded
}: DriverNavigationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeDuration, setRouteDuration] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastSpokenStep, setLastSpokenStep] = useState<number>(-1);
  const speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

    const startLng = driverLng || pickupLng;
    const startLat = driverLat || pickupLat;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-day-v1',
      center: [startLng, startLat],
      zoom: 14,
      pitch: 45
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  // Fetch and display route
  useEffect(() => {
    if (!map.current || !driverLat || !driverLng) return;

    const destination: [number, number] = rideStatus === 'accepted' 
      ? [pickupLng, pickupLat] 
      : [dropoffLng, dropoffLat];
    
    const destinationLabel = rideStatus === 'accepted' ? 'Pickup Point' : 'Destination';

    // Fetch directions from Mapbox
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLng},${driverLat};${destination[0]},${destination[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (!data.routes || data.routes.length === 0) return;

        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;
        const distance = route.distance / 1000; // Convert to km
        const duration = route.duration / 60; // Convert to minutes

        setRouteDistance(distance);
        setRouteDuration(duration);
        
        if (onRouteLoaded) {
          onRouteLoaded(distance, duration);
        }

        // Extract navigation steps
        const steps: NavigationStep[] = route.legs[0].steps.map((step: any) => ({
          instruction: step.maneuver.instruction,
          distance: step.distance,
          duration: step.duration
        }));
        setNavigationSteps(steps);
        setCurrentStepIndex(0);

        // Remove old route layer if exists
        if (map.current?.getSource('route')) {
          map.current.removeLayer('route');
          map.current.removeSource('route');
        }

        // Add route to map
        map.current?.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          }
        });

        map.current?.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.8
          }
        });

        // Fit map to route
        const bounds = new mapboxgl.LngLatBounds(
          [coordinates[0][0], coordinates[0][1]] as [number, number],
          [coordinates[0][0], coordinates[0][1]] as [number, number]
        );
        coordinates.forEach((coord: number[]) => {
          if (coord.length >= 2) {
            bounds.extend([coord[0], coord[1]] as [number, number]);
          }
        });

        map.current?.fitBounds(bounds, { padding: 80 });
      })
      .catch(error => {
        console.error('Error fetching directions:', error);
      });

    // Add destination marker
    const destMarker = new mapboxgl.Marker({ 
      color: rideStatus === 'accepted' ? '#10b981' : '#ef4444' 
    })
      .setLngLat(destination)
      .setPopup(new mapboxgl.Popup().setHTML(`<p class="text-sm font-semibold">📍 ${destinationLabel}</p>`))
      .addTo(map.current);

    return () => {
      destMarker.remove();
    };
  }, [driverLat, driverLng, pickupLat, pickupLng, dropoffLat, dropoffLng, rideStatus]);

  // Voice navigation function
  const speakInstruction = (instruction: string) => {
    if (!voiceEnabled || !speechSynthesis) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(instruction);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to use a clear English voice
    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    speechSynthesis.speak(utterance);
  };

  // Update driver marker with smooth animation
  useEffect(() => {
    if (!map.current || !driverLat || !driverLng) return;

    if (driverMarker.current) {
      // Animate marker movement smoothly
      const currentPos = driverMarker.current.getLngLat();
      const newPos: [number, number] = [driverLng, driverLat];
      
      // Calculate distance to determine if we should animate
      const distance = Math.sqrt(
        Math.pow(newPos[0] - currentPos.lng, 2) + 
        Math.pow(newPos[1] - currentPos.lat, 2)
      );

      // Only animate if movement is small (< 0.001 degrees, ~100m)
      if (distance < 0.001) {
        // Smooth animation using CSS transition
        const markerElement = driverMarker.current.getElement();
        markerElement.style.transition = 'transform 1s ease-out';
      }

      driverMarker.current.setLngLat(newPos);

      // Calculate distance to next step waypoint
      if (navigationSteps.length > 0 && currentStepIndex < navigationSteps.length) {
        // Auto-advance to next step if close enough (within ~50 meters)
        if (distance > 0 && distance < 0.0005) {
          const nextIndex = currentStepIndex + 1;
          if (nextIndex < navigationSteps.length) {
            setCurrentStepIndex(nextIndex);
            
            // Speak the instruction if not already spoken
            if (voiceEnabled && nextIndex !== lastSpokenStep) {
              speakInstruction(navigationSteps[nextIndex].instruction);
              setLastSpokenStep(nextIndex);
            }
          }
        }
      }
    } else {
      // Create driver marker with custom animated element
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.innerHTML = `
        <div class="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full shadow-lg border-3 border-white animate-pulse">
          <span class="text-white text-2xl">🚗</span>
        </div>
      `;

      driverMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([driverLng, driverLat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-semibold">You are here</p>'))
        .addTo(map.current);
    }

    // Smoothly pan map to keep driver centered
    map.current.easeTo({
      center: [driverLng, driverLat],
      duration: 1000,
      essential: true
    });
  }, [driverLat, driverLng, navigationSteps, currentStepIndex, voiceEnabled, lastSpokenStep]);

  // Speak first instruction when route loads
  useEffect(() => {
    if (navigationSteps.length > 0 && voiceEnabled && lastSpokenStep === -1) {
      speakInstruction(navigationSteps[0].instruction);
      setLastSpokenStep(0);
    }
  }, [navigationSteps, voiceEnabled, lastSpokenStep]);

  return (
    <div className="relative">
      <div ref={mapContainer} className={className} />
      
      {/* Route Info Overlay */}
      {routeDistance > 0 && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <ThemedCard className="p-3 bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {routeDistance.toFixed(1)} km
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ~{Math.ceil(routeDuration)} min
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setVoiceEnabled(!voiceEnabled);
                    if (!voiceEnabled) {
                      toast.success('Voice navigation enabled');
                    } else {
                      toast.info('Voice navigation disabled');
                      speechSynthesis?.cancel();
                    }
                  }}
                  className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                  title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-4 h-4 text-primary" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {rideStatus === 'accepted' ? 'To pickup' : 'To destination'}
                  </p>
                </div>
              </div>
            </div>
          </ThemedCard>
        </div>
      )}

      {/* Turn-by-turn instructions */}
      {navigationSteps.length > 0 && currentStepIndex < navigationSteps.length && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <ThemedCard className="p-4 bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">
                  {navigationSteps[currentStepIndex].instruction}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(navigationSteps[currentStepIndex].distance / 1000).toFixed(1)} km
                </p>
              </div>
            </div>
            
            {/* Step indicator */}
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Step {currentStepIndex + 1} of {navigationSteps.length}
              </p>
            </div>
          </ThemedCard>
        </div>
      )}
    </div>
  );
};
