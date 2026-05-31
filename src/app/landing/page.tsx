"use client";

import { motion, Variants } from "framer-motion";
import { Sparkles, Zap, Shield, Globe, ArrowRight, Github, Cpu, BrainCircuit } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 overflow-x-hidden font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-10 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Sparkles size={20} />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">VIBE<span className="text-blue-500">CODE</span></span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          {["Intelligence", "Architecture", "Cloud", "Vision"].map((link) => (
            <a key={link} href="#" className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors">
              {link}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-6">
          <a href="https://github.com" className="text-gray-500 hover:text-white transition-colors">
            <Github size={20} />
          </a>
          <Link
            href="/auth"
            className="px-6 py-3 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
          >
            Launch Terminal
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-32 pb-40 px-6 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "circOut" }}
          className="mb-8 inline-flex items-center gap-3 px-4 py-2 bg-blue-500/5 border border-blue-500/20 rounded-full"
        >
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Architect-1 Neural Core Online</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "circOut", delay: 0.2 }}
          className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic leading-[0.85] mb-10"
        >
          The <span className="text-blue-500">Autonomous</span> <br />
          <span className="relative">
            Workspace
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, delay: 1 }}
              className="absolute bottom-4 left-0 h-2 bg-blue-600/30 -z-10"
            />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium mb-12"
        >
          VibeCode is the elite neural workspace where agentic AI architects your vision into production-grade infrastructure. No boilerplate. Just vibes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-col md:flex-row items-center justify-center gap-6"
        >
          <Link
            href="/auth"
            className="group px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[0_20px_50px_rgba(37,99,235,0.3)] flex items-center gap-4 hover:-translate-y-1 active:scale-95"
          >
            Enter Workspace
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-10 py-5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-gray-400 hover:text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] transition-all active:scale-95">
            View Manifesto
          </button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-40 px-10 max-w-7xl mx-auto">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              icon: <BrainCircuit size={32} />,
              title: "Neural Architecture",
              desc: "Multi-modal agents that see your designs and architect full-stack environments instantly.",
              color: "text-blue-500"
            },
            {
              icon: <Zap size={32} />,
              title: "Self-Healing Core",
              desc: "Autonomous maintenance protocols that scan, identify, and sanitize bugs while you sleep.",
              color: "text-purple-500"
            },
            {
              icon: <Shield size={32} />,
              title: "Zero-Trust Sync",
              desc: "E2E encrypted local state with direct-to-cloud GitHub integration. Your code, your keys.",
              color: "text-emerald-500"
            }
          ].map((f, i) => (
            <motion.div
              key={i}
              variants={item}
              className="p-12 bg-[#0a0a0a] border border-[#1a1a1a] rounded-[3rem] group hover:border-gray-700 transition-all duration-500 hover:-translate-y-2"
            >
              <div className={`p-5 bg-white/5 rounded-3xl w-fit mb-8 ${f.color} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                {f.icon}
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-4">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed font-medium">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Visual Showcase */}
      <section className="relative z-10 py-40 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-10">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic mb-6">Designed for <br /><span className="text-blue-500">Speed.</span> Built for <span className="text-purple-500">Vibes.</span></h2>
              <p className="text-lg text-gray-500 font-medium">The VibeCode interface is a high-performance terminal designed for the next generation of engineers who prioritize momentum over syntax.</p>
            </div>
            <div className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">
               Protocol v2.0.4-Alpha
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="aspect-video bg-[#050505] rounded-[3rem] border border-[#1a1a1a] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden relative group"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             <div className="absolute top-0 left-0 w-full h-12 bg-[#111] border-b border-[#1a1a1a] flex items-center px-6 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
             </div>
             <div className="h-full w-full flex items-center justify-center">
                <Cpu size={80} className="text-gray-900 group-hover:text-blue-500/20 transition-colors duration-1000 animate-spin-slow" />
             </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-60 text-center px-6">
         <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic mb-12">Join the <br /><span className="text-blue-500">Intelligence</span> Era.</h2>
         <Link
            href="/auth"
            className="inline-flex px-12 py-6 bg-white text-black rounded-[2.5rem] text-lg font-black uppercase tracking-[0.2em] hover:bg-blue-500 hover:text-white transition-all shadow-2xl active:scale-95"
         >
            Start Building
         </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#1a1a1a] py-20 px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-3 grayscale opacity-50">
            <div className="p-2 bg-white rounded-xl">
                <Sparkles size={16} className="text-black" />
            </div>
            <span className="font-black text-sm tracking-tighter uppercase italic">VIBECODE</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-700">
            © 2024 VibeCode Systems. All rights reserved.
          </div>
          <div className="flex gap-8">
             {["Twitter", "Discord", "GitHub"].map(social => (
               <a key={social} href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                 {social}
               </a>
             ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
