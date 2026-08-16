"use client";

import { useState } from "react";
import { useFetch } from "@/lib/useFetch";
import { Button, PageHeader, Skeleton } from "@/components/ui";
import { ClipGrid } from "@/components/ClipGrid";
import type { Clip } from "@/lib/clipping/types";

const FILTERS = ["all", "accepted", "rejected", "exported", "rendered"] as const;

export default function ClipsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const url = filter === "all" ? "/api/clips" : `/api/clips?status=${filter}`;
  const { data, loading } = useFetch<{ clips: Clip[] }>(url);

  return (
    <div>
      <PageHeader
        title="Clips"
        subtitle="AI-selected, edited, captioned, quality-checked clips."
        actions={
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "primary" : "secondary"}
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        }
      />
      {loading && !data ? (
        <Skeleton className="h-96" />
      ) : (
        <ClipGrid clips={data?.clips ?? []} />
      )}
    </div>
  );
}
