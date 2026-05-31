"use client";

import Editor from "@monaco-editor/react";
import { FileCode, ChevronRight, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";

export function EditorContainer() {
  const store = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const files = mounted ? store.files : {};
  const activeFile = mounted ? store.activeFile : "";
  const { updateFile, setActiveFile, deleteFile } = store;

  const content = files[activeFile] || "";

  // Get filename from path
  const fileName = activeFile.split("/").pop();

  if (!mounted) return <div className="flex-1 bg-[#050505]" />;

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      {/* File Tabs */}
      <div className="h-12 border-b border-[#1a1a1a] flex items-center bg-[#0a0a0a] px-2 overflow-x-auto no-scrollbar gap-1">
        {Object.keys(files).filter(path => !path.endsWith('.css')).map((path) => (
          <div
            key={path}
            className={`group flex items-center gap-2 px-4 py-2 rounded-t-xl text-[11px] font-black transition-all border-x border-t cursor-pointer relative min-w-[120px] max-w-[200px] ${
              activeFile === path
                ? "bg-[#050505] text-blue-400 border-[#1a1a1a] translate-y-[1px] z-10 shadow-[0_-4px_15px_rgba(0,0,0,0.5)]"
                : "text-gray-500 hover:text-gray-300 hover:bg-[#111] border-transparent"
            }`}
            onClick={() => setActiveFile(path)}
          >
            <FileCode size={12} className={activeFile === path ? "text-blue-500" : "text-gray-600"} />
            <span className="tracking-tighter truncate uppercase italic">{path.split("/").pop()}</span>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(path);
                }}
                className={`ml-auto p-1 hover:bg-red-500/10 hover:text-red-500 rounded-md transition-all ${activeFile === path ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
                <X size={10} />
            </button>

            {activeFile === path && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </div>
        ))}
      </div>

      {/* Editor Path / Breadcrumbs */}
      <div className="h-10 border-b border-[#1a1a1a] flex items-center px-8 bg-[#050505]/50 backdrop-blur-md">
        <div className="flex items-center gap-3 text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">
          <span className="text-blue-500/50 hover:text-blue-500 transition-colors cursor-pointer">ROOT</span>
          {activeFile.split("/").filter(Boolean).map((part, i, arr) => (
            <div key={i} className="flex items-center gap-3">
              <ChevronRight size={10} className="text-gray-800" />
              <span className={i === arr.length - 1 ? "text-gray-200" : "hover:text-gray-300 cursor-pointer transition-colors"}>{part}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language={fileName?.endsWith(".tsx") || fileName?.endsWith(".jsx") ? "typescript" : "css"}
          theme="vs-dark"
          value={content}
          onChange={(value) => updateFile(activeFile, value || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            padding: { top: 30, bottom: 30 },
            fontFamily: "var(--font-geist-mono)",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "all",
            backgroundColor: "#050505",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            contextmenu: true,
            fixedOverflowWidgets: true,
            roundedSelection: true,
            scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden'
            }
          } as any}
        />
        <div className="absolute bottom-6 right-6 p-4 bg-[#0a0a0a]/80 backdrop-blur-md border border-[#1a1a1a] rounded-2xl flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-gray-500 shadow-2xl z-20 pointer-events-none border-l-4 border-l-blue-500">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Live Sync
             </div>
             <div className="w-[1px] h-3 bg-[#1a1a1a]" />
             <span>UTF-8</span>
             <div className="w-[1px] h-3 bg-[#1a1a1a]" />
             <span>TypeScript JSX</span>
        </div>
      </div>
    </div>
  );
}
