"use client";

import { useChat } from "@ai-sdk/react";
import { Send, Sparkles, Loader2, FileCode, ChevronDown, Trash2, Image as ImageIcon, X, FileSearch, MessageSquare, Terminal, Activity, BrainCircuit, RotateCcw, Move, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { availableModels } from "@/lib/ai/providers";
import Image from "next/image";

export function ChatSidebar() {
  const {
    updateFile, deleteFile, renameFile, files, errors, setErrors,
    lastMaintenance, setLastMaintenance, resetProject,
    selectedModelId, selectedProvider, setModel, apiKeys, trackUsage
  } = useAppStore();

  const [images, setImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "logs">("chat");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, input, handleInputChange, handleSubmit, append, isLoading } = useChat({
    api: "/api/chat",
    body: {
      provider: selectedProvider,
      modelId: selectedModelId,
      apiKey: apiKeys[selectedProvider],
      images
    },
    onResponse: () => {
      setImages([]);
      // Track usage (simulated)
      trackUsage(Math.floor(Math.random() * 500) + 100, Math.floor(Math.random() * 5) + 2);
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
      if (toolCall.toolName === "rename_file") {
        const { oldPath, newPath } = toolCall.args as { oldPath: string, newPath: string };
        renameFile(oldPath, newPath);
        return { success: true, from: oldPath, to: newPath };
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
    setErrors([]);
  }, [errors, append, setErrors]);

  useEffect(() => {
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastMaintenance > SIX_HOURS) {
        setLastMaintenance(now);
        runSelfHealing("6-hour scheduled maintenance");
      }
    }, 60000);

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

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = e.target.value;
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      setModel(model.provider, modelId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-600 rounded shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Sparkles size={14} className="text-white" />
          </div>
          <h1 className="font-black text-[12px] tracking-tighter uppercase italic leading-none">VIBE<span className="text-blue-500">AGENT</span></h1>
        </div>
        <div className="flex items-center gap-2">
           <button
            onClick={() => {
              if (confirm("Reset project?")) resetProject();
            }}
            className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
          >
            <RotateCcw size={14} />
          </button>
          <div className="relative group/model">
            <div className="flex items-center gap-1.5 bg-[#141414] border border-[#1a1a1a] rounded-lg px-2 py-1 cursor-pointer hover:border-gray-600 transition-all">
               <BrainCircuit size={11} className="text-blue-400" />
               <select
                value={selectedModelId}
                onChange={handleModelChange}
                className="appearance-none bg-transparent text-[9px] text-gray-300 outline-none cursor-pointer pr-4 font-black uppercase tracking-widest"
               >
                 {availableModels.map(m => (
                   <option key={m.id} value={m.id}>{m.name}</option>
                 ))}
               </select>
               <ChevronDown size={8} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#1a1a1a] bg-[#050505]">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <MessageSquare size={12} />
          Chat
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'logs' ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <Terminal size={12} />
          Logs {toolLogs.length > 0 && `(${toolLogs.length})`}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-hide pb-40">
        {activeTab === "chat" ? (
          <>
            {messages.length === 0 && (
              <div className="space-y-8">
                 <div className="p-8 bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-blue-500/20 rounded-3xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-1000" />
                    <h3 className="text-[13px] font-black text-white mb-3 flex items-center gap-2 uppercase tracking-widest">
                      <Sparkles size={16} className="text-blue-400" />
                      Startup Engine
                    </h3>
                    <p className="text-[12px] text-gray-400 leading-relaxed font-medium">
                      Welcome to the corporate workspace. Describe your vision, upload your design, and let the agent architect your product.
                    </p>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-1">Initialization Protocols</p>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        "Build a high-converting SaaS landing page",
                        "Create a real-time crypto dashboard",
                        "Design an minimalist portfolio for an AI engineer",
                      ].map((suggest) => (
                        <button
                          key={suggest}
                          onClick={() => handleInputChange({ target: { value: suggest } } as unknown as React.ChangeEvent<HTMLTextAreaElement>)}
                          className="text-left p-4 rounded-2xl border border-[#1a1a1a] text-[11px] text-gray-500 hover:bg-[#0d0d0d] hover:text-white hover:border-gray-700 transition-all group active:scale-[0.98] font-bold"
                        >
                          <span className="opacity-30 group-hover:opacity-100 mr-2 text-blue-500 font-black">❯</span>
                          {suggest}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className="flex flex-col gap-4 group">
                <div className="flex items-center gap-3">
                  {m.role === "user" ? (
                    <div className="w-7 h-7 flex items-center justify-center bg-[#1a1a1a] border border-[#222] rounded-xl text-[10px] font-black text-gray-400 shadow-xl">
                      U
                    </div>
                  ) : (
                    <div className="w-7 h-7 flex items-center justify-center bg-blue-600 rounded-xl shadow-[0_4px_20px_rgba(37,99,235,0.3)] border border-blue-400/20">
                      <Sparkles size={14} className="text-white" />
                    </div>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-gray-400 transition-colors">
                    {m.role === "user" ? "Client" : "Architect"}
                  </span>
                </div>

                <div className={`text-[13px] leading-relaxed max-w-full overflow-hidden ${m.role === 'user' ? 'text-gray-300 px-1 font-medium' : 'text-gray-200 bg-[#0c0c0c]/80 border border-[#1a1a1a] p-5 rounded-3xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}>
                  {m.content && (
                    <div className="prose prose-invert prose-sm max-w-full prose-headings:text-white prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-strong:text-blue-400 prose-code:bg-[#1a1a1a] prose-code:p-1 prose-code:rounded-lg prose-pre:bg-[#050505] prose-pre:border prose-pre:border-[#1a1a1a] prose-pre:rounded-2xl">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  <div className="space-y-2 mt-6">
                    {m.toolInvocations?.map((toolInvocation) => {
                      const { toolCallId, toolName, state } = toolInvocation;

                      return (
                        <div key={toolCallId} className="flex items-center gap-3 p-3 bg-[#050505] border border-[#1a1a1a] rounded-2xl text-[10px] text-gray-500 font-bold font-mono shadow-sm group/tool border-l-4 border-l-transparent hover:border-l-blue-500 transition-all duration-300">
                          {toolName === "write_file" && <FileCode size={16} className="text-blue-500" />}
                          {toolName === "delete_file" && <Trash2 size={16} className="text-red-500" />}
                          {toolName === "read_project" && <FileSearch size={16} className="text-purple-500" />}
                          {toolName === "rename_file" && <Move size={16} className="text-orange-500" />}

                          <span className="group-hover/tool:text-gray-300 transition-colors uppercase tracking-widest">
                            {toolName === "write_file" ? `executing ${toolInvocation.args.path}` :
                             toolName === "delete_file" ? `purging ${toolInvocation.args.path}` :
                             toolName === "read_project" ? `indexing system` :
                             toolName === "rename_file" ? `moving ${toolInvocation.args.oldPath} -> ${toolInvocation.args.newPath}` :
                             `${toolName}...`}
                          </span>

                          {state === "result" ? (
                            <div className="ml-auto w-2 h-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                          ) : (
                            <Loader2 size={14} className="animate-spin ml-auto text-blue-500" />
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
          <div className="space-y-3 font-mono">
            {toolLogs.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-[#1a1a1a] rounded-3xl">
                <p className="text-[10px] text-gray-700 uppercase font-black tracking-widest">System Idle</p>
              </div>
            ) : (
              toolLogs.map((tool, i) => (
                <div key={i} className="p-4 bg-[#080808] border border-[#1a1a1a] rounded-2xl text-[10px] space-y-3 overflow-hidden shadow-inner">
                  <div className="flex items-center gap-3 text-gray-400">
                    <span className="text-blue-500 font-black">[{new Date().toLocaleTimeString()}]</span>
                    <span className="uppercase font-black tracking-[0.2em] text-[9px] text-gray-500">{tool.toolName}</span>
                    {tool.state === 'result' && <span className="text-green-500 ml-auto font-black text-[9px]">SUCCESS</span>}
                  </div>
                  <div className="p-3 bg-[#030303] rounded-xl border border-[#1a1a1a]">
                    <pre className="text-gray-500 whitespace-pre-wrap break-all leading-relaxed font-medium">
                      {JSON.stringify(tool.args, null, 2)}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-20 z-30">
        <div className="max-w-full mx-auto space-y-6">
          {images.length > 0 && (
            <div className="flex gap-3 flex-wrap bg-[#0d0d0d]/80 backdrop-blur-xl p-3 rounded-3xl border border-[#1a1a1a] shadow-2xl animate-in zoom-in-95">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <Image src={img} width={80} height={80} className="w-20 h-20 object-cover rounded-2xl border-2 border-[#1a1a1a] group-hover:border-blue-500 transition-all duration-500" alt="Context" />
                  <button
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 shadow-xl hover:bg-red-500 transition-all active:scale-90"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="absolute -top-10 left-2 flex items-center gap-3">
               {isLoading && (
                 <div className="flex items-center gap-2.5 px-4 py-1.5 bg-blue-600 rounded-full shadow-[0_10px_30px_rgba(37,99,235,0.3)] border border-blue-400/30 animate-pulse">
                    <Loader2 size={12} className="animate-spin text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Architecting</span>
                 </div>
               )}
               {errors.length > 0 && (
                 <button
                    onClick={() => runSelfHealing("System exceptions detected")}
                    className="flex items-center gap-2.5 px-4 py-1.5 bg-red-600 rounded-full shadow-[0_10px_30px_rgba(220,38,38,0.3)] border border-red-400/30 animate-bounce group"
                 >
                    <Activity size={12} className="text-white group-hover:rotate-180 transition-all duration-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Sanitize System ({errors.length})</span>
                 </button>
               )}
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500/5 blur-3xl group-focus-within:bg-blue-500/10 transition-all duration-1000 rounded-3xl" />
              <textarea
                value={input}
                onChange={handleInputChange}
                rows={2}
                placeholder="Direct the architect..."
                className="w-full bg-[#111]/90 backdrop-blur-2xl border border-[#1a1a1a] rounded-[2rem] p-6 pr-28 text-[14px] font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 resize-none placeholder:text-gray-700 transition-all shadow-[0_10px_50px_rgba(0,0,0,0.5)] relative z-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                  }
                }}
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-3 z-20">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-600 hover:text-blue-400 hover:bg-blue-500/5 rounded-2xl transition-all active:scale-95"
                  title="Contextual Input"
                >
                  <ImageIcon size={22} />
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
                  className="p-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1a1a1a] disabled:text-gray-800 text-white rounded-2xl transition-all shadow-[0_10px_20px_rgba(37,99,235,0.2)] active:scale-90 flex items-center justify-center group/send"
                >
                  <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                </button>
              </div>
            </div>
          </form>
          <div className="flex justify-between items-center px-4 pb-2 opacity-50 font-black text-[8px] uppercase tracking-[0.5em] text-gray-700">
             <div className="flex items-center gap-2">
                <Zap size={10} className="text-blue-500" />
                <span>VibeCode Core 2.0</span>
             </div>
             <span>Status: Optimized</span>
          </div>
        </div>
      </div>
    </div>
  );
}
