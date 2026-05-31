import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { createAI } from "ai/rsc";

export type ModelProvider = "google" | "anthropic";

export const providers = {
  google: {
    model: google("gemini-1.5-pro-latest"),
    name: "Gemini 1.5 Pro",
  },
  anthropic: {
    model: anthropic("claude-3-5-sonnet-20240620"),
    name: "Claude 3.5 Sonnet",
  },
};
