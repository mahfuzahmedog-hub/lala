import type { ContentType } from "../types";

/**
 * Very lightweight content-type detection from transcript vocabulary. Each type
 * has a set of indicative keywords; the type with the strongest keyword density
 * wins. This is intentionally a heuristic — a hosted LLM classifier could be
 * swapped in behind the same function signature.
 */
const KEYWORDS: Record<Exclude<ContentType, "unknown">, string[]> = {
  podcast: ["welcome back", "episode", "guest", "sponsor", "listeners", "podcast"],
  interview: ["question", "tell me about", "you mentioned", "your career", "how did you"],
  gaming: ["game", "level", "boss", "player", "loot", "respawn", "gg", "stream"],
  sports: ["match", "score", "goal", "team", "coach", "season", "playoff", "championship"],
  education: ["learn", "concept", "theorem", "definition", "example", "lecture", "study"],
  comedy: ["joke", "funny", "laugh", "hilarious", "comedy", "kidding"],
  reaction: ["react", "reaction", "oh my", "no way", "watch this", "wait what"],
  tutorial: ["step", "how to", "first", "next", "install", "click", "tutorial", "setup"],
  vlog: ["today", "my day", "vlog", "morning routine", "come with me", "we're here"],
  documentary: ["history", "in the year", "discovered", "century", "civilization"],
  business: ["revenue", "market", "startup", "customers", "growth", "strategy", "profit"],
  news: ["breaking", "reported", "officials", "according to", "sources", "update"],
};

export interface ContentTypeResult {
  contentType: ContentType;
  confidence: number;
}

export function detectContentType(text: string): ContentTypeResult {
  const lower = ` ${text.toLowerCase()} `;
  const wordCount = Math.max(1, text.split(/\s+/).length);
  let best: ContentType = "unknown";
  let bestHits = 0;

  for (const [type, keywords] of Object.entries(KEYWORDS) as [
    Exclude<ContentType, "unknown">,
    string[],
  ][]) {
    let hits = 0;
    for (const kw of keywords) {
      const needle = ` ${kw} `;
      let idx = lower.indexOf(needle);
      while (idx !== -1) {
        hits++;
        idx = lower.indexOf(needle, idx + 1);
      }
    }
    if (hits > bestHits) {
      bestHits = hits;
      best = type;
    }
  }

  // Confidence scales with keyword density but is capped; unknown if no hits.
  const confidence = bestHits === 0 ? 0 : Math.min(0.95, (bestHits / wordCount) * 40 + 0.3);
  return { contentType: best, confidence };
}

/**
 * Per-content-type weighting of candidate signals. Values multiply the base
 * signal weights during ranking so, e.g., comedy rewards payoff/rewatch while
 * education rewards setup/story.
 */
export function contentTypeWeights(type: ContentType): Partial<Record<string, number>> {
  switch (type) {
    case "comedy":
    case "reaction":
      return { payoff: 1.4, emotionalIntensity: 1.3, rewatchPotential: 1.3, hookStrength: 1.2 };
    case "education":
    case "tutorial":
      return { setup: 1.3, storyQuality: 1.2, contextIndependence: 1.3, payoff: 1.1 };
    case "podcast":
    case "interview":
      return { hookStrength: 1.3, curiosity: 1.3, storyQuality: 1.2, tension: 1.1 };
    case "sports":
    case "gaming":
      return { audioIntensity: 1.3, visualInterest: 1.3, emotionalIntensity: 1.2 };
    case "business":
    case "news":
      return { curiosity: 1.3, contextIndependence: 1.2, hookStrength: 1.2 };
    default:
      return {};
  }
}
