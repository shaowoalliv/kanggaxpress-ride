import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getMapProvider, PlaceResult, Coordinates } from '@/lib/mapProvider';

interface MapSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectPlace?: (place: PlaceResult) => void;
  placeholder?: string;
  proximity?: Coordinates;
  className?: string;
  icon?: React.ReactNode;
}

export function MapSearchInput({
  value,
  onChange,
  onSelectPlace,
  placeholder = 'Search for a place...',
  proximity,
  className,
  icon,
}: MapSearchInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        const mapProvider = getMapProvider();
        const results = await mapProvider.searchPlaces(value, { proximity });
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [value, proximity]);

  const handleSelectSuggestion = (place: PlaceResult) => {
    onChange(place.fullAddress);
    onSelectPlace?.(place);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        {icon || <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("pl-10", className)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((place) => (
            <button
              key={place.id}
              onClick={() => handleSelectSuggestion(place)}
              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-2"
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{place.name}</div>
                <div className="text-sm text-muted-foreground truncate">{place.fullAddress}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
