"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { redirectForRole } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) redirectForRole(user.role, router);
  }, [user, router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold">Piki Dada</h1>
      <p className="max-w-sm text-neutral-500">
        Modern ride-hailing for Uganda — book a boda, taxi, or comfort ride in seconds.
      </p>
      <div className="flex gap-3">
        <Link href="/register">
          <Button size="lg">Get started</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline">
            Sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}
