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
 * A tiny repository interface over a single collection of records that carry an
 * `id`. Implementations must persist writes durably. Keeping this interface
 * narrow is what lets us swap the file-backed JSON store for Postgres later
 * without touching pipeline or API code (build rule #3).
 */
export interface Collection<T extends { id: string }> {
  get(id: string): Promise<T | null>;
  list(predicate?: (item: T) => boolean): Promise<T[]>;
  create(item: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  upsert(item: T): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * The full application data access surface. Every pipeline stage and API route
 * talks to the database exclusively through this interface.
 */
export interface Database {
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
}
