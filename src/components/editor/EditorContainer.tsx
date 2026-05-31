"use client";

import Editor from "@monaco-editor/react";
import { FileCode, ChevronRight } from "lucide-react";
import { useProjectStore } from "@/lib/store";

export function EditorContainer() {
  const { files, activeFile, updateFile, setActiveFile } = useProjectStore();
  const content = files[activeFile] || "";

  // Get filename from path
  const fileName = activeFile.split("/").pop();

  return (
    <div className="flex flex-col h-full">
      {/* File Tabs */}
      <div className="h-9 border-b border-[#1a1a1a] flex items-center bg-[#0a0a0a] px-2 overflow-x-auto no-scrollbar">
        {Object.keys(files).map((path) => (
          <button
            key={path}
            onClick={() => setActiveFile(path)}
            className={`flex items-center gap-2 px-3 py-1.5 border-r border-[#1a1a1a] text-xs font-medium transition-colors ${
              activeFile === path
                ? "bg-[#141414] text-blue-400 border-t border-t-blue-500"
                : "text-gray-500 hover:text-gray-300 hover:bg-[#111]"
            }`}
          >
            <FileCode size={14} />
            <span>{path.split("/").pop()}</span>
          </button>
        ))}
      </div>

      {/* Editor Path */}
      <div className="h-7 border-b border-[#1a1a1a] flex items-center px-4 bg-[#0a0a0a]">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
          {activeFile.split("/").filter(Boolean).map((part, i, arr) => (
            <div key={i} className="flex items-center gap-1">
              <span>{part}</span>
              {i < arr.length - 1 && <ChevronRight size={10} />}
            </div>
          ))}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={fileName?.endsWith(".tsx") || fileName?.endsWith(".jsx") ? "typescript" : "css"}
          theme="vs-dark"
          value={content}
          onChange={(value) => updateFile(activeFile, value || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 16 },
            fontFamily: "var(--font-geist-mono)",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "all",
          }}
        />
      </div>
    </div>
  );
}
