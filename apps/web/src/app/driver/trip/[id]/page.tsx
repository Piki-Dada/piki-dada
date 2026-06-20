"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TripMap } from "@/components/maps/trip-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS, type Trip, type TripStatus } from "@/lib/types";

const NEXT_STATUS: Record<string, { next: TripStatus; label: string } | undefined> = {
  ACCEPTED: { next: "ARRIVED", label: "I've arrived" },
  ARRIVED: { next: "IN_PROGRESS", label: "Start trip" },
  IN_PROGRESS: { next: "COMPLETED", label: "Complete trip" },
};

export default function DriverTripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    apiFetch<Trip>(`/trips/${id}`).then(setTrip);
    const socket = getSocket();
    socket.emit("trip:join", id);
  }, [id]);

  useEffect(() => {
    if (!trip || trip.status === "COMPLETED" || trip.status === "CANCELLED") return;
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition((pos) => {
      getSocket().emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
        tripId: id,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      });
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [trip, id]);

  async function advanceStatus() {
    if (!trip) return;
    const step = NEXT_STATUS[trip.status];
    if (!step) return;
    setUpdating(true);
    try {
      const updated = await apiFetch<Trip>(`/trips/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: step.next }),
      });
      setTrip(updated);
      if (step.next === "COMPLETED") {
        setTimeout(() => router.push("/driver"), 1500);
      }
    } finally {
      setUpdating(false);
    }
  }

  if (!trip) return <div className="p-6 text-center text-neutral-400">Loading trip...</div>;

  const step = NEXT_STATUS[trip.status];
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${
    trip.status === "IN_PROGRESS" ? trip.destinationLat : trip.pickupLat
  },${trip.status === "IN_PROGRESS" ? trip.destinationLng : trip.pickupLng}`;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="p-4">
        <TripMap
          pickup={{ lat: trip.pickupLat, lng: trip.pickupLng }}
          destination={{ lat: trip.destinationLat, lng: trip.destinationLng }}
          height="280px"
        />
      </div>

      <Card className="mx-4">
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm text-neutral-500">
            {trip.pickupAddress} → {trip.destinationAddress}
          </p>
          <p className="text-2xl font-bold">
            {trip.fare?.toLocaleString()} {trip.currency}
          </p>

          <a href={navUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full">
              Open navigation
            </Button>
          </a>

          {step && (
            <Button className="w-full" disabled={updating} onClick={advanceStatus}>
              {updating ? "Updating..." : step.label}
            </Button>
          )}

          {trip.status === "COMPLETED" && (
            <p className="text-center text-green-600">Trip completed!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
