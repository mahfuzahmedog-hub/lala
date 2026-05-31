"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GitHubSettings {
  token: string;
  repo: string;
  owner: string;
  branch: string;
}

interface GitHubState {
  settings: GitHubSettings;
  setSettings: (settings: Partial<GitHubSettings>) => void;
}

export const useGitHubStore = create<GitHubState>()(
  persist(
    (set) => ({
      settings: {
        token: "",
        repo: "",
        owner: "",
        branch: "main",
      },
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: "vibecode-github",
    }
  )
);
