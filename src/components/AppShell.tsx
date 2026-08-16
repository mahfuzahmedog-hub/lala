"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Clapperboard,
  Film,
  FolderKanban,
  LayoutDashboard,
  ListVideo,
  Menu,
  Scissors,
  Settings,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/videos", label: "Videos", icon: Film },
  { href: "/processing", label: "Processing", icon: ListVideo },
  { href: "/candidates", label: "Candidates", icon: Sparkles },
  { href: "/clips", label: "Clips", icon: Clapperboard },
  { href: "/editor", label: "Editor", icon: Wand2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-[#0d0d10] transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
            <Scissors className="h-4 w-4" />
          </div>
          <span className="font-semibold">ClipForge</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-sm font-medium">Demo Creator</p>
          <p className="text-xs text-white/40">Single-user demo session</p>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:hidden">
          <button onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 hover:bg-white/10">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-semibold">ClipForge</span>
        </header>
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
