"use client";

import { useRef } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { useMapsReady } from "./map-provider";
import type { LatLng } from "@/lib/types";

interface PlaceInputProps {
  placeholder: string;
  value: string;
  onChange: (address: string) => void;
  onSelect: (address: string, location: LatLng) => void;
}

export function PlaceInput({ placeholder, value, onChange, onSelect }: PlaceInputProps) {
  const mapsReady = useMapsReady();
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace();
    const location = place?.geometry?.location;
    if (location) {
      onSelect(place.formatted_address ?? value, { lat: location.lat(), lng: location.lng() });
    }
  }

  if (!mapsReady) {
    return (
      <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    );
  }

  return (
    <Autocomplete
      onLoad={(ac) => (autocompleteRef.current = ac)}
      onPlaceChanged={handlePlaceChanged}
    >
      <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </Autocomplete>
  );
}
