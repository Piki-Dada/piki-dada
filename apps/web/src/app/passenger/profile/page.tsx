"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { PassengerNav } from "@/components/passenger/passenger-nav";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export default function PassengerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch<Profile>("/users/me").then((p) => {
      setProfile(p);
      setName(p.name);
      setPhone(p.phone ?? "");
    });
  }, []);

  async function handleSave() {
    const updated = await apiFetch<Profile>("/users/me", {
      method: "PATCH",
      body: JSON.stringify({ name, phone }),
    });
    setProfile(updated);
    setSaved(true);
  }

  if (!profile) return <div className="p-6 text-center text-neutral-400">Loading...</div>;

  return (
    <div className="min-h-screen p-4 pb-20">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={profile.email} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {saved && <p className="text-sm text-green-600">Saved</p>}
          <Button className="w-full" onClick={handleSave}>
            Save changes
          </Button>
        </CardContent>
      </Card>
      <PassengerNav />
    </div>
  );
}
