"use client";

import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { X, ExternalLink, Loader2, CheckCircle, Shield, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { AIProvider } from "@/lib/ai/providers";

export function AISettingsModal({ onClose }: { onClose: () => void }) {
  const store = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const apiKeys = mounted ? store.apiKeys : { google: "", anthropic: "", openai: "", mistral: "" };
  const { setApiKey } = store;

  const [formData, setFormData] = useState(apiKeys);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleSave = () => {
    setStatus("saving");
    (Object.entries(formData) as [AIProvider, string][]).forEach(([provider, key]) => {
      setApiKey(provider, key);
    });
    setTimeout(() => {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    }, 800);
  };

  const providers: { id: AIProvider; name: string; url: string }[] = [
    { id: "openai", name: "OpenAI", url: "https://platform.openai.com/api-keys" },
    { id: "anthropic", name: "Anthropic", url: "https://console.anthropic.com/settings/keys" },
    { id: "google", name: "Google Gemini", url: "https://aistudio.google.com/app/apikey" },
    { id: "mistral", name: "Mistral AI", url: "https://console.mistral.ai/api-keys/" },
  ];

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shadow-inner">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="font-black text-xl text-white leading-tight uppercase tracking-tighter italic">Security Center</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mt-1">Intelligence Nodes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-600 hover:text-white transition-colors bg-[#111] rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
          <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />
            <div className="flex gap-3">
                <AlertTriangle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-emerald-200/60 leading-relaxed font-bold uppercase tracking-widest">
                  Encryption active: Keys are stored in your local session. No server-side persistence.
                </p>
            </div>
          </div>

          {providers.map((p) => (
            <div key={p.id} className="space-y-3 group">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] group-focus-within:text-blue-500 transition-colors">{p.name} Nexus</label>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-bold">
                  AUTH <ExternalLink size={8} />
                </a>
              </div>
              <div className="relative group/input">
                <input
                    type={showKeys[p.id] ? "text" : "password"}
                    value={formData[p.id]}
                    onChange={(e) => setFormData({ ...formData, [p.id]: e.target.value })}
                    placeholder={`Connect to ${p.name}...`}
                    className="w-full bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 pr-12 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all font-mono"
                />
                <button
                    onClick={() => setShowKeys({ ...showKeys, [p.id]: !showKeys[p.id] })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-400 transition-colors"
                >
                    {showKeys[p.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-[#080808] border-t border-[#1a1a1a] flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
          >
            Abort
          </button>
          <button
            onClick={handleSave}
            disabled={status !== "idle"}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(37,99,235,0.25)] min-w-[140px] flex items-center justify-center gap-2 active:scale-95 disabled:bg-[#1a1a1a] disabled:text-gray-700"
          >
            {status === "saving" ? <Loader2 size={16} className="animate-spin" /> :
             status === "saved" ? <CheckCircle size={16} /> : "Update Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
