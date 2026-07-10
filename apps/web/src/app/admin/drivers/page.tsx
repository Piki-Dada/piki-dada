"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { DocumentType, DriverProfile } from "@/lib/types";

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  NATIONAL_ID: "National ID",
  DRIVING_PERMIT: "Driving Permit",
  VEHICLE_REGISTRATION: "Motorcycle Registration",
  INSURANCE: "Insurance",
};

function isImageUrl(url: string) {
  return /\.(jpe?g|png|webp)$/i.test(url);
}

// PDFs stored under image/upload were rendered by Cloudinary as images — request the JPEG render.
// PDFs stored under raw/upload (new uploads) are served as-is and open directly in the browser.
function getDocumentUrl(url: string) {
  if (/\.pdf$/i.test(url) && url.includes('/image/upload/')) {
    return url.replace(/\.pdf$/i, '.jpg');
  }
  return url;
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);

  function load() {
    apiFetch<DriverProfile[]>("/drivers/pending").then(setDrivers);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    await apiFetch(`/drivers/${id}/approve`, { method: "PATCH" });
    load();
  }

  async function reject(id: string) {
    await apiFetch(`/drivers/${id}/reject`, { method: "PATCH" });
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Pending driver approvals</h1>
      <div className="space-y-3">
        {drivers.length === 0 && <p className="text-neutral-400">No pending drivers.</p>}
        {drivers.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-center justify-between pt-4">
              <div>
                <p className="font-medium">{d.user.name}</p>
                <p className="text-sm text-neutral-500">{d.user.email}</p>
                {d.vehicle ? (
                  <p className="text-sm text-neutral-500">
                    {d.vehicle.make} {d.vehicle.model} · {d.vehicle.plateNumber} ·{" "}
                    {d.vehicle.rideType}
                  </p>
                ) : (
                  <p className="text-sm text-yellow-600">No vehicle added yet</p>
                )}
                {d.documents.length === 0 ? (
                  <p className="text-xs text-neutral-400">No documents uploaded</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-3">
                    {d.documents.map((doc) => {
                      const docUrl = getDocumentUrl(doc.fileUrl);
                      return (
                        <a
                          key={doc.id}
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1 text-xs text-neutral-500 hover:text-black"
                        >
                          {isImageUrl(docUrl) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={docUrl}
                              alt={DOCUMENT_LABELS[doc.type]}
                              className="h-16 w-24 rounded-md border border-neutral-200 object-cover"
                            />
                          ) : (
                            <span className="flex h-16 w-24 items-center justify-center rounded-md border border-neutral-200 text-[11px] uppercase">
                              PDF
                            </span>
                          )}
                          <span className="underline">{DOCUMENT_LABELS[doc.type]}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => approve(d.id)} disabled={!d.vehicle}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => reject(d.id)}>
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
