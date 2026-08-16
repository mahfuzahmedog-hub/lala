"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/** Minimal GET-and-cache hook with reload + optional polling. */
export function useFetch<T>(url: string | null, pollMs?: number): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    api
      .get<T>(url)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url, tick]);

  useEffect(() => {
    if (!url || !pollMs) return;
    const id = setInterval(() => setTick((t) => t + 1), pollMs);
    return () => clearInterval(id);
  }, [url, pollMs]);

  return { data, error, loading, reload };
}
