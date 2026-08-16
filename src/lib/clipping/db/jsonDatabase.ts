import { promises as fs } from "node:fs";
import path from "node:path";
import type { Collection, Database } from "./types";
import type {
  Analytics,
  Clip,
  ClipCandidate,
  Project,
  ProcessingJob,
  QualityReview,
  Template,
  Transcript,
  User,
  UserSettings,
  Video,
  VideoAnalysis,
} from "../types";

/**
 * A file-backed collection. Each collection is a single JSON file holding an
 * array of records. Writes are serialised through a per-file promise chain and
 * flushed atomically (write temp file, then rename) so a crash mid-write can
 * never corrupt the store. This is deliberately simple; the `Collection`
 * interface is what a Postgres-backed implementation would satisfy instead.
 */
class JsonCollection<T extends { id: string }> implements Collection<T> {
  private readonly file: string;
  private cache: T[] | null = null;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(dir: string, name: string) {
    this.file = path.join(dir, `${name}.json`);
  }

  private async load(): Promise<T[]> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(this.file, "utf8");
      this.cache = JSON.parse(raw) as T[];
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        this.cache = [];
      } else {
        throw err;
      }
    }
    return this.cache;
  }

  /** Serialise all mutations so concurrent callers cannot interleave writes. */
  private enqueueWrite(mutator: (items: T[]) => T[] | void): Promise<void> {
    const run = this.writeChain.then(async () => {
      const items = await this.load();
      const next = mutator(items) ?? items;
      this.cache = next;
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
      await fs.rename(tmp, this.file);
    });
    // Keep the chain alive even if a write fails, so later writes still run.
    this.writeChain = run.catch(() => undefined);
    return run;
  }

  async get(id: string): Promise<T | null> {
    const items = await this.load();
    return items.find((i) => i.id === id) ?? null;
  }

  async list(predicate?: (item: T) => boolean): Promise<T[]> {
    const items = await this.load();
    const out = predicate ? items.filter(predicate) : items.slice();
    // Return copies so callers cannot mutate the cache in place.
    return out.map((i) => structuredClone(i));
  }

  async create(item: T): Promise<T> {
    await this.enqueueWrite((items) => {
      if (items.some((i) => i.id === item.id)) {
        throw new Error(`Record with id ${item.id} already exists`);
      }
      items.push(structuredClone(item));
    });
    return structuredClone(item);
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    let updated: T | null = null;
    await this.enqueueWrite((items) => {
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error(`Record with id ${id} not found`);
      items[idx] = { ...items[idx], ...patch, id };
      updated = structuredClone(items[idx]);
    });
    return updated as unknown as T;
  }

  async upsert(item: T): Promise<T> {
    await this.enqueueWrite((items) => {
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx === -1) items.push(structuredClone(item));
      else items[idx] = structuredClone(item);
    });
    return structuredClone(item);
  }

  async delete(id: string): Promise<void> {
    await this.enqueueWrite((items) => items.filter((i) => i.id !== id));
  }
}

/**
 * File-backed implementation of {@link Database}. All collections live under a
 * single directory (default `.data/db`, override with `CLIPPING_DATA_DIR`).
 */
export class JsonDatabase implements Database {
  users: Collection<User>;
  projects: Collection<Project>;
  videos: Collection<Video>;
  videoAnalyses: Collection<VideoAnalysis>;
  transcripts: Collection<Transcript>;
  candidates: Collection<ClipCandidate>;
  clips: Collection<Clip>;
  qualityReviews: Collection<QualityReview>;
  jobs: Collection<ProcessingJob>;
  analytics: Collection<Analytics>;
  templates: Collection<Template>;
  settings: Collection<UserSettings>;

  constructor(dir: string) {
    this.users = new JsonCollection<User>(dir, "users");
    this.projects = new JsonCollection<Project>(dir, "projects");
    this.videos = new JsonCollection<Video>(dir, "videos");
    this.videoAnalyses = new JsonCollection<VideoAnalysis>(dir, "video_analyses");
    this.transcripts = new JsonCollection<Transcript>(dir, "transcripts");
    this.candidates = new JsonCollection<ClipCandidate>(dir, "candidates");
    this.clips = new JsonCollection<Clip>(dir, "clips");
    this.qualityReviews = new JsonCollection<QualityReview>(dir, "quality_reviews");
    this.jobs = new JsonCollection<ProcessingJob>(dir, "jobs");
    this.analytics = new JsonCollection<Analytics>(dir, "analytics");
    this.templates = new JsonCollection<Template>(dir, "templates");
    this.settings = new JsonCollection<UserSettings>(dir, "settings");
  }
}
