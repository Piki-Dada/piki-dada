"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import type { LatLng } from "@/lib/types";

interface PlaceInputProps {
  placeholder: string;
  value: string;
  onChange: (address: string) => void;
  onSelect: (address: string, location: LatLng) => void;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

// Rough bounding box over Uganda + border areas to bias OSM search results.
const UGANDA_VIEWBOX = "29.5,4.5,35.5,-1.5";

export function PlaceInput({ placeholder, value, onChange, onSelect }: PlaceInputProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function handleChange(text: string) {
    onChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => search(text), 400);
  }

  async function search(text: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&viewbox=${UGANDA_VIEWBOX}&bounded=1&limit=5`;
      const res = await fetch(url, { signal: controller.signal });
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      // ignore aborted or failed lookups — the manual fallback below still works
    }
  }

  function selectSuggestion(result: NominatimResult) {
    onChange(result.display_name);
    onSelect(result.display_name, { lat: Number(result.lat), lng: Number(result.lon) });
    setSuggestions([]);
    setOpen(false);
  }

  function applyManualCoords(nextLat: string, nextLng: string) {
    const parsedLat = Number(nextLat);
    const parsedLng = Number(nextLng);
    if (value && Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      onSelect(value, { lat: parsedLat, lng: parsedLng });
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(suggestions.length > 0)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && (
          <ul className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                >
                  {s.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!manualMode ? (
        <button
          type="button"
          onClick={() => setManualMode(true)}
          className="text-xs text-neutral-400 underline hover:text-neutral-600"
        >
          Can&apos;t find it? Enter coordinates manually
        </button>
      ) : (
        <div className="flex gap-2">
          <Input
            type="number"
            step="any"
            placeholder="Latitude"
            value={lat}
            onChange={(e) => {
              setLat(e.target.value);
              applyManualCoords(e.target.value, lng);
            }}
            className="h-9 text-sm"
          />
          <Input
            type="number"
            step="any"
            placeholder="Longitude"
            value={lng}
            onChange={(e) => {
              setLng(e.target.value);
              applyManualCoords(lat, e.target.value);
            }}
            className="h-9 text-sm"
          />
        </div>
      )}
    </div>
  );
}
