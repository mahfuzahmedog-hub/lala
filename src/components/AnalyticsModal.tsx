"use client";

import { useAppStore } from "@/lib/store";
import { X, BarChart3, Cpu, Coins, TrendingUp, Zap, PieChart } from "lucide-react";
import { motion } from "framer-motion";

export function AnalyticsModal({ onClose }: { onClose: () => void }) {
  const { analytics } = useAppStore();

  const stats = [
    { label: "Neural Tokens", value: analytics.tokensUsed.toLocaleString(), icon: <Coins size={20} />, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Compute Time", value: `${analytics.computeSeconds}s`, icon: <Cpu size={20} />, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Active Deployments", value: analytics.buildCount, icon: <Zap size={20} />, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 shadow-inner">
              <BarChart3 size={24} />
            </div>
            <div>
              <h2 className="font-black text-2xl text-white leading-tight uppercase tracking-tighter italic font-serif">Usage & Analytics</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mt-1">Resource Consumption</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-600 hover:text-white transition-colors bg-[#111] rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="p-10 space-y-10">
          <div className="grid grid-cols-3 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-3xl space-y-4 hover:border-gray-700 transition-all group">
                <div className={`p-3 ${s.bg} ${s.color} rounded-2xl w-fit group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-xl font-black text-white tracking-tighter italic">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Infrastructure Load</h3>
            <div className="h-40 bg-[#0d0d0d] border border-[#1a1a1a] rounded-[2rem] relative overflow-hidden flex items-end p-8 gap-4">
               {[40, 70, 45, 90, 65, 80, 55, 30, 95, 60].map((h, i) => (
                 <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05, duration: 1, ease: "circOut" }}
                    className="flex-1 bg-gradient-to-t from-blue-600/20 to-blue-500/60 rounded-full min-w-[8px]"
                 />
               ))}
               <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          <div className="p-8 bg-[#111] border border-[#1a1a1a] rounded-3xl flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl">
                    <TrendingUp size={20} />
                </div>
                <div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Efficiency Rating</h4>
                    <p className="text-[10px] text-gray-500 font-bold mt-1">94.2% Optimization Target Reached</p>
                </div>
             </div>
             <div className="text-2xl font-black text-blue-500 italic tracking-tighter">
                A+
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
