"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import type { Project } from "@/lib/clipping/types";

type ProjectRow = Project & { videoCount: number; clipCount: number };

export default function ProjectsPage() {
  const { data, loading, error, reload } = useFetch<{ projects: ProjectRow[] }>("/api/projects");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setFormError(null);
    try {
      await api.post("/api/projects", { name });
      setName("");
      reload();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <PageHeader title="Projects" subtitle="Group your source videos and their clips." />

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm text-white/60">New project name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="e.g. Podcast Season 3"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <Button onClick={create} loading={creating}>
            Create project
          </Button>
        </div>
        {formError && <p className="mt-2 text-sm text-red-300">{formError}</p>}
      </Card>

      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data && data.projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full hover:border-white/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-white/40">Created {timeAgo(p.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge color="blue">{p.videoCount} videos</Badge>
                    <Badge color="green">{p.clipCount} clips</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects yet"
          hint="Create your first project above, then add a video to start clipping."
        />
      )}
    </div>
  );
}
