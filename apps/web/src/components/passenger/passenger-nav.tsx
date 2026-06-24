"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Car, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const ITEMS = [
  { href: "/passenger", label: "Ride", icon: Car },
  { href: "/passenger/history", label: "History", icon: Clock },
  { href: "/passenger/profile", label: "Profile", icon: User },
];

export function PassengerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t border-neutral-200 bg-white py-2">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-1 text-xs",
            pathname === href ? "text-black" : "text-neutral-400",
          )}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}
      <button
        onClick={async () => {
          await apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
          clearSession();
          router.push("/login");
        }}
        className="flex flex-col items-center gap-1 px-4 py-1 text-xs text-neutral-400"
      >
        Logout
      </button>
    </nav>
  );
}
