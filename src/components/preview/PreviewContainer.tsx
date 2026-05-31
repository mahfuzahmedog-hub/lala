"use client";

import { useAppStore } from "@/lib/store";
import { Monitor } from "lucide-react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackConsole,
} from "@codesandbox/sandpack-react";
import { useState, useEffect } from "react";

export function PreviewContainer() {
  const store = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const files = mounted ? store.files : {};
  const [activeTab, setActiveTab] = useState<"preview" | "console">("preview");

  if (!mounted) return <div className="flex-1 bg-[#0a0a0a]" />;

  const sandpackFiles: Record<string, string> = {};
  Object.entries(files).forEach(([path, content]) => {
    const sandpackPath = path.startsWith("/") ? path.slice(1) : path;
    sandpackFiles[sandpackPath] = content;
  });

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="h-12 border-b border-[#1a1a1a] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Monitor size={14} />
            Preview
          </button>
          <button
            onClick={() => setActiveTab("console")}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'console' ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Console
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white m-4 rounded-2xl overflow-hidden shadow-2xl relative border border-[#1a1a1a]">
        <SandpackProvider
          template="react"
          theme="dark"
          files={sandpackFiles}
          options={{
            externalResources: ["https://cdn.tailwindcss.com"],
          }}
        >
          <SandpackLayout className="h-full border-none">
            {activeTab === "preview" ? (
              <SandpackPreview
                className="h-full"
                showNavigator={false}
                showRefreshButton={true}
              />
            ) : (
              <div className="h-full bg-[#050505] p-4 font-mono text-xs">
                <SandpackConsole />
              </div>
            )}
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}
