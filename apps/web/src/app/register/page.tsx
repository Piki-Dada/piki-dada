"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useAuthStore, type UserRole } from "@/lib/auth-store";
import { redirectForRole } from "@/lib/auth-helpers";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [role, setRole] = useState<UserRole>("PASSENGER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{
        accessToken: string;
        user: { id: string; email: string; role: UserRole };
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, phone, password, role }),
      });
      setSession(data.accessToken, data.user);
      redirectForRole(data.user.role, router);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {(["PASSENGER", "DRIVER"] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-medium",
                  role === r ? "border-black bg-black text-white" : "border-neutral-300",
                )}
              >
                {r === "PASSENGER" ? "Ride" : "Drive"}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                required
                pattern="^\+?[0-9\s\(\)\-]{7,20}$"
                title="Enter a valid phone number"
                placeholder="07XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-black underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
