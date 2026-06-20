"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { redirectForRole } from "@/lib/auth-helpers";
import { apiFetch } from "@/lib/api";

function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    if (!accessToken || !refreshToken) {
      router.push("/login");
      return;
    }
    useAuthStore.setState({ accessToken, refreshToken });
    apiFetch<{ id: string; email: string; role: "PASSENGER" | "DRIVER" | "ADMIN" }>("/users/me")
      .then((user) => {
        setSession(accessToken, refreshToken, user);
        redirectForRole(user.role, router);
      })
      .catch(() => router.push("/login"));
  }, [params, router, setSession]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-neutral-500">Signing you in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-neutral-500">Signing you in...</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
