"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, mediaUrl } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Skeleton,
  statusColor,
} from "@/components/ui";
import { formatDuration } from "@/lib/utils";
import {
  ASPECT_RATIOS,
  type AspectRatio,
  type CaptionPreset,
  type Clip,
  type QualityReview,
  type Video,
} from "@/lib/clipping/types";

interface ClipDetail {
  clip: Clip;
  video: Video | null;
  reviews: QualityReview[];
  analytics: unknown;
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const detail = useFetch<ClipDetail>(`/api/clips/${id}`);
  const settings = useFetch<{ captionPresets: CaptionPreset[] }>("/api/settings");

  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [aspect, setAspect] = useState<AspectRatio>("9:16");
  const [presetId, setPresetId] = useState("");
  const [focusX, setFocusX] = useState(0.5);
  const [busy, setBusy] = useState<"render" | "export" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const clip = detail.data?.clip;

  useEffect(() => {
    if (clip) {
      setStart(Math.round(clip.start * 10) / 10);
      setEnd(Math.round(clip.end * 10) / 10);
      setAspect(clip.aspectRatio);
      setFocusX(clip.focusX ?? 0.5);
    }
  }, [clip?.id]);

  const rerender = async () => {
    setBusy("render");
    setError(null);
    try {
      await api.patch(`/api/clips/${id}`, {
        start,
        end,
        aspectRatio: aspect,
        focusX,
        captionPresetId: presetId || undefined,
      });
      detail.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const exportClip = async () => {
    setBusy("export");
    setError(null);
    try {
      const res = await api.post<{ downloadUrl: string }>(`/api/clips/${id}/export`);
      setDownloadUrl(res.downloadUrl);
      detail.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (detail.loading && !detail.data) return <Skeleton className="h-96" />;
  if (!clip) return <p className="text-white/60">Clip not found.</p>;

  const version = clip.versions[clip.versions.length - 1];
  const latestReview = detail.data?.reviews[0];

  return (
    <div>
      <PageHeader
        title="Editor"
        subtitle={clip.hook || clip.title}
        actions={<Badge color={statusColor(clip.status)}>{clip.status}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Preview */}
        <div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
            {version?.storageKey ? (
              <video
                key={version.version}
                src={mediaUrl(version.storageKey)}
                controls
                className="mx-auto max-h-[70vh] w-full object-contain"
              />
            ) : (
              <div className="flex h-96 items-center justify-center text-white/40">
                Not rendered yet
              </div>
            )}
          </div>

          {/* Version history */}
          <Card className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-white/70">Versions</h3>
            <div className="space-y-1 text-sm">
              {clip.versions
                .slice()
                .reverse()
                .map((v) => (
                  <div key={v.version} className="flex items-center justify-between">
                    <span className="text-white/70">
                      v{v.version} · {formatDuration(v.end - v.start)} · {v.aspectRatio}
                    </span>
                    {v.storageKey && (
                      <a
                        href={mediaUrl(v.storageKey)}
                        download
                        className="text-indigo-300 hover:underline"
                      >
                        download
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-sm font-medium text-white/70">Trim &amp; reframe</h3>
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="text-white/60">Start (s)</span>
                <input
                  type="number"
                  step="0.1"
                  value={start}
                  onChange={(e) => setStart(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block">
                <span className="text-white/60">End (s)</span>
                <input
                  type="number"
                  step="0.1"
                  value={end}
                  onChange={(e) => setEnd(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block">
                <span className="text-white/60">Aspect ratio</span>
                <select
                  value={aspect}
                  onChange={(e) => setAspect(e.target.value as AspectRatio)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400"
                >
                  {ASPECT_RATIOS.map((r) => (
                    <option key={r} value={r} className="bg-[#0d0d10]">
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-white/60">Caption preset</span>
                <select
                  value={presetId}
                  onChange={(e) => setPresetId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400"
                >
                  <option value="" className="bg-[#0d0d10]">
                    (keep current)
                  </option>
                  {settings.data?.captionPresets.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0d0d10]">
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-white/60">Reframe focus X: {focusX.toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={focusX}
                  onChange={(e) => setFocusX(Number(e.target.value))}
                  className="mt-2 w-full"
                />
              </label>
            </div>
            <Button className="mt-4 w-full" onClick={rerender} loading={busy === "render"}>
              Re-render
            </Button>
            <Button
              variant="secondary"
              className="mt-2 w-full"
              onClick={exportClip}
              loading={busy === "export"}
              disabled={!version?.storageKey}
            >
              Export
            </Button>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download
                className="mt-2 block text-center text-sm text-indigo-300 hover:underline"
              >
                Download exported clip
              </a>
            )}
            {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
          </Card>

          {/* Quality review */}
          {latestReview && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/70">Quality review</h3>
                <Badge color={statusColor(latestReview.verdict === "accept" ? "accepted" : latestReview.verdict === "reject" ? "rejected" : "reedit")}>
                  {latestReview.overall}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {latestReview.dimensions.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 capitalize text-white/50">{d.name}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${d.score}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-white/50">{d.score}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
