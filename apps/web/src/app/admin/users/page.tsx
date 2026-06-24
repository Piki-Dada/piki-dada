"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  emailVerifiedAt: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);

  function load() {
    apiFetch<AdminUser[]>("/admin/users").then(setUsers);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(user: AdminUser) {
    await apiFetch(`/admin/users/${user.id}/${user.isActive ? "suspend" : "activate"}`, {
      method: "PATCH",
    });
    load();
  }

  async function promote(user: AdminUser) {
    if (!confirm(`Make ${user.name} (${user.email}) an admin? This grants full admin access.`)) {
      return;
    }
    try {
      await apiFetch(`/admin/users/${user.id}/promote`, { method: "PATCH" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to promote user");
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Users</h1>
      <div className="space-y-2">
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex items-center justify-between pt-4">
              <div>
                <p className="font-medium">
                  {u.name} <span className="text-xs text-neutral-400">({u.role})</span>
                </p>
                <p className="text-sm text-neutral-500">{u.email}</p>
              </div>
              <div className="flex gap-2">
                {u.role !== "ADMIN" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!u.emailVerifiedAt}
                    title={!u.emailVerifiedAt ? "User must verify their email first" : undefined}
                    onClick={() => promote(u)}
                  >
                    Promote to Admin
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={u.isActive ? "destructive" : "default"}
                  onClick={() => toggleActive(u)}
                >
                  {u.isActive ? "Suspend" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
