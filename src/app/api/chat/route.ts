import { streamText, tool, CoreMessage } from "ai";
import { z } from "zod";
import { getModel, AIProvider } from "@/lib/ai/providers";

export const maxDuration = 60;

export async function POST(req: Request) {
  const {
    messages,
    provider = "google",
    modelId = "gemini-1.5-pro-latest",
    apiKey,
    images = []
  } = await req.json();

  const model = getModel(provider as AIProvider, modelId, apiKey);

  // Process multi-modal messages for the last user message
  const processedMessages: CoreMessage[] = messages.map((m: CoreMessage, idx: number) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: model as any,
    messages: processedMessages,
    system: `You are VibeCode Agent, an elite AI software engineer with autonomous self-healing capabilities.

AGENT CORE PRINCIPLES:
- THINK: Analyze user requests and design images.
- PLAN: Output a clear plan before using tools.
- EXECUTE: Build high-quality React/Tailwind apps.
- SELF-HEAL: You will occasionally be triggered by the system to perform "Maintenance" or "Fix Errors".
  When this happens:
  1. Scan the project using 'read_project'.
  2. Analyze any provided error logs.
  3. Proactively fix bugs, optimize performance, and update code patterns.

TECHNICAL STACK:
- Framework: React (via Sandpack)
- Styling: Tailwind CSS
- Icons: Lucide React

TOOL GUIDELINES:
- write_file: Full file content required.
- delete_file: Remove obsolete files.
- read_project: Use frequently for context.
- All paths start with /.

Remember: You are autonomous. If you see a bug, fix it. If you see an improvement, make it.`,
    tools: {
      write_file: tool({
        description: 'Create or overwrite a file.',
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
        execute: async () => ({ success: true }),
      }),
    },
  });

  return result.toDataStreamResponse();
}
