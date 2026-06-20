"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { RideType } from "@/lib/types";

const RIDE_TYPES: RideType[] = ["BODA", "ECONOMY", "COMFORT"];
const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "DRIVING_PERMIT", label: "Driving Permit" },
  { value: "VEHICLE_REGISTRATION", label: "Vehicle Registration" },
  { value: "INSURANCE", label: "Insurance" },
];

export function VehicleSetup({ onDone }: { onDone: () => void }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [rideType, setRideType] = useState<RideType>("ECONOMY");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/drivers/me/vehicle", {
        method: "POST",
        body: JSON.stringify({ make, model, color, plateNumber, rideType }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save vehicle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add your vehicle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Make</Label>
              <Input required value={make} onChange={(e) => setMake(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input required value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Color</Label>
              <Input required value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Plate number</Label>
              <Input
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-600">Ride type</p>
            <div className="grid grid-cols-3 gap-2">
              {RIDE_TYPES.map((rt) => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => setRideType(rt)}
                  className={cn(
                    "rounded-xl border py-2 text-sm",
                    rideType === rt ? "border-black bg-black text-white" : "border-neutral-300",
                  )}
                >
                  {rt}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save vehicle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function DocumentUpload({ onUploaded }: { onUploaded: () => void }) {
  const [type, setType] = useState(DOCUMENT_TYPES[0].value);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      await apiFetch("/drivers/me/documents", { method: "POST", body: formData });
      setFile(null);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm"
        >
          {DOCUMENT_TYPES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={!file || uploading} onClick={handleUpload}>
          {uploading ? "Uploading..." : "Upload document"}
        </Button>
      </CardContent>
    </Card>
  );
}
