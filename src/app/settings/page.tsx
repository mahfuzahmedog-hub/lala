"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { Button, Card, PageHeader, Skeleton } from "@/components/ui";
import type { CaptionPreset, UserSettings } from "@/lib/clipping/types";

interface SettingsData {
  settings: UserSettings;
  captionPresets: CaptionPreset[];
}

export default function SettingsPage() {
  const { data, loading, reload } = useFetch<SettingsData>("/api/settings");
  const [form, setForm] = useState<UserSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data?.settings?.id]);

  if (loading && !data) return <Skeleton className="h-96" />;
  if (!form) return null;

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setForm({ ...form, [key]: value });
    setSaved(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      await api.put("/api/settings", form);
      setSaved(true);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const numberField = (label: string, key: keyof UserSettings, min?: number, max?: number) => (
    <label className="block">
      <span className="text-sm text-white/60">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={form[key] as number}
        onChange={(e) => set(key, Number(e.target.value) as never)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
      />
    </label>
  );

  return (
    <div>
      <PageHeader title="Settings" subtitle="Tune the pipeline. Providers are swappable seams." />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-medium text-white/70">Clip selection</h3>
          <div className="space-y-3">
            {numberField("Target clip count", "targetClipCount", 1, 20)}
            {numberField("Min clip length (s)", "minClipSec", 3, 120)}
            {numberField("Max clip length (s)", "maxClipSec", 5, 180)}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-medium text-white/70">Quality control</h3>
          <div className="space-y-3">
            {numberField("Accept threshold", "qualityAcceptThreshold", 0, 100)}
            {numberField("Reject threshold", "qualityRejectThreshold", 0, 100)}
            {numberField("Max re-edit retries", "maxReeditRetries", 0, 5)}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-medium text-white/70">Defaults</h3>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-white/60">Default caption preset</span>
              <select
                value={form.defaultCaptionPresetId}
                onChange={(e) => set("defaultCaptionPresetId", e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                {data?.captionPresets.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0d0d10]">
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-medium text-white/70">Providers (read-only)</h3>
          <div className="space-y-2 text-sm text-white/60">
            <p>Transcription: <span className="text-white/80">{form.transcriptionProvider}</span></p>
            <p>Embeddings: <span className="text-white/80">{form.embeddingProvider}</span></p>
            <p>LLM: <span className="text-white/80">{form.llmProvider}</span></p>
            <p className="pt-2 text-xs text-white/40">
              Set OPENAI_API_KEY to switch transcription/embeddings to hosted models. Otherwise the
              app runs fully offline with deterministic providers.
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} loading={busy}>
          Save settings
        </Button>
        {saved && <span className="text-sm text-emerald-300">Saved.</span>}
      </div>
    </div>
  );
}
