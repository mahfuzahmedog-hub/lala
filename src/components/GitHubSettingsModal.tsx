"use client";

import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { X, ExternalLink, Loader2, CheckCircle, Database } from "lucide-react";

export function GitHubSettingsModal({ onClose }: { onClose: () => void }) {
  const store = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const github = mounted ? store.github : { token: "", owner: "", repo: "", branch: "main" };
  const { setGitHubSettings } = store;

  const [formData, setFormData] = useState(github);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleSave = () => {
    setStatus("saving");
    setGitHubSettings(formData);
    setTimeout(() => {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    }, 800);
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500 shadow-inner">
              <Database size={24} />
            </div>
            <div>
              <h2 className="font-black text-xl text-white leading-tight uppercase tracking-tighter italic font-serif">Vibe Storage</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mt-1">Remote Infrastructure</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-600 hover:text-white transition-colors bg-[#111] rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-3 group">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] group-focus-within:text-purple-500 transition-colors">Access Token</label>
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-bold"
              >
                GENERATE <ExternalLink size={8} />
              </a>
            </div>
            <input
              type="password"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/40 transition-all font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3 group">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 group-focus-within:text-purple-500 transition-colors">Namespace</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="username"
                className="w-full bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/40 transition-all font-bold tracking-tight"
              />
            </div>
            <div className="space-y-3 group">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 group-focus-within:text-purple-500 transition-colors">Repository</label>
              <input
                type="text"
                value={formData.repo}
                onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
                placeholder="repo-name"
                className="w-full bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/40 transition-all font-bold tracking-tight"
              />
            </div>
          </div>

          <div className="space-y-3 group">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 group-focus-within:text-purple-500 transition-colors">Active Branch</label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="main"
              className="w-full bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/40 transition-all font-mono"
            />
          </div>
        </div>

        <div className="p-8 bg-[#080808] border-t border-[#1a1a1a] flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={status !== "idle"}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(147,51,234,0.2)] min-w-[140px] flex items-center justify-center gap-2 active:scale-95 disabled:bg-[#1a1a1a] disabled:text-gray-700"
          >
            {status === "saving" ? <Loader2 size={16} className="animate-spin" /> :
             status === "saved" ? <CheckCircle size={16} /> : "Establish Sync"}
          </button>
        </div>
      </div>
    </div>
  );
}
