import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressSuggestion {
  formattedAddress: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectAddress?: (address: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  proximityLocation?: { lat: number; lng: number };
}

export function AddressAutocompleteInput({
  value,
  onChange,
  onSelectAddress,
  placeholder = 'Enter address',
  className = '',
  icon,
  proximityLocation,
}: AddressAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Geocoding search with proximity bias
  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    
    try {
      // Build Nominatim search URL with proximity bias
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;
      
      // Add proximity/viewbox if pickup location is provided
      if (proximityLocation) {
        // Create a viewbox around the pickup location (approx 50km radius)
        const latDelta = 0.45; // ~50km
        const lngDelta = 0.45;
        const viewbox = `${proximityLocation.lng - lngDelta},${proximityLocation.lat + latDelta},${proximityLocation.lng + lngDelta},${proximityLocation.lat - latDelta}`;
        url += `&viewbox=${viewbox}&bounded=0`; // bounded=0 allows results outside but biases to viewbox
      }

      const res = await fetch(url);
      const data = await res.json();

      const suggestions: AddressSuggestion[] = data.map((place: any) => ({
        formattedAddress: place.display_name,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
      }));

      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    fetchSuggestions(newValue);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.formattedAddress);
    onSelectAddress?.(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-10' : ''} ${className}`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 border-b border-border last:border-0"
            >
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground">{suggestion.formattedAddress}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
