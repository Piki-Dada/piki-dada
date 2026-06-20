import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { UserRole } from "./auth-store";

export function redirectForRole(role: UserRole, router: AppRouterInstance) {
  if (role === "DRIVER") router.push("/driver");
  else if (role === "ADMIN") router.push("/admin");
  else router.push("/passenger");
}
