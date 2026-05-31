"use client";

import { useAppStore } from "@/lib/store";
import { Folder, Plus, Trash2, Clock, Check, ChevronRight, Layout, Database, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const templates = [
  { id: "saas", name: "SaaS Platform", icon: <Layout size={18} />, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "ecom", name: "Modern Store", icon: <ShoppingCart size={18} />, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "crm", name: "Neural CRM", icon: <Database size={18} />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

export function ProjectDashboard({ onClose }: { onClose: () => void }) {
  const { projects, currentProjectId, setCurrentProject, createProject, deleteProject } = useAppStore();
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("saas");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    createProject(newProjectName);
    setNewProjectName("");
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[2.5rem] w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]/80">
          <div>
            <h2 className="font-black text-4xl text-white leading-tight uppercase tracking-tighter italic font-serif">Vibe Dashboard</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black mt-2">Managing your neural networks</p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#111] hover:bg-[#1a1a1a] text-gray-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
          >
            Close
          </button>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Sidebar / Actions */}
          <div className="w-96 border-r border-[#1a1a1a] p-10 space-y-10 bg-[#080808]/50 overflow-y-auto scrollbar-hide">
            <div className="space-y-6">
               <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Startup Protocols</h3>
               <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(37,99,235,0.2)] active:scale-95"
               >
                 <Plus size={16} />
                 New Project
               </button>
            </div>

            <div className="space-y-6">
               <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Vibe Templates</h3>
               <div className="space-y-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                        selectedTemplate === t.id ? "bg-white/5 border-white/10 shadow-xl" : "border-transparent hover:bg-white/5"
                      }`}
                    >
                      <div className={`p-3 rounded-xl transition-all ${t.bg} ${t.color} ${selectedTemplate === t.id ? "scale-110" : "group-hover:scale-105"}`}>
                        {t.icon}
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-widest ${selectedTemplate === t.id ? "text-white" : "text-gray-500 group-hover:text-gray-300"}`}>
                        {t.name}
                      </span>
                      {selectedTemplate === t.id && <Check size={14} className="ml-auto text-blue-500" />}
                    </button>
                  ))}
               </div>
            </div>

            <div className="p-8 bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-white/5 rounded-[2.5rem] space-y-4">
               <div className="p-3 bg-purple-500/10 rounded-2xl w-fit text-purple-400">
                  <Clock size={20} />
               </div>
               <p className="text-[11px] text-gray-400 leading-relaxed font-bold">
                 Total Environments: <span className="text-white font-black">{Object.keys(projects).length}</span>
               </p>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-1/3 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
               </div>
            </div>
          </div>

          {/* Project List */}
          <div className="flex-1 overflow-y-auto p-10 bg-[#0a0a0a] scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {isCreating && (
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleCreate}
                  className="mb-12 p-10 bg-[#111] border border-blue-500/20 rounded-[2.5rem] flex items-center gap-8 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
                  <div className="p-5 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20">
                    <Folder size={32} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] px-1">Initialization Code</label>
                    <input
                        autoFocus
                        placeholder="ENTER_ENV_NAME..."
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="w-full bg-transparent border-none text-2xl font-black uppercase tracking-tighter outline-none text-white placeholder:text-gray-800"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 text-gray-600 hover:text-white font-black text-[10px] uppercase tracking-widest">Abort</button>
                    <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20">Execute</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-6">
              {Object.values(projects).sort((a, b) => b.lastModified - a.lastModified).map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    setCurrentProject(project.id);
                    onClose();
                  }}
                  className={`group relative p-10 rounded-[2.5rem] border transition-all cursor-pointer flex items-center justify-between ${
                    currentProjectId === project.id
                      ? "bg-blue-500/5 border-blue-500/30 shadow-[0_20px_60px_rgba(37,99,235,0.1)]"
                      : "bg-[#0d0d0d] border-[#1a1a1a] hover:border-gray-700 hover:bg-[#111]"
                  }`}
                >
                  <div className="flex items-center gap-8">
                    <div className={`p-5 rounded-2xl transition-all duration-500 ${
                      currentProjectId === project.id ? "bg-blue-600 text-white shadow-2xl shadow-blue-500/40 scale-110" : "bg-[#1a1a1a] text-gray-600 group-hover:text-gray-400 group-hover:scale-105"
                    }`}>
                      <Database size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-4">
                        <h4 className="text-xl font-black text-white uppercase tracking-tight italic">{project.name}</h4>
                        {currentProjectId === project.id && (
                          <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-blue-500/20 shadow-inner">Operational</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-[0.2em]">
                        {Object.keys(project.files).length} Files • Sync Latency: 12ms • Updated {new Date(project.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Purge project ${project.name}?`)) deleteProject(project.id);
                      }}
                      className="p-4 text-gray-600 hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                    <div className="p-4 text-blue-500 bg-blue-500/5 rounded-2xl">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
