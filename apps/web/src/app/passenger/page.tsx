"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlaceInput } from "@/components/maps/place-input";
import { TripMap } from "@/components/maps/trip-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { LatLng, PaymentMethod, RideType, Trip } from "@/lib/types";
import { PassengerNav } from "@/components/passenger/passenger-nav";

const RIDE_TYPES: { value: RideType; label: string; emoji: string }[] = [
  { value: "BODA", label: "Boda", emoji: "🏍️" },
  { value: "ECONOMY", label: "Economy", emoji: "🚗" },
  { value: "COMFORT", label: "Comfort", emoji: "🚙" },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "STRIPE", label: "Card (Stripe)" },
  { value: "FLUTTERWAVE", label: "Mobile Money" },
];

export default function PassengerBookingPage() {
  const router = useRouter();
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickup, setPickup] = useState<LatLng | undefined>();
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destination, setDestination] = useState<LatLng | undefined>();
  const [rideType, setRideType] = useState<RideType>("ECONOMY");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRequest = pickup && destination && pickupAddress && destinationAddress;

  async function handleRequestRide() {
    if (!pickup || !destination) return;
    setLoading(true);
    setError(null);
    try {
      const { trip } = await apiFetch<{ trip: Trip; candidateDriverCount: number }>("/trips", {
        method: "POST",
        body: JSON.stringify({
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          pickupAddress,
          destinationLat: destination.lat,
          destinationLng: destination.lng,
          destinationAddress,
          rideType,
          paymentMethod,
        }),
      });
      router.push(`/passenger/trip/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request ride");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <div className="p-4">
        <TripMap pickup={pickup} destination={destination} height="260px" />
      </div>

      <Card className="mx-4 -mt-6">
        <CardHeader>
          <CardTitle>Where to?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PlaceInput
            placeholder="Pickup location"
            value={pickupAddress}
            onChange={setPickupAddress}
            onSelect={(address, location) => {
              setPickupAddress(address);
              setPickup(location);
            }}
          />
          <PlaceInput
            placeholder="Destination"
            value={destinationAddress}
            onChange={setDestinationAddress}
            onSelect={(address, location) => {
              setDestinationAddress(address);
              setDestination(location);
            }}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-600">Ride type</p>
            <div className="grid grid-cols-3 gap-2">
              {RIDE_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setRideType(rt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border py-3 text-sm",
                    rideType === rt.value ? "border-black bg-black text-white" : "border-neutral-300",
                  )}
                >
                  <span className="text-xl">{rt.emoji}</span>
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-600">Payment</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setPaymentMethod(pm.value)}
                  className={cn(
                    "rounded-xl border py-2 text-xs font-medium",
                    paymentMethod === pm.value ? "border-black bg-black text-white" : "border-neutral-300",
                  )}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            className="w-full"
            size="lg"
            disabled={!canRequest || loading}
            onClick={handleRequestRide}
          >
            {loading ? "Requesting..." : "Request Ride"}
          </Button>
        </CardContent>
      </Card>

      <PassengerNav />
    </div>
  );
}
