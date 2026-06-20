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
              <Button
                size="sm"
                variant={u.isActive ? "destructive" : "default"}
                onClick={() => toggleActive(u)}
              >
                {u.isActive ? "Suspend" : "Activate"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
