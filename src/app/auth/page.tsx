"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Fingerprint, Sparkles, ArrowRight, Loader2, Key, Mail } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [step, setStep] = useState<"login" | "verify">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        if (step === "login") setStep("verify");
        else window.location.href = "/";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-12">
            <div className="p-4 bg-blue-600 rounded-3xl shadow-[0_0_40px_rgba(37,99,235,0.4)] mb-6 animate-bounce-slow">
                <Shield size={32} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-center leading-none">
                VIBE<span className="text-blue-500">AUTH</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black mt-3">Enterprise Access Protocol</p>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/30 group-hover:bg-blue-500 transition-colors" />

          <AnimatePresence mode="wait">
            {step === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleAuth}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <h2 className="text-xl font-black uppercase tracking-tight italic">Initialize Session</h2>
                  <div className="space-y-4">
                    <div className="relative group/input">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                        <input
                            required
                            type="email"
                            placeholder="CORPORATE_EMAIL..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 pl-14 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all font-bold tracking-tight text-white placeholder:text-gray-800"
                        />
                    </div>
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_20px_50px_rgba(37,99,235,0.2)] flex items-center justify-center gap-3 active:scale-95"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={18} />}
                  Authorize Identity
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="verify"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleAuth}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <h2 className="text-xl font-black uppercase tracking-tight italic">Verify Protocol</h2>
                  <p className="text-[11px] text-gray-500 font-bold leading-relaxed px-1">
                    Security keys sent to <span className="text-blue-400">{email}</span>. Check your node logs.
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                     {[1,2,3,4].map(i => (
                        <input
                            key={i}
                            required
                            maxLength={1}
                            className="w-full aspect-square bg-[#111] border border-[#1a1a1a] rounded-xl text-center text-xl font-black text-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all"
                        />
                     ))}
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_20px_50px_rgba(37,99,235,0.2)] flex items-center justify-center gap-3 active:scale-95"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                  Establish Connection
                </button>

                <button
                    type="button"
                    onClick={() => setStep("login")}
                    className="w-full text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-gray-400 transition-colors"
                >
                    Resend Auth Code
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-[10px] font-black text-gray-700 uppercase tracking-widest">
            <Link href="/landing" className="hover:text-gray-500 transition-colors">Documentation</Link>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
            <Link href="/landing" className="hover:text-gray-500 transition-colors">Privacy Node</Link>
        </div>
      </motion.div>
    </div>
  );
}
