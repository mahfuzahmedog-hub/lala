"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AIProvider } from "./ai/providers";

interface SettingsState {
  apiKeys: Record<AIProvider, string>;
  selectedModelId: string;
  selectedProvider: AIProvider;
  setApiKey: (provider: AIProvider, key: string) => void;
  setModel: (provider: AIProvider, modelId: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKeys: {
        openai: "",
        anthropic: "",
        google: "",
        mistral: "",
      },
      selectedModelId: "gemini-1.5-pro-latest",
      selectedProvider: "google",
      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),
      setModel: (provider, modelId) =>
        set({ selectedProvider: provider, selectedModelId: modelId }),
    }),
    {
      name: "vibecode-settings",
    }
  )
);
