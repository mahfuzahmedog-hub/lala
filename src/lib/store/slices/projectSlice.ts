"use client";

import { StateCreator } from "zustand";

export interface Project {
  id: string;
  name: string;
  files: Record<string, string>;
  activeFile: string;
  lastModified: number;
}

export interface ProjectSlice {
  projects: Record<string, Project>;
  currentProjectId: string;
  errors: string[];
  lastMaintenance: number;

  // Computed
  files: Record<string, string>;
  activeFile: string;
  projectName: string;

  // Actions
  setProjects: (projects: Record<string, Project>) => void;
  setCurrentProject: (id: string) => void;
  createProject: (name: string) => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;

  setFiles: (files: Record<string, string>) => void;
  updateFile: (path: string, content: string) => void;
  createFile: (path: string, content?: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  setActiveFile: (path: string) => void;

  addError: (error: string) => void;
  setErrors: (errors: string[]) => void;
  setLastMaintenance: (time: number) => void;
  resetProject: () => void;
}

const initialFiles = {
  "/App.tsx": `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-12 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-5xl font-black tracking-tighter italic">
          VIBE<span className="text-blue-500">CODE</span>
        </h1>
        <p className="text-xl text-gray-400 leading-relaxed">
          Welcome to your new autonomous workspace. The agent is ready to build with you.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl hover:border-blue-500/50 transition-colors group">
            <h3 className="font-bold mb-2 group-hover:text-blue-400 transition-colors">Autonomous</h3>
            <p className="text-sm text-gray-500">Self-healing codebase active.</p>
          </div>
          <div className="p-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl hover:border-purple-500/50 transition-colors group">
            <h3 className="font-bold mb-2 group-hover:text-purple-400 transition-colors">Agentic</h3>
            <p className="text-sm text-gray-500">Multi-modal vision support.</p>
          </div>
        </div>
      </div>
    </div>
  );
}`,
  "/index.tsx": `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(<StrictMode><App /></StrictMode>);`,
  "/styles.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  background: #050505;
}`,
};

const DEFAULT_PROJECT_ID = "default-vibe";

export const createProjectSlice: StateCreator<ProjectSlice> = (set, get) => ({
  projects: {
    [DEFAULT_PROJECT_ID]: {
      id: DEFAULT_PROJECT_ID,
      name: "vibe-startup-v1",
      files: initialFiles,
      activeFile: "/App.tsx",
      lastModified: Date.now(),
    }
  },
  currentProjectId: DEFAULT_PROJECT_ID,
  errors: [],
  lastMaintenance: Date.now(),

  // Computed getters
  get files() {
    const state = get() as any;
    if (!state || !state.projects) return initialFiles;
    return state.projects[state.currentProjectId]?.files || {};
  },
  get activeFile() {
    const state = get() as any;
    if (!state || !state.projects) return "/App.tsx";
    return state.projects[state.currentProjectId]?.activeFile || "";
  },
  get projectName() {
    const state = get() as any;
    if (!state || !state.projects) return "vibe-startup-v1";
    return state.projects[state.currentProjectId]?.name || "";
  },

  setProjects: (projects) => set({ projects }),
  setCurrentProject: (id) => set({ currentProjectId: id }),

  createProject: (name) => {
    const id = `vibe-${Date.now()}`;
    const newProject = {
        id,
        name,
        files: initialFiles,
        activeFile: "/App.tsx",
        lastModified: Date.now(),
    };
    set((state) => ({
      projects: { ...state.projects, [id]: newProject },
      currentProjectId: id
    }));
    // Sync to server
    fetch("/api/projects", { method: "POST", body: JSON.stringify({ id, project: newProject }) });
  },

  deleteProject: (id) => {
    set((state) => {
        const newProjects = { ...state.projects };
        delete newProjects[id];
        let nextId = state.currentProjectId;
        if (id === state.currentProjectId) {
            nextId = Object.keys(newProjects)[0] || "";
        }
        return { projects: newProjects, currentProjectId: nextId };
    });
    fetch("/api/projects", { method: "DELETE", body: JSON.stringify({ id }) });
  },

  renameProject: (id, name) => set((state) => {
    const updated = { ...state.projects[id], name, lastModified: Date.now() };
    fetch("/api/projects", { method: "POST", body: JSON.stringify({ id, project: updated }) });
    return {
        projects: { ...state.projects, [id]: updated }
    };
  }),

  setFiles: (files) => set((state) => {
    const updated = {
        ...state.projects[state.currentProjectId],
        files,
        lastModified: Date.now()
    };
    fetch("/api/projects", { method: "POST", body: JSON.stringify({ id: state.currentProjectId, project: updated }) });
    return {
        projects: { ...state.projects, [state.currentProjectId]: updated }
    };
  }),

  updateFile: (path, content) => set((state) => {
    const project = state.projects[state.currentProjectId];
    const updated = {
        ...project,
        files: { ...project.files, [path]: content },
        lastModified: Date.now()
    };
    fetch("/api/projects", { method: "POST", body: JSON.stringify({ id: state.currentProjectId, project: updated }) });
    return {
        projects: { ...state.projects, [state.currentProjectId]: updated }
    };
  }),

  createFile: (path, content = "") => set((state) => {
    const project = state.projects[state.currentProjectId];
    const updated = {
        ...project,
        files: { ...project.files, [path]: content },
        activeFile: path,
        lastModified: Date.now()
    };
    fetch("/api/projects", { method: "POST", body: JSON.stringify({ id: state.currentProjectId, project: updated }) });
    return {
        projects: { ...state.projects, [state.currentProjectId]: updated }
    };
  }),

  deleteFile: (path) => set((state) => {
    const project = state.projects[state.currentProjectId];
    const newFiles = { ...project.files };
    delete newFiles[path];
    const newActive = project.activeFile === path ? Object.keys(newFiles)[0] : project.activeFile;
    const updated = {
        ...project,
        files: newFiles,
        activeFile: newActive,
        lastModified: Date.now()
    };
    fetch("/api/projects", { method: "POST", body: JSON.stringify({ id: state.currentProjectId, project: updated }) });
    return {
      projects: { ...state.projects, [state.currentProjectId]: updated }
    };
  }),

  renameFile: (oldPath, newPath) => set((state) => {
    const project = state.projects[state.currentProjectId];
    const content = project.files[oldPath];
    const newFiles = { ...project.files };
    delete newFiles[oldPath];
    newFiles[newPath] = content;
    const newActive = project.activeFile === oldPath ? newPath : project.activeFile;
    const updated = {
        ...project,
        files: newFiles,
        activeFile: newActive,
        lastModified: Date.now()
    };
    fetch("/api/projects", { method: "POST", body: JSON.stringify({ id: state.currentProjectId, project: updated }) });
    return {
      projects: { ...state.projects, [state.currentProjectId]: updated }
    };
  }),

  setActiveFile: (path) => set((state) => ({
    projects: {
      ...state.projects,
      [state.currentProjectId]: {
        ...state.projects[state.currentProjectId],
        activeFile: path
      }
    }
  })),

  addError: (error) => set((state) => ({ errors: [...state.errors, error].slice(-10) })),
  setErrors: (errors) => set({ errors }),
  setLastMaintenance: (time) => set({ lastMaintenance: time }),
  resetProject: () => set((state) => {
    const updated = {
        ...state.projects[state.currentProjectId],
        files: initialFiles,
        activeFile: "/App.tsx",
        lastModified: Date.now()
    };
    fetch("/api/projects", { method: "POST", body: JSON.stringify({ id: state.currentProjectId, project: updated }) });
    return {
        projects: { ...state.projects, [state.currentProjectId]: updated },
        errors: []
    };
  }),
});
