"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProjectFile {
  name: string;
  content: string;
  language: string;
}

interface ProjectState {
  files: Record<string, string>;
  activeFile: string;
  errors: string[];
  lastMaintenance: number;
  setFiles: (files: Record<string, string>) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  setErrors: (errors: string[]) => void;
  addError: (error: string) => void;
  setLastMaintenance: (time: number) => void;
  resetProject: () => void;
}

const initialFiles = {
  "/App.tsx": `import React from 'react';

export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold underline">
        Hello VibeCode!
      </h1>
      <p className="mt-4 text-gray-600">
        Start editing to see the magic happen.
      </p>
    </div>
  );
}`,
  "/index.tsx": `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
  "/styles.css": `@tailwind base;
@tailwind components;
@tailwind utilities;`,
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      files: initialFiles,
      activeFile: "/App.tsx",
      errors: [],
      lastMaintenance: Date.now(),
      setFiles: (files) => set({ files }),
      updateFile: (path, content) =>
        set((state) => ({
          files: { ...state.files, [path]: content }
        })),
      deleteFile: (path) =>
        set((state) => {
          const newFiles = { ...state.files };
          delete newFiles[path];
          const newActive = state.activeFile === path ? Object.keys(newFiles)[0] : state.activeFile;
          return { files: newFiles, activeFile: newActive };
        }),
      setActiveFile: (path) => set({ activeFile: path }),
      setErrors: (errors) => set({ errors }),
      addError: (error) => set((state) => ({ errors: [...state.errors, error].slice(-10) })), // Keep last 10
      setLastMaintenance: (time) => set({ lastMaintenance: time }),
      resetProject: () => set({ files: initialFiles, activeFile: "/App.tsx", errors: [] }),
    }),
    {
      name: "vibecode-storage",
    }
  )
);
