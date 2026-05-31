import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";

export type AIProvider = "openai" | "anthropic" | "google" | "mistral";

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
}

export const availableModels: AIModel[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
  { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet", provider: "anthropic" },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic" },
  { id: "gemini-1.5-pro-latest", name: "Gemini 1.5 Pro", provider: "google" },
  { id: "gemini-1.5-flash-latest", name: "Gemini 1.5 Flash", provider: "google" },
  { id: "mistral-large-latest", name: "Mistral Large", provider: "mistral" },
];

export function getModel(provider: AIProvider, modelId: string, apiKey?: string) {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })(modelId);
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelId);
    case "mistral":
      return createMistral({ apiKey })(modelId);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
