import { getContext } from "@/lib/clipping/context";
import { promises as fs } from "node:fs";

const CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  ass: "text/plain; charset=utf-8",
  json: "application/json",
};

function contentTypeFor(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

/**
 * Serve a stored media object by key, with HTTP Range support so browsers can
 * seek within rendered clips and source videos. The `key` segment is URL-
 * encoded (see StorageProvider.publicPath).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);
  const ctx = await getContext();
  if (!(await ctx.storage.exists(key))) {
    return new Response("Not found", { status: 404 });
  }
  const path = await ctx.storage.localPath(key);
  const stat = await fs.stat(path);
  const total = stat.size;
  const contentType = contentTypeFor(key);
  const range = req.headers.get("range");

  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    const start = match ? Number(match[1]) : 0;
    const end = match && match[2] ? Number(match[2]) : total - 1;
    const chunk = await fs.readFile(path);
    const slice = chunk.subarray(start, end + 1);
    return new Response(slice, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(slice.byteLength),
      },
    });
  }

  const data = await fs.readFile(path);
  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(total),
      "Accept-Ranges": "bytes",
    },
  });
}
