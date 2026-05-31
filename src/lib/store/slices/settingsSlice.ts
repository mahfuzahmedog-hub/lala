"use client";

import { StateCreator } from "zustand";
import { AIProvider } from "../../ai/providers";

interface GitHubSettings {
  token: string;
  repo: string;
  owner: string;
  branch: string;
}

interface DeploymentSettings {
  vercelToken: string;
  netlifyToken: string;
  provider: "vercel" | "netlify" | "none";
}

interface Analytics {
  tokensUsed: number;
  computeSeconds: number;
  buildCount: number;
}

export interface SettingsSlice {
  apiKeys: Record<AIProvider, string>;
  selectedModelId: string;
  selectedProvider: AIProvider;
  github: GitHubSettings;
  deployment: DeploymentSettings;
  analytics: Analytics;

  setApiKey: (provider: AIProvider, key: string) => void;
  setModel: (provider: AIProvider, modelId: string) => void;
  setGitHubSettings: (settings: Partial<GitHubSettings>) => void;
  setDeploymentSettings: (settings: Partial<DeploymentSettings>) => void;
  trackUsage: (tokens: number, seconds: number) => void;
  incrementBuilds: () => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  apiKeys: {
    openai: "",
    anthropic: "",
    google: "",
    mistral: "",
  },
  selectedModelId: "gemini-1.5-pro-latest",
  selectedProvider: "google",
  github: {
    token: "",
    repo: "",
    owner: "",
    branch: "main",
  },
  deployment: {
    vercelToken: "",
    netlifyToken: "",
    provider: "none",
  },
  analytics: {
    tokensUsed: 0,
    computeSeconds: 0,
    buildCount: 0,
  },

  setApiKey: (provider, key) =>
    set((state) => ({
      apiKeys: { ...state.apiKeys, [provider]: key },
    })),
  setModel: (provider, modelId) =>
    set({ selectedProvider: provider, selectedModelId: modelId }),
  setGitHubSettings: (newSettings) =>
    set((state) => ({
      github: { ...state.github, ...newSettings },
    })),
  setDeploymentSettings: (newSettings) =>
    set((state) => ({
      deployment: { ...state.deployment, ...newSettings },
    })),
  trackUsage: (tokens, seconds) =>
    set((state) => ({
        analytics: {
            ...state.analytics,
            tokensUsed: state.analytics.tokensUsed + tokens,
            computeSeconds: state.analytics.computeSeconds + seconds
        }
    })),
  incrementBuilds: () =>
    set((state) => ({
        analytics: {
            ...state.analytics,
            buildCount: state.analytics.buildCount + 1
        }
    })),
});
