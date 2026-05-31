"use client";

import { useState } from "react";
import { useSettingsStore } from "@/lib/settings-store";
import { X, Key, ExternalLink, Loader2, CheckCircle, Shield } from "lucide-react";
import { AIProvider } from "@/lib/ai/providers";

export function AISettingsModal({ onClose }: { onClose: () => void }) {
  const { apiKeys, setApiKey } = useSettingsStore();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white leading-tight">AI Settings</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">Provider Keys</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
          <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-4">
            <p className="text-[11px] text-yellow-200/70 leading-relaxed">
              Keys are stored locally in your browser. They are only sent to the server for the current request.
            </p>
          </div>

          {providers.map((p) => (
            <div key={p.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{p.name} API Key</label>
                <a href={p.url} target="_blank" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1">
                  Get Key <ExternalLink size={8} />
                </a>
              </div>
              <input
                type="password"
                value={formData[p.id]}
                onChange={(e) => setFormData({ ...formData, [p.id]: e.target.value })}
                placeholder={`Enter your ${p.name} key`}
                className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
          ))}
        </div>

        <div className="p-6 bg-[#111]/50 border-t border-[#1a1a1a] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={status !== "idle"}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg min-w-[100px] flex items-center justify-center gap-2"
          >
            {status === "saving" ? <Loader2 size={16} className="animate-spin" /> :
             status === "saved" ? <CheckCircle size={16} /> : "Save Keys"}
          </button>
        </div>
      </div>
    </div>
  );
}
