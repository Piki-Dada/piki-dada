"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

interface AdminTrip {
  id: string;
  status: string;
  rideType: string;
  fare: number | null;
  currency: string;
  pickupAddress: string;
  destinationAddress: string;
  createdAt: string;
  passenger: { name: string };
  driver: { user: { name: string } } | null;
}

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<AdminTrip[]>([]);

  useEffect(() => {
    apiFetch<AdminTrip[]>("/admin/trips").then(setTrips);
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Ride monitor</h1>
      <div className="space-y-2">
        {trips.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between pt-4 text-sm">
              <div>
                <p className="font-medium">
                  {t.passenger.name} → {t.driver?.user.name ?? "unassigned"}
                </p>
                <p className="text-neutral-500">
                  {t.pickupAddress} → {t.destinationAddress}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {t.fare?.toLocaleString() ?? "-"} {t.currency}
                </p>
                <p className="text-neutral-400">{t.status}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
