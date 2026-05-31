"use client";

import { useState } from "react";
import { useGitHubStore } from "@/lib/github-store";
import { X, Github, ExternalLink, Loader2, CheckCircle } from "lucide-react";

export function GitHubSettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, setSettings } = useGitHubStore();
  const [formData, setFormData] = useState(settings);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleSave = () => {
    setStatus("saving");
    setSettings(formData);
    setTimeout(() => {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1a1a1a] rounded-xl text-gray-400">
              <Github size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white leading-tight">GitHub Settings</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">Cloud Persistence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Personal Access Token</label>
            <input
              type="password"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
            >
              Create a token with &apos;repo&apos; scope <ExternalLink size={10} />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Repo Owner</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="username"
                className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Repo Name</label>
              <input
                type="text"
                value={formData.repo}
                onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
                placeholder="my-cool-project"
                className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Branch</label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="main"
              className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>
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
             status === "saved" ? <CheckCircle size={16} /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
