import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { JsonDatabase } from "../db/jsonDatabase";
import { createContext } from "../context";
import { createJob, runPipeline } from "../pipeline/orchestrator";
import type { Project } from "../types";

async function tmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "clip-db-"));
}

test("JsonDatabase persists and reloads records", async () => {
  const dir = await tmpDir();
  const db1 = new JsonDatabase(dir);
  const project: Project = {
    id: "p1",
    userId: "u1",
    name: "Test",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db1.projects.create(project);
  await db1.projects.update("p1", { name: "Renamed" });

  // A fresh instance must read the same data back from disk.
  const db2 = new JsonDatabase(dir);
  const loaded = await db2.projects.get("p1");
  assert.equal(loaded?.name, "Renamed");
  await fs.rm(dir, { recursive: true, force: true });
});

test("list returns copies, not references into the cache", async () => {
  const dir = await tmpDir();
  const db = new JsonDatabase(dir);
  await db.projects.create({
    id: "p1",
    userId: "u1",
    name: "Original",
    createdAt: "t",
    updatedAt: "t",
  });
  const [a] = await db.projects.list();
  a.name = "Mutated";
  const again = await db.projects.get("p1");
  assert.equal(again?.name, "Original");
  await fs.rm(dir, { recursive: true, force: true });
});

test("runPipeline is resumable: a failed stage preserves earlier work", async () => {
  const dir = await tmpDir();
  const ctx = createContext(dir);
  // A video whose original file does not exist: the probe stage will fail.
  const video = await ctx.db.videos.create({
    id: "vid_missing",
    projectId: "proj_x",
    filename: "nope.mp4",
    storageKey: "videos/nope.mp4",
    sizeBytes: 0,
    status: "uploaded",
    createdAt: "t",
    updatedAt: "t",
  });
  const job = await createJob(ctx, video.id, video.projectId);
  const result = await runPipeline(ctx, job.id);
  assert.equal(result.status, "failed");
  assert.equal(result.currentStage, "probe");
  assert.equal(result.completedStages.length, 0);
  assert.ok(result.error && result.error.length > 0);

  // Re-running increments the retry count and does not lose state.
  const retried = await runPipeline(ctx, job.id);
  assert.equal(retried.retryCount, 1);
  await fs.rm(dir, { recursive: true, force: true });
});
