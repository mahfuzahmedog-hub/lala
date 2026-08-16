/**
 * Core domain types for the AI Clipping Bot.
 *
 * These mirror the data models named in the build specification. They are the
 * single source of truth shared by the persistence layer, the processing
 * pipeline, the HTTP API, and the UI. Keeping them in one place makes it easy
 * to reason about what state each pipeline stage reads and writes.
 */

export type Id = string;

// ---------------------------------------------------------------------------
// Enums / unions
// ---------------------------------------------------------------------------

export type AspectRatio = "9:16" | "1:1" | "16:9";

export const ASPECT_RATIOS: AspectRatio[] = ["9:16", "1:1", "16:9"];

/**
 * The high-level content type of a source video. Ranking priorities are tuned
 * per content type (see `intelligence/contentType.ts`).
 */
export type ContentType =
  | "podcast"
  | "interview"
  | "gaming"
  | "sports"
  | "education"
  | "comedy"
  | "reaction"
  | "tutorial"
  | "vlog"
  | "documentary"
  | "business"
  | "news"
  | "unknown";

export type JobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * The ordered pipeline stages. The orchestrator persists which stages are done
 * so that processing is resumable and expensive stages are never re-run
 * unnecessarily (build rules #5 and #6).
 */
export type StageName =
  | "probe"
  | "transcription"
  | "speaker_detection"
  | "scene_detection"
  | "audio_analysis"
  | "visual_analysis"
  | "semantic_understanding"
  | "candidate_discovery"
  | "candidate_ranking"
  | "duplicate_removal"
  | "diversity_selection"
  | "boundary_optimization"
  | "hook_optimization"
  | "auto_reframe"
  | "captions"
  | "render"
  | "quality_critic"
  | "finalize";

export const STAGE_ORDER: StageName[] = [
  "probe",
  "transcription",
  "speaker_detection",
  "scene_detection",
  "audio_analysis",
  "visual_analysis",
  "semantic_understanding",
  "candidate_discovery",
  "candidate_ranking",
  "duplicate_removal",
  "diversity_selection",
  "boundary_optimization",
  "hook_optimization",
  "auto_reframe",
  "captions",
  "render",
  "quality_critic",
  "finalize",
];

export type ClipStatus =
  | "pending"
  | "rendering"
  | "rendered"
  | "accepted"
  | "reedit"
  | "rejected"
  | "exported";

export type QualityVerdict = "accept" | "reedit" | "reject";

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export interface User {
  id: Id;
  email: string;
  name: string;
  createdAt: string;
}

export interface Project {
  id: Id;
  userId: Id;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: Id;
  projectId: Id;
  filename: string;
  /** Storage key for the original upload (opaque to the app; resolved by the StorageProvider). */
  storageKey: string;
  sizeBytes: number;
  status: "uploaded" | "processing" | "ready" | "failed";
  createdAt: string;
  updatedAt: string;
  /** Populated by the probe stage. */
  durationSec?: number;
  width?: number;
  height?: number;
  fps?: number;
  videoCodec?: string;
  audioCodec?: string;
  hasAudio?: boolean;
  thumbnailKey?: string;
}

export interface TranscriptWord {
  word: string;
  start: number; // seconds
  end: number; // seconds
  speaker?: string;
  confidence?: number;
}

export interface Transcript {
  id: Id;
  videoId: Id;
  language: string;
  words: TranscriptWord[];
  /** Convenience: full text joined from words. */
  text: string;
  provider: string;
  createdAt: string;
}

export interface Speaker {
  id: string;
  label: string; // e.g. "Speaker 1"
  totalSpeakingSec: number;
}

export interface Scene {
  index: number;
  start: number;
  end: number;
  /** Scene-change score reported by the detector (higher = sharper cut). */
  score: number;
}

export interface AudioWindow {
  start: number;
  end: number;
  /** Mean loudness in this window, normalised to 0..1 across the video. */
  intensity: number;
}

export interface AudioAnalysis {
  meanVolumeDb: number;
  maxVolumeDb: number;
  windows: AudioWindow[];
  /** Windows detected as (near) silence, usable for silence trimming. */
  silences: { start: number; end: number }[];
}

export interface VisualWindow {
  start: number;
  end: number;
  /** Amount of motion/visual change in this window, normalised 0..1. */
  motion: number;
}

export interface VisualAnalysis {
  windows: VisualWindow[];
}

export interface VideoAnalysis {
  id: Id;
  videoId: Id;
  contentType: ContentType;
  contentTypeConfidence: number;
  speakers: Speaker[];
  scenes: Scene[];
  audio?: AudioAnalysis;
  visual?: VisualAnalysis;
  createdAt: string;
  updatedAt: string;
}

/**
 * The signals scored for every candidate window. Each value is normalised to
 * 0..1. This is the vocabulary from the spec's "Candidate Signals" section.
 */
export interface CandidateSignals {
  hookStrength: number;
  emotionalIntensity: number;
  curiosity: number;
  setup: number;
  tension: number;
  payoff: number;
  contextIndependence: number;
  storyQuality: number;
  visualInterest: number;
  audioIntensity: number;
  novelty: number;
  rewatchPotential: number;
}

export interface ClipCandidate {
  id: Id;
  videoId: Id;
  start: number;
  end: number;
  /** Transcript text covered by this candidate window. */
  text: string;
  signals: CandidateSignals;
  /** Weighted aggregate of `signals` in 0..100. */
  score: number;
  /** Deterministic embedding used for diversity/duplicate detection. */
  embedding: number[];
  /** Set true when removed as a near-duplicate of a higher-scoring candidate. */
  duplicateOf?: Id;
  /** Set true when chosen for the final diverse set. */
  selected: boolean;
  createdAt: string;
}

export interface Caption {
  start: number;
  end: number;
  text: string;
  words: TranscriptWord[];
}

export interface ClipVersion {
  version: number;
  storageKey?: string; // rendered mp4
  captionsKey?: string; // ASS/SRT sidecar
  aspectRatio: AspectRatio;
  start: number;
  end: number;
  notes?: string;
  qualityReviewId?: Id;
  createdAt: string;
}

export interface Clip {
  id: Id;
  videoId: Id;
  candidateId: Id;
  projectId: Id;
  title: string;
  /** Generated hook line shown as the opening caption. Never fabricated beyond source (rule #7). */
  hook: string;
  aspectRatio: AspectRatio;
  start: number;
  end: number;
  /** Horizontal reframe focus in 0..1 (0.5 = centered); set by auto-reframe. */
  focusX?: number;
  status: ClipStatus;
  currentVersion: number;
  versions: ClipVersion[];
  captions: Caption[];
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface QualityDimensionScore {
  name: string;
  score: number; // 0..100
  notes: string;
}

export interface QualityReview {
  id: Id;
  clipId: Id;
  version: number;
  overall: number; // 0..100
  verdict: QualityVerdict;
  dimensions: QualityDimensionScore[];
  /** When verdict === "reedit", the diagnosed problem to address on retry. */
  diagnosis?: string;
  createdAt: string;
}

export interface ProcessingJob {
  id: Id;
  videoId: Id;
  projectId: Id;
  status: JobStatus;
  currentStage: StageName;
  completedStages: StageName[];
  progress: number; // 0..1
  retryCount: number;
  error?: string;
  /** Per-stage error/audit log. */
  log: { at: string; stage: StageName; level: "info" | "warn" | "error"; message: string }[];
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface Analytics {
  id: Id;
  clipId: Id;
  views: number;
  likes: number;
  shares: number;
  watchThroughRate: number; // 0..1
  /** Quality score predicted at render time, kept to compare against actuals. */
  predictedScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CaptionPreset {
  id: string;
  name: string;
  fontName: string;
  fontSize: number;
  primaryColor: string; // hex
  highlightColor: string; // hex
  position: "bottom" | "center" | "top";
  uppercase: boolean;
  animate: boolean;
}

export interface Template {
  id: Id;
  name: string;
  aspectRatio: AspectRatio;
  captionPresetId: string;
}

export interface UserSettings {
  id: Id;
  userId: Id;
  transcriptionProvider: string;
  embeddingProvider: string;
  llmProvider: string;
  defaultAspectRatios: AspectRatio[];
  defaultCaptionPresetId: string;
  qualityAcceptThreshold: number;
  qualityRejectThreshold: number;
  maxReeditRetries: number;
  targetClipCount: number;
  minClipSec: number;
  maxClipSec: number;
}
