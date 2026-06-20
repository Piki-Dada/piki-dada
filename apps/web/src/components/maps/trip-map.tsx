"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";
import { useMapsReady } from "./map-provider";
import type { LatLng } from "@/lib/types";

interface TripMapProps {
  pickup?: LatLng;
  destination?: LatLng;
  driverLocation?: LatLng;
  height?: string;
}

const containerStyle = { width: "100%", height: "100%" };
const defaultCenter: LatLng = { lat: 0.3476, lng: 32.5825 };

export function TripMap({ pickup, destination, driverLocation, height = "300px" }: TripMapProps) {
  const mapsReady = useMapsReady();
  const center = pickup ?? driverLocation ?? defaultCenter;

  if (!mapsReady) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-400"
      >
        Map loading...
      </div>
    );
  }

  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}>
        {pickup && <Marker position={pickup} label="P" />}
        {destination && <Marker position={destination} label="D" />}
        {driverLocation && <Marker position={driverLocation} label="🚗" />}
      </GoogleMap>
    </div>
  );
}
