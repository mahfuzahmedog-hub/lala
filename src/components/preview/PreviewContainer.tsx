"use client";

import { Monitor, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  useSandpack
} from "@codesandbox/sandpack-react";
import { useProjectStore } from "@/lib/store";

function SandpackSync({ files }: { files: Record<string, string> }) {
  const { sandpack } = useSandpack();

  // This is a bit tricky because sandpack doesn't always expose a direct way to update all files
  // But we can pass files to the provider
  return null;
}

export function PreviewContainer() {
  const { files } = useProjectStore();

  // Map our files to Sandpack format (remove leading slash if necessary)
  const sandpackFiles: Record<string, string> = {};
  Object.entries(files).forEach(([path, content]) => {
    const sandpackPath = path.startsWith("/") ? path.slice(1) : path;
    sandpackFiles[sandpackPath] = content;
  });

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="h-9 border-b border-[#1a1a1a] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-400">Live Preview</span>
        </div>
      </div>

      <div className="flex-1 bg-white m-4 rounded-lg overflow-hidden shadow-2xl relative">
        <SandpackProvider
          template="react"
          theme="dark"
          files={sandpackFiles}
          options={{
            externalResources: ["https://cdn.tailwindcss.com"],
          }}
        >
          <SandpackLayout className="h-full border-none">
            <SandpackPreview
              className="h-full"
              showNavigator={false}
              showRefreshButton={true}
              actionsChildren={
                <button className="p-1 hover:bg-gray-800 rounded">
                  <RefreshCw size={14} />
                </button>
              }
            />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}
