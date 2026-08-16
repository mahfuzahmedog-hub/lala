"use client";

import { useFetch } from "@/lib/useFetch";
import { PageHeader, Skeleton } from "@/components/ui";
import { ClipGrid } from "@/components/ClipGrid";
import type { Clip } from "@/lib/clipping/types";

export default function EditorPickerPage() {
  const { data, loading } = useFetch<{ clips: Clip[] }>("/api/clips");
  return (
    <div>
      <PageHeader title="Editor" subtitle="Pick a clip to fine-tune and re-render." />
      {loading && !data ? <Skeleton className="h-96" /> : <ClipGrid clips={data?.clips ?? []} />}
    </div>
  );
}
