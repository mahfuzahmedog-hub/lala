import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Object storage abstraction. Originals, thumbnails, intermediate media, and
 * rendered clips are all addressed by an opaque `key`. FFmpeg needs real file
 * paths, so the interface exposes `localPath` (a readable path, downloading
 * first for remote backends) alongside the usual byte-level operations.
 *
 * Swapping this for an S3-backed provider (build rule #3) means implementing
 * the same methods: `localPath` would download to a cache dir, and
 * `writeFromFile` would upload.
 */
export interface StorageProvider {
  /** Persist raw bytes under `key`. */
  write(key: string, data: Buffer): Promise<void>;
  /** Persist a file already on disk (e.g. an FFmpeg output) under `key`. */
  writeFromFile(key: string, srcPath: string): Promise<void>;
  /** Read the full contents of `key`. */
  read(key: string): Promise<Buffer>;
  /** A local, readable filesystem path for `key` (downloads first if remote). */
  localPath(key: string): Promise<string>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  /** A relative URL path used by the media-serving API route. */
  publicPath(key: string): string;
}

/** Stores objects on the local filesystem under a base directory. */
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly baseDir: string) {}

  private resolve(key: string): string {
    // Prevent path traversal outside of the storage root.
    const clean = path
      .normalize(key)
      .replace(/^(\.\.(\/|\\|$))+/, "")
      .replace(/^[/\\]+/, "");
    return path.join(this.baseDir, clean);
  }

  async write(key: string, data: Buffer): Promise<void> {
    const dest = this.resolve(key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, data);
  }

  async writeFromFile(key: string, srcPath: string): Promise<void> {
    const dest = this.resolve(key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(srcPath, dest);
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async localPath(key: string): Promise<string> {
    return this.resolve(key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true });
  }

  publicPath(key: string): string {
    return `/api/media/${encodeURIComponent(key)}`;
  }
}
