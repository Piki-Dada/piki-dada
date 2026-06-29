"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { DivIcon } from "leaflet";
import type { LatLng } from "@/lib/types";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });

interface TripMapProps {
  pickup?: LatLng;
  destination?: LatLng;
  driverLocation?: LatLng;
  height?: string;
}

const defaultCenter: LatLng = { lat: 0.3476, lng: 32.5825 };

function useDivIcon(label: string, background: string) {
  const [icon, setIcon] = useState<DivIcon | null>(null);

  useEffect(() => {
    import("leaflet").then((L) => {
      setIcon(
        L.divIcon({
          html: `<div style="background:${background};color:#fff;border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 1px 4px rgba(0,0,0,0.4)">${label}</div>`,
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      );
    });
  }, [label, background]);

  return icon;
}

export function TripMap({ pickup, destination, driverLocation, height = "300px" }: TripMapProps) {
  const [mounted, setMounted] = useState(false);
  const pickupIcon = useDivIcon("P", "#16a34a");
  const destinationIcon = useDivIcon("D", "#dc2626");
  const driverIcon = useDivIcon("🚗", "#111827");

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-400"
      >
        Loading map...
      </div>
    );
  }

  const center = pickup ?? driverLocation ?? defaultCenter;

  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={`https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${process.env.NEXT_PUBLIC_STADIA_MAPS_API_KEY ?? ""}`}
        />
        {pickup && pickupIcon && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
        {destination && destinationIcon && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />
        )}
        {driverLocation && driverIcon && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon} />
        )}
      </MapContainer>
    </div>
  );
}
