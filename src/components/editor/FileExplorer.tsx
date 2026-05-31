"use client";

import { useAppStore } from "@/lib/store";
import { Folder, File, ChevronRight, ChevronDown, Search, FolderPlus, FilePlus, Trash2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Node {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: Node[];
}

export function FileExplorer() {
  const store = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const files = mounted ? store.files : {};
  const activeFile = mounted ? store.activeFile : "";
  const { setActiveFile, deleteFile, createFile } = store;

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/"]));
  const [searchQuery, setSearchQuery] = useState("");

  const fileTree = useMemo(() => {
    if (!mounted) return [];
    const root: Node = { name: "root", path: "/", type: "folder", children: [] };

    Object.keys(files).forEach((path) => {
      const parts = path.split("/").filter(Boolean);
      let current = root;
      let currentPath = "";

      parts.forEach((part, i) => {
        currentPath += `/${part}`;
        const isLast = i === parts.length - 1;

        if (isLast) {
          current.children?.push({ name: part, path: currentPath, type: "file" });
        } else {
          let folder = current.children?.find(c => c.name === part && c.type === "folder");
          if (!folder) {
            folder = { name: part, path: currentPath, type: "folder", children: [] };
            current.children?.push(folder);
          }
          current = folder;
        }
      });
    });

    const sortNodes = (nodes: Node[]) => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    };

    const recursiveSort = (node: Node) => {
      if (node.children) {
        node.children = sortNodes(node.children);
        node.children.forEach(recursiveSort);
      }
    };

    recursiveSort(root);
    return root.children || [];
  }, [files, mounted]);

  const toggleFolder = (path: string) => {
    const next = new Set(expandedFolders);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpandedFolders(next);
  };

  const renderNode = (node: Node, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isActive = activeFile === node.path;

    if (searchQuery && node.type === 'file' && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return null;
    }

    return (
      <div key={node.path} className="select-none">
        <div
          className={`group flex items-center gap-2 py-1.5 px-3 cursor-pointer transition-all rounded-lg mx-1 ${
            isActive ? "bg-blue-500/10 text-blue-400 shadow-sm" : "hover:bg-[#111] text-gray-500 hover:text-gray-300"
          }`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={() => {
            if (node.type === "folder") toggleFolder(node.path);
            else setActiveFile(node.path);
          }}
        >
          <div className="w-4 flex items-center justify-center">
            {node.type === "folder" && (
              isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
            )}
          </div>
          {node.type === "folder" ? (
            <Folder size={14} className={isExpanded ? "text-blue-500/60" : "text-gray-600"} />
          ) : (
            <File size={14} className={isActive ? "text-blue-500" : "text-gray-700"} />
          )}
          <span className={`text-[11px] font-bold tracking-tight truncate ${isActive ? "font-black" : ""}`}>
            {node.name}
          </span>

          <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1">
             {node.type === 'file' && (
               <button
                onClick={(e) => {
                    e.stopPropagation();
                    if(confirm(`Delete ${node.name}?`)) deleteFile(node.path);
                }}
                className="p-1 hover:text-red-500 transition-colors"
               >
                 <Trash2 size={10} />
               </button>
             )}
          </div>
        </div>

        <AnimatePresence>
          {node.type === "folder" && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {node.children?.map(child => renderNode(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (!mounted) return <div className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a]" />;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-[#1a1a1a] w-64 shrink-0 overflow-hidden">
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]/50">
        <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Workspace</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
                const name = prompt("File name (e.g. /components/Header.tsx)");
                if(name) createFile(name.startsWith('/') ? name : `/${name}`);
            }}
            className="p-1.5 hover:bg-[#1a1a1a] rounded-md text-gray-500 hover:text-blue-400 transition-all"
            title="New File"
          >
            <FilePlus size={14} />
          </button>
          <button
            className="p-1.5 hover:bg-[#1a1a1a] rounded-md text-gray-500 hover:text-purple-400 transition-all"
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="relative group">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold text-gray-300 focus:outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {fileTree.map(node => renderNode(node))}
      </div>

      <div className="p-4 border-t border-[#1a1a1a] bg-[#050505]">
         <div className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Git: main</span>
         </div>
      </div>
    </div>
  );
}
