"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { redirectForRole } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { installed } = usePwaInstall();

  useEffect(() => {
    if (user) redirectForRole(user.role, router);
  }, [user, router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold">Piki Dada</h1>
      <p className="max-w-sm text-neutral-500">
        Your trusted partner for safe, reliable boda rides and fast deliveries across the city and beyond.
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
      {!installed && (
        <Link
          href="/install"
          className="js-hide-if-pwa-installed mt-2 text-sm text-neutral-400 underline hover:text-neutral-600"
        >
          Install the app
        </Link>
      )}
    </div>
  );
}
