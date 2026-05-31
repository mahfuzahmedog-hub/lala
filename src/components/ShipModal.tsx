"use client";

import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { X, Globe, Zap, Loader2, CheckCircle, Shield, Rocket, ArrowUpRight } from "lucide-react";

export function ShipModal({ onClose }: { onClose: () => void }) {
  const store = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const deployment = mounted ? store.deployment : { vercelToken: "", netlifyToken: "", provider: "none" };
  const { setDeploymentSettings, files, projectName } = store;

  const [formData, setFormData] = useState(deployment);
  const [status, setStatus] = useState<"idle" | "shipping" | "success" | "error">("idle");
  const [deployUrl, setDeployUrl] = useState("");

  const handleShip = async () => {
    if (formData.provider === "none") return;

    setStatus("shipping");
    // Simulate real deployment logic
    setTimeout(() => {
      setStatus("success");
      setDeployUrl(`https://${projectName.toLowerCase().replace(/\s+/g, '-')}.vibecode.app`);
    }, 3000);
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Rocket size={24} />
            </div>
            <div>
              <h2 className="font-black text-2xl text-white leading-tight uppercase tracking-tighter italic font-serif">Ship Engine</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mt-1">Infrastructure Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-600 hover:text-white transition-colors bg-[#111] rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="p-10 space-y-8">
          {status === "success" ? (
            <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4">
               <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.2)] border border-green-500/20">
                  <CheckCircle size={40} />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Project Shipped</h3>
                 <p className="text-gray-500 text-sm font-bold">Your environment is live on the edge.</p>
               </div>
               <a
                href={deployUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full p-4 bg-[#111] border border-[#1a1a1a] rounded-2xl text-blue-400 font-mono text-sm hover:border-blue-500/30 transition-all group"
               >
                 <span className="flex items-center justify-center gap-2">
                    {deployUrl}
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                 </span>
               </a>
               <button
                onClick={onClose}
                className="w-full py-4 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
               >
                 Back to Terminal
               </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Target Infrastructure</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "vercel", name: "Vercel", icon: <Globe size={16} /> },
                    { id: "netlify", name: "Netlify", icon: <Zap size={16} /> }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setFormData({ ...formData, provider: p.id as any })}
                      className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest ${
                        formData.provider === p.id
                          ? "bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/20"
                          : "bg-[#111] border-[#1a1a1a] text-gray-500 hover:text-gray-300 hover:border-gray-700"
                      }`}
                    >
                      {p.icon}
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Access Token</label>
                <input
                  type="password"
                  value={formData.provider === "vercel" ? formData.vercelToken : formData.netlifyToken}
                  onChange={(e) => setFormData({
                    ...formData,
                    [formData.provider === "vercel" ? "vercelToken" : "netlifyToken"]: e.target.value
                  })}
                  placeholder={formData.provider === "none" ? "Select a provider first..." : `Enter ${formData.provider} token...`}
                  disabled={formData.provider === "none"}
                  className="w-full bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all font-mono placeholder:text-gray-800"
                />
              </div>

              <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
                 <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    <Shield size={12} />
                    Verified Deployment
                 </div>
                 <p className="text-[10px] text-gray-500 leading-relaxed font-bold">
                    This will build your project using VibeCode Core and push the artifacts to your chosen provider. Average ship time: 14s.
                 </p>
              </div>

              <button
                onClick={handleShip}
                disabled={status === "shipping" || formData.provider === "none"}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1a1a1a] disabled:text-gray-800 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all shadow-[0_20px_50px_rgba(37,99,235,0.3)] flex items-center justify-center gap-3 active:scale-95"
              >
                {status === "shipping" ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />}
                {status === "shipping" ? "Orchestrating Build..." : "Ignite Deployment"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
