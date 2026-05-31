"use client";

import { useState } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { EditorContainer } from "@/components/editor/EditorContainer";
import { PreviewContainer } from "@/components/preview/PreviewContainer";
import { GitHubSettingsModal } from "@/components/GitHubSettingsModal";
import { AISettingsModal } from "@/components/AISettingsModal";
import { PanelLeft, PanelRight, Play, Github, Settings, Cloud, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGitHubStore } from "@/lib/github-store";
import { useProjectStore } from "@/lib/store";

export default function Home() {
  const [showPreview, setShowPreview] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "pushing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const { settings } = useGitHubStore();
  const { files } = useProjectStore();

  const handlePush = async () => {
    if (!settings.token || !settings.owner || !settings.repo) {
      setShowGitHubModal(true);
      return;
    }

    setPushStatus("pushing");
    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        body: JSON.stringify({
          ...settings,
          files,
          message: `VibeCode Sync: ${new Date().toLocaleString()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to push");

      setPushStatus("success");
      setTimeout(() => setPushStatus("idle"), 3000);
    } catch (err: unknown) {
      setPushStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unknown error occurred");
      setTimeout(() => setPushStatus("idle"), 5000);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#050505] text-gray-300 font-sans selection:bg-blue-500/30 text-[13px]">
      {/* Sidebar - Chat */}
      <AnimatePresence mode="popLayout">
        {showChat && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="h-full border-r border-[#1a1a1a] flex flex-col shrink-0 overflow-hidden shadow-2xl z-20"
          >
            <ChatSidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
        {/* Header/Toolbar */}
        <header className="h-14 border-b border-[#1a1a1a] flex items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-xl z-10 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-2 rounded-xl transition-all ${showChat ? "text-blue-400 bg-blue-400/10 shadow-inner" : "text-gray-500 hover:text-gray-300 hover:bg-[#111]"}`}
              >
                <PanelLeft size={18} />
              </button>
            </div>

            <div className="h-4 w-[1px] bg-[#1a1a1a]" />

            <div className="flex items-center gap-3 group">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)] animate-pulse" />
              <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-200 transition-colors tracking-tight">
                {settings.repo || "my-vibe-app"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center bg-[#0d0d0d] rounded-xl p-1 border border-[#1a1a1a] shadow-inner">
               <button
                  onClick={handlePush}
                  disabled={pushStatus === "pushing"}
                  className="flex items-center gap-2 px-4 py-1.5 bg-[#141414] hover:bg-[#1a1a1a] text-gray-300 hover:text-white rounded-lg text-[11px] font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
               >
                  {pushStatus === "pushing" ? <Loader2 size={14} className="animate-spin text-blue-400" /> :
                   pushStatus === "success" ? <CheckCircle2 size={14} className="text-green-400" /> :
                   pushStatus === "error" ? <AlertCircle size={14} className="text-red-400" /> :
                   <Cloud size={14} className="text-gray-400" />}
                  {pushStatus === "error" ? "Error" : pushStatus === "success" ? "Synced" : "Cloud Sync"}
               </button>
               <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-black transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] ml-1 active:scale-95 uppercase tracking-tighter">
                  <Play size={14} fill="currentColor" />
                  Ship
               </button>
             </div>

             <div className="h-4 w-[1px] bg-[#1a1a1a]" />

             <div className="flex items-center gap-1.5">
               <button
                onClick={() => setShowAIModal(true)}
                className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/5 rounded-xl transition-all"
                title="AI Settings"
               >
                  <Sparkles size={18} />
               </button>
               <button
                onClick={() => setShowGitHubModal(true)}
                className={`p-2 rounded-xl transition-all ${settings.token ? "text-purple-400 bg-purple-400/5" : "text-gray-500"} hover:text-purple-300 hover:bg-purple-400/10`}
                title="GitHub Settings"
               >
                  <Github size={18} />
               </button>
               <button className="p-2 text-gray-500 hover:text-gray-300 hover:bg-[#111] rounded-xl transition-all">
                  <Settings size={18} />
               </button>
               <button
                onClick={() => setShowPreview(!showPreview)}
                className={`p-2 rounded-xl transition-all ${showPreview ? "text-blue-400 bg-blue-400/10 shadow-inner" : "text-gray-500 hover:text-gray-300 hover:bg-[#111]"}`}
              >
                <PanelRight size={18} />
              </button>
             </div>
          </div>
        </header>

        {/* Editor & Preview Split */}
        <div className="flex-1 flex min-h-0 bg-[#050505]">
          <div className="flex-1 min-w-0 flex flex-col">
            <EditorContainer />
          </div>

          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "50%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="border-l border-[#1a1a1a] bg-[#050505] overflow-hidden shadow-2xl relative z-10"
              >
                 <PreviewContainer />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showGitHubModal && (
          <GitHubSettingsModal onClose={() => setShowGitHubModal(false)} />
        )}
        {showAIModal && (
          <AISettingsModal onClose={() => setShowAIModal(false)} />
        )}
      </AnimatePresence>

      {pushStatus === "error" && (
        <div className="fixed bottom-6 right-6 bg-red-950/90 border border-red-500/50 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl z-[100] max-w-sm animate-in slide-in-from-bottom-4 ring-1 ring-white/10">
           <div className="flex gap-4">
              <div className="p-2 bg-red-500/20 rounded-xl h-fit">
                <AlertCircle size={20} className="text-red-400 shrink-0" />
              </div>
              <div>
                <h4 className="text-[13px] font-black text-white leading-none uppercase tracking-widest">Sync Error</h4>
                <p className="text-[11px] text-red-200/70 mt-3 leading-relaxed font-medium">{errorMessage}</p>
              </div>
           </div>
        </div>
      )}
    </main>
  );
}
