"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Car, MapPin, Tag, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/drivers", label: "Drivers", icon: Car },
  { href: "/admin/trips", label: "Trips", icon: MapPin },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/pricing", label: "Pricing", icon: DollarSign },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <aside className="fixed inset-y-0 left-0 w-56 border-r border-neutral-200 bg-white p-4">
      <p className="mb-6 px-2 text-lg font-bold">Piki Dada Admin</p>
      <nav className="space-y-1">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              pathname === href ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100",
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
        <button
          onClick={() => {
            clearSession();
            router.push("/login");
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          Logout
        </button>
      </nav>
    </aside>
  );
}
