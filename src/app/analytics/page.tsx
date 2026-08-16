"use client";

import { useFetch } from "@/lib/useFetch";
import { Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";

interface Row {
  clipId: string;
  title: string;
  predictedScore: number;
  views: number;
  likes: number;
  shares: number;
  watchThroughRate: number;
}

export default function AnalyticsPage() {
  const { data, loading } = useFetch<{ analytics: Row[] }>("/api/analytics");
  const rows = data?.analytics ?? [];

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Predicted quality vs. real performance. Actuals feed creator-specific learning."
      />
      {loading && !data ? (
        <Skeleton className="h-40" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No analytics yet"
          hint="Accepted clips appear here with their predicted quality score."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/50">
                <th className="px-4 py-3 font-medium">Clip</th>
                <th className="px-4 py-3 font-medium">Predicted</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Likes</th>
                <th className="px-4 py-3 font-medium">Shares</th>
                <th className="px-4 py-3 font-medium">Watch-through</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.clipId} className="border-b border-white/5 last:border-0">
                  <td className="max-w-xs truncate px-4 py-3">{r.title}</td>
                  <td className="px-4 py-3">{r.predictedScore}</td>
                  <td className="px-4 py-3">{r.views}</td>
                  <td className="px-4 py-3">{r.likes}</td>
                  <td className="px-4 py-3">{r.shares}</td>
                  <td className="px-4 py-3">{Math.round(r.watchThroughRate * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
