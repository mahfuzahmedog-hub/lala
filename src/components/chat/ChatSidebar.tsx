"use client";

import { useChat } from "ai/react";
import { Send, Sparkles, User, Loader2, FileCode, ChevronDown, Trash2, RotateCcw, Image as ImageIcon, X, ListChecks, FileSearch, MessageSquare, Terminal, Activity } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef, useState, useCallback } from "react";
import { useProjectStore } from "@/lib/store";

export function ChatSidebar() {
  const { updateFile, deleteFile, resetProject, files, errors, setErrors, lastMaintenance, setLastMaintenance } = useProjectStore();
  const [provider, setProvider] = useState("google");
  const [images, setImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "logs">("chat");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, input, handleInputChange, handleSubmit, append, isLoading } = useChat({
    api: "/api/chat",
    body: { provider, images },
    onResponse: () => {
      setImages([]);
    },
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName === "write_file") {
        const { path, content } = toolCall.args as { path: string; content: string };
        updateFile(path, content);
        return { success: true, path };
      }
      if (toolCall.toolName === "delete_file") {
        const { path } = toolCall.args as { path: string };
        deleteFile(path);
        return { success: true, path };
      }
      if (toolCall.toolName === "read_project") {
        return { files: Object.entries(files).map(([path, content]) => ({ path, content })) };
      }
    },
  });

  const runSelfHealing = useCallback(async (reason: string) => {
    const prompt = `[SELF-HEALING SYSTEM TRIGGERED]
    Reason: ${reason}
    Current Errors: ${errors.length > 0 ? errors.join(", ") : "None detected, performing general maintenance."}

    Task: Scan the project, identify any bugs, potential improvements, or outdated code, and fix them.`;

    append({
      role: 'user',
      content: prompt,
    });
    setErrors([]); // Reset errors after triggering fix
  }, [errors, append, setErrors]);

  // Check for 6-hour maintenance
  useEffect(() => {
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastMaintenance > SIX_HOURS) {
        setLastMaintenance(now);
        runSelfHealing("6-hour scheduled maintenance");
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastMaintenance, setLastMaintenance, runSelfHealing]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    }
  };

  const toolLogs = messages.flatMap(m => m.toolInvocations || []);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-600 rounded">
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="font-black text-sm tracking-tighter uppercase italic">VIBE<span className="text-blue-500">AGENT</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button
             onClick={() => runSelfHealing("Manual health check")}
             className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition-all"
             title="Run Health Check"
          >
            <Activity size={14} />
          </button>
          <button
            onClick={() => {
              if (confirm("Reset agent memory and project?")) {
                resetProject();
                window.location.reload();
              }
            }}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
            title="Reset Agent"
          >
            <RotateCcw size={14} />
          </button>
          <div className="relative">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="appearance-none bg-[#141414] text-[10px] text-gray-400 outline-none border border-[#1a1a1a] rounded-md px-2 py-1 pr-6 cursor-pointer hover:border-gray-700 transition-colors"
            >
              <option value="google">Gemini 1.5 Pro</option>
              <option value="anthropic">Claude 3.5 Sonnet</option>
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600" />
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#1a1a1a] bg-[#050505]">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <MessageSquare size={12} />
          Chat
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <Terminal size={12} />
          Agent Logs {toolLogs.length > 0 && `(${toolLogs.length})`}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide pb-32">
        {activeTab === "chat" ? (
          <>
            {messages.length === 0 && (
              <div className="space-y-6">
                 <div className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl shadow-xl shadow-blue-500/5">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-blue-400" />
                      Agentic Mode Enabled
                    </h3>
                    <p className="text-xs text-blue-300/80 leading-relaxed">
                      I can now see images, plan complex architectures, and manage your entire codebase. <b>Self-healing</b> is active and runs every 6 hours.
                    </p>
                 </div>

                 <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Quick Starts</p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        "Build a modern SaaS landing page",
                        "Create a dashboard with interactive charts",
                        "Design a minimalist crypto wallet UI",
                        "Replicate this design (upload image)"
                      ].map((suggest) => (
                        <button
                          key={suggest}
                          onClick={() => handleInputChange({ target: { value: suggest } } as any)}
                          className="text-left p-3 rounded-xl border border-[#1a1a1a] text-[11px] text-gray-400 hover:bg-[#111] hover:text-white hover:border-gray-700 transition-all group active:scale-[0.98]"
                        >
                          <span className="opacity-50 group-hover:opacity-100 mr-2">/</span>
                          {suggest}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className="flex flex-col gap-3 group">
                <div className="flex items-center gap-2">
                  {m.role === "user" ? (
                    <div className="w-6 h-6 flex items-center justify-center bg-[#1a1a1a] border border-[#222] rounded-lg text-[10px] font-bold text-gray-400">
                      U
                    </div>
                  ) : (
                    <div className="w-6 h-6 flex items-center justify-center bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                      <Sparkles size={14} className="text-white" />
                    </div>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 group-hover:text-gray-400 transition-colors">
                    {m.role === "user" ? "Human" : "Agent"}
                  </span>
                </div>

                <div className={`text-sm leading-relaxed max-w-full overflow-hidden ${m.role === 'user' ? 'text-gray-300' : 'text-gray-200 bg-[#0c0c0c] border border-[#1a1a1a] p-4 rounded-2xl shadow-inner'}`}>
                  {m.content && (
                    <div className="prose prose-invert prose-sm max-w-full prose-headings:text-white prose-strong:text-blue-400 prose-code:bg-[#1a1a1a] prose-code:p-1 prose-code:rounded prose-pre:bg-[#050505] prose-pre:border prose-pre:border-[#1a1a1a]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  <div className="space-y-1.5 mt-4">
                    {m.toolInvocations?.map((toolInvocation) => {
                      const { toolCallId, toolName, state } = toolInvocation;

                      return (
                        <div key={toolCallId} className="flex items-center gap-3 p-2 bg-[#050505] border border-[#1a1a1a] rounded-xl text-[10px] text-gray-500 font-mono shadow-sm group/tool">
                          {toolName === "write_file" && <FileCode size={14} className="text-blue-500" />}
                          {toolName === "delete_file" && <Trash2 size={14} className="text-red-500" />}
                          {toolName === "read_project" && <FileSearch size={14} className="text-purple-500" />}

                          <span className="group-hover/tool:text-gray-300 transition-colors">
                            {toolName === "write_file" ? `writing ${toolInvocation.args.path}` :
                             toolName === "delete_file" ? `removing ${toolInvocation.args.path}` :
                             toolName === "read_project" ? `scanning codebase` :
                             `${toolName}...`}
                          </span>

                          {state === "result" ? (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                          ) : (
                            <Loader2 size={12} className="animate-spin ml-auto text-blue-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="space-y-2 font-mono">
            {toolLogs.length === 0 ? (
              <p className="text-[10px] text-gray-600 italic">No agent activity logged yet...</p>
            ) : (
              toolLogs.map((tool, i) => (
                <div key={i} className="p-3 bg-[#050505] border border-[#1a1a1a] rounded-xl text-[10px] space-y-2 overflow-hidden">
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-purple-500 font-bold">[{new Date().toLocaleTimeString()}]</span>
                    <span className="uppercase font-black tracking-widest text-[9px]">{tool.toolName}</span>
                    {tool.state === 'result' && <span className="text-green-500 ml-auto">SUCCESS</span>}
                  </div>
                  <pre className="text-gray-600 whitespace-pre-wrap break-all">
                    {JSON.stringify(tool.args, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-12 z-30">
        <div className="max-w-full mx-auto space-y-4">
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap bg-[#111] p-2 rounded-2xl border border-[#1a1a1a] shadow-2xl">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} className="w-16 h-16 object-cover rounded-xl border border-[#222]" alt="Upload preview" />
                  <button
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-500 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="absolute -top-8 left-2 flex items-center gap-2">
               {isLoading && (
                 <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-full shadow-lg shadow-blue-600/20 animate-pulse">
                    <Loader2 size={10} className="animate-spin text-white" />
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">Agent Thinking</span>
                 </div>
               )}
               {errors.length > 0 && (
                 <button
                    onClick={() => runSelfHealing("Console errors detected")}
                    className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full shadow-lg shadow-red-600/20 animate-bounce"
                 >
                    <Activity size={10} className="text-white" />
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">Fix {errors.length} Errors</span>
                 </button>
               )}
            </div>

            <textarea
              value={input}
              onChange={handleInputChange}
              rows={2}
              placeholder="Give me a goal..."
              className="w-full bg-[#141414]/80 backdrop-blur-xl border border-[#1a1a1a] rounded-2xl p-4 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 resize-none placeholder:text-gray-700 transition-all shadow-2xl"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
            <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-200 hover:bg-[#222] rounded-xl transition-all"
                title="Add Image"
              >
                <ImageIcon size={20} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && images.length === 0)}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1a1a1a] disabled:text-gray-700 text-white rounded-xl transition-all shadow-xl shadow-blue-600/10 active:scale-95 flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
          <p className="text-[9px] text-center text-gray-600 uppercase tracking-[0.3em] font-bold pb-2">
             VibeCode Workspace 1.0
          </p>
        </div>
      </div>
    </div>
  );
}
