"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { DriverProfile } from "@/lib/types";

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);

  function load() {
    apiFetch<DriverProfile[]>("/drivers/pending").then(setDrivers);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    await apiFetch(`/drivers/${id}/approve`, { method: "PATCH" });
    load();
  }

  async function reject(id: string) {
    await apiFetch(`/drivers/${id}/reject`, { method: "PATCH" });
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Pending driver approvals</h1>
      <div className="space-y-3">
        {drivers.length === 0 && <p className="text-neutral-400">No pending drivers.</p>}
        {drivers.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-center justify-between pt-4">
              <div>
                <p className="font-medium">{d.user.name}</p>
                <p className="text-sm text-neutral-500">{d.user.email}</p>
                {d.vehicle ? (
                  <p className="text-sm text-neutral-500">
                    {d.vehicle.make} {d.vehicle.model} · {d.vehicle.plateNumber} ·{" "}
                    {d.vehicle.rideType}
                  </p>
                ) : (
                  <p className="text-sm text-yellow-600">No vehicle added yet</p>
                )}
                <p className="text-xs text-neutral-400">{d.documents.length} document(s) uploaded</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => approve(d.id)} disabled={!d.vehicle}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => reject(d.id)}>
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
