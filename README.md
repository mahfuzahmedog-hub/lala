# ClipForge — AI Clipping Bot

An autonomous AI video editor that turns long-form video into high-quality
short-form clips for Shorts, Reels, and TikTok. This repository implements the
foundation and a working, end-to-end vertical slice of the build specification:
real media processing, a resumable processing pipeline, clip intelligence, and a
full application UI.

## What actually works today

- **Modular, replaceable providers** (build spec rules #2–#4)
  - `StorageProvider` — local filesystem now, S3 later.
  - `Database` — file-backed JSON now, Postgres later.
  - AI seams — `TranscriptionProvider` (Whisper or imported-sidecar) and
    `EmbeddingProvider` (hosted or deterministic offline). The app runs with **no
    API keys** using deterministic providers, or upgrades to hosted models when
    `OPENAI_API_KEY` is set.
- **Real media engine (FFmpeg / ffprobe)** — media probe, scene detection,
  windowed loudness + silence analysis, motion analysis, thumbnails, auto-
  reframing (scale-to-cover + focus crop), caption burn-in, and clip rendering.
- **Resumable pipeline** — 18 ordered stages, each persisting its state. A failed
  stage preserves earlier outputs; completed stages are never re-run.
- **Clip intelligence** — over-generation → signal scoring → ranking →
  embedding-based duplicate removal → MMR diversity selection.
- **AI quality critic** — 10-dimension review with an Accept / Re-edit / Reject
  loop; re-edits apply a targeted fix based on the diagnosed weakness.
- **Full UI** — Dashboard, Projects, Videos, Processing, Candidates, Clips,
  Editor, Analytics, Settings, wired to real APIs with live progress polling.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

In the UI: create a **Project → "Add sample video" → Process**. The sample video
is generated with FFmpeg and ships with a matching word-level transcript, so the
entire pipeline runs offline.

## Verifying without the UI

```bash
npm run typecheck    # tsc --noEmit
npm test             # unit tests for the intelligence + persistence layers
npm run demo         # generates a real video, runs the whole pipeline,
                     # and renders real .mp4 clips (writes demo-clip.mp4)
```

## Architecture

```
src/lib/clipping/
  types.ts            Domain models (single source of truth)
  db/                 Database interface + JSON implementation
  storage/            StorageProvider interface + local implementation
  ai/                 Transcription + embedding provider seams
  media/              FFmpeg/ffprobe wrappers
  intelligence/       Signals, ranking, diversity, boundaries, hooks, captions, quality
  pipeline/           Stage definitions + resumable orchestrator
  service.ts          High-level operations used by the API
src/app/api/          Next.js route handlers
src/app/*             UI pages
```

Runtime data (persisted DB + object storage) lives under `.data/` (gitignored),
overridable via `CLIPPING_DATA_DIR`.

## Configuration

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Switch transcription → Whisper and embeddings → OpenAI |
| `CLIPPING_DATA_DIR` | Where the JSON DB + object storage live (default `.data`) |
| `FFMPEG_PATH` / `FFPROBE_PATH` | Override binary locations |
