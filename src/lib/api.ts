"use client";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(url: string) => fetch(url, { cache: "no-store" }).then((r) => handle<T>(r)),
  post: <T>(url: string, body?: unknown) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => handle<T>(r)),
  patch: <T>(url: string, body: unknown) =>
    fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => handle<T>(r)),
  put: <T>(url: string, body: unknown) =>
    fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => handle<T>(r)),
  upload: <T>(url: string, form: FormData) =>
    fetch(url, { method: "POST", body: form }).then((r) => handle<T>(r)),
};

export const mediaUrl = (key: string) => `/api/media/${encodeURIComponent(key)}`;
