import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, CoreMessage } from "ai";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, provider = "google", images = [] } = await req.json();

  const model = (provider === "anthropic"
    ? anthropic("claude-3-5-sonnet-20240620")
    : google("gemini-1.5-pro-latest")) as any;

  // Process multi-modal messages for the last user message
  const processedMessages: CoreMessage[] = messages.map((m: any, idx: number) => {
    if (m.role === 'user' && idx === messages.length - 1 && images.length > 0) {
      return {
        role: 'user',
        content: [
          { type: 'text', text: m.content },
          ...images.map((img: string) => ({
            type: 'image',
            image: img.split(',')[1],
          })),
        ],
      };
    }
    return m;
  });

  const result = await streamText({
    model,
    messages: processedMessages,
    system: `You are VibeCode Agent, an elite AI software engineer. You don't just write code; you build complete, high-quality products.

AGENT CORE PRINCIPLES:
- THINK: Always analyze the user's request deeply. If an image is provided, examine it like a frontend expert.
- PLAN: For any non-trivial task, output a clear, numbered plan in Markdown before touching any tools.
- EXECUTE: Implement the plan step-by-step. Ensure each file is complete and correct.
- REVISE: If you find a better way during execution, update the user.

TECHNICAL STACK:
- Framework: React (via Sandpack)
- Styling: Tailwind CSS (directives in /styles.css, classes in components)
- Icons: Lucide React
- Components: Modern, functional, accessible.

TOOL GUIDELINES:
- write_file: Use for creating/updating. Always provide the FULL file content.
- delete_file: Use to remove obsolete files.
- read_project: Use this at the start of a session or when you need full context to understand how everything fits together.
- All paths MUST start with / (e.g., /App.tsx).

Remember: You are the developer. Take initiative. Suggest improvements. Build the 'vibe'.`,
    tools: {
      write_file: tool({
        description: 'Create or overwrite a file with full content.',
        parameters: z.object({
          path: z.string().describe('Path starting with /'),
          content: z.string().describe('Full file content'),
        }),
        execute: async ({ path }) => ({ success: true, path }),
      }),
      delete_file: tool({
        description: 'Delete a file.',
        parameters: z.object({
          path: z.string().describe('Path starting with /'),
        }),
        execute: async ({ path }) => ({ success: true, path }),
      }),
      read_project: tool({
        description: 'Get full context of all files in the project.',
        parameters: z.object({}),
        execute: async () => ({ success: true }), // Handled client-side
      }),
    },
  });

  return result.toDataStreamResponse();
}
