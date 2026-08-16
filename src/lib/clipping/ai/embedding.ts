/**
 * Embedding providers turn text into vectors so we can measure how similar two
 * clip candidates are (used for duplicate removal and diversity selection).
 *
 * The default {@link HashingEmbeddingProvider} is fully deterministic and
 * offline: it needs no API key, so the whole pipeline runs anywhere. A real
 * hosted embedding model can be dropped in by implementing the same interface
 * (see {@link OpenAIEmbeddingProvider}).
 */
export interface EmbeddingProvider {
  readonly name: string;
  embed(texts: string[]): Promise<number[][]>;
}

const STOP_WORDS = new Set(
  "a an the and or but if then of to in on for with as at by from is are was were be been being it its this that these those i you he she they we me him her them us my your his their our".split(
    " ",
  ),
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/** FNV-1a hash → stable bucket index. */
function hashToken(token: string, dim: number): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h) % dim;
}

/**
 * Hashed bag-of-words embeddings, L2-normalised. Cosine similarity between two
 * of these vectors is a good, cheap proxy for "are these two clips about the
 * same thing?". Deterministic and dependency-free.
 */
export class HashingEmbeddingProvider implements EmbeddingProvider {
  readonly name = "hashing-local";
  constructor(private readonly dim = 256) {}

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.embedOne(text));
  }

  private embedOne(text: string): number[] {
    const vec = new Array<number>(this.dim).fill(0);
    const tokens = tokenize(text);
    for (const tok of tokens) {
      vec[hashToken(tok, this.dim)] += 1;
      // Add adjacent-bigram signal so word order matters a little.
    }
    for (let i = 0; i + 1 < tokens.length; i++) {
      const bigram = `${tokens[i]}_${tokens[i + 1]}`;
      vec[hashToken(bigram, this.dim)] += 0.5;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}

/** Real hosted embeddings via OpenAI. Only used when an API key is configured. */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai";
  constructor(
    private readonly apiKey: string,
    private readonly model = "text-embedding-3-small",
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI embeddings failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { data: { embedding: number[] }[] };
    return json.data.map((d) => d.embedding);
  }
}

/** Cosine similarity of two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
