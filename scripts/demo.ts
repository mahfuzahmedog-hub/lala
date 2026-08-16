/**
 * End-to-end demo: generate a real sample video, attach a word-level
 * transcript, run the entire clipping pipeline, and verify that real,
 * FFmpeg-rendered clips come out the other end.
 *
 * Run with: npm run demo
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { generateSampleVideo } from "../src/lib/clipping/media/mediaEngine";

const WORKDIR = path.resolve(process.cwd(), "scripts/.demo-workdir");
process.env.CLIPPING_DATA_DIR = path.join(WORKDIR, "data");

import { createContext, ensureSeed } from "../src/lib/clipping/context";
import { createProject, createVideo, startProcessing } from "../src/lib/clipping/service";
import { buildSampleTranscript } from "../src/lib/clipping/sample";

/**
 * A set of self-contained, punchy sentences. Building a transcript from these
 * gives the intelligence stages real, varied material to rank and de-duplicate.
 */

async function main() {
  await fs.rm(WORKDIR, { recursive: true, force: true });
  await fs.mkdir(WORKDIR, { recursive: true });

  const { words, duration } = buildSampleTranscript();
  console.log(`Generating a ${duration}s sample video with FFmpeg...`);
  const samplePath = path.join(WORKDIR, "sample.mp4");
  await generateSampleVideo(samplePath, duration);

  const ctx = createContext();
  await ensureSeed(ctx);

  const project = await createProject(ctx, "Demo Project", "End-to-end pipeline demo");
  const data = await fs.readFile(samplePath);
  const video = await createVideo(ctx, {
    projectId: project.id,
    filename: "sample.mp4",
    data,
    transcript: { language: "en", words },
  });
  console.log(`Uploaded video ${video.id} (${(video.sizeBytes / 1024).toFixed(0)} KiB).`);

  console.log("Running the full pipeline...\n");
  const job = await startProcessing(ctx, video.id, { background: false });

  const finalJob = await ctx.db.jobs.get(job.id);
  console.log(`\nJob status: ${finalJob?.status} (${finalJob?.completedStages.length}/18 stages)`);
  if (finalJob?.status !== "completed") {
    console.error("Pipeline did not complete:", finalJob?.error);
    process.exitCode = 1;
    return;
  }

  const clips = await ctx.db.clips.list((c) => c.videoId === video.id);
  console.log(`\nProduced ${clips.length} clip(s):`);
  let renderedCount = 0;
  for (const clip of clips.sort((a, b) => b.score - a.score)) {
    const version = clip.versions[clip.versions.length - 1];
    const key = version?.storageKey;
    let bytes = 0;
    if (key) {
      const p = await ctx.storage.localPath(key);
      bytes = (await fs.stat(p)).size;
      if (bytes > 0) renderedCount++;
    }
    console.log(
      `  • [${clip.status.toUpperCase()}] score ${clip.score} | ` +
        `${(clip.end - clip.start).toFixed(1)}s | "${clip.hook}" | ` +
        `${(bytes / 1024).toFixed(0)} KiB mp4`,
    );
  }

  // Copy the best rendered clip to outputs so a human can watch it.
  const best = clips
    .filter((c) => c.versions.length > 0)
    .sort((a, b) => b.score - a.score)[0];
  if (best) {
    const key = best.versions[best.versions.length - 1].storageKey!;
    const src = await ctx.storage.localPath(key);
    const outDir = "/mnt/session/outputs";
    await fs.mkdir(outDir, { recursive: true }).catch(() => {});
    await fs.copyFile(src, path.join(outDir, "demo-clip.mp4")).catch(() => {});
  }

  if (renderedCount === 0) {
    console.error("\nFAIL: no clips were rendered to non-empty files.");
    process.exitCode = 1;
    return;
  }
  console.log(`\nOK: ${renderedCount} clip(s) rendered to real MP4 files.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
