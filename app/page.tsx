"use client";

import { motion } from "motion/react";
import { useState } from "react";
import Image from "next/image";

// --- Visual Cues (Mini Components) ---

function TrackCard() {
  return (
    <div className="group relative flex h-40 w-full flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-accent/30 hover:bg-white/10 hover:shadow-accent/5">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[10px] font-medium tracking-widest text-gray/70 uppercase">
            SESSION_142
          </span>
        </div>
        <span className="font-mono text-xs font-bold text-light">
          2h 14m
        </span>
      </div>

      {/* Main Metric */}
      <div className="relative flex items-end gap-3">
        <div>
          <span className="block text-[10px] font-medium text-gray uppercase tracking-wider">Total Cost</span>
          <span className="font-heading text-2xl font-bold text-light">$26.67</span>
        </div>
        <div className="mb-1 h-8 w-px bg-white/10" />
        <div>
           <span className="block text-[10px] font-medium text-gray uppercase tracking-wider">Tokens</span>
           <span className="font-heading text-lg font-semibold text-light/80">1.2M</span>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="relative flex h-8 items-end gap-1 opacity-80">
         {[30, 50, 40, 70, 45, 90, 60, 40, 50, 80].map((h, i) => (
           <div 
             key={i} 
             style={{ height: `${h}%` }} 
             className={`w-full rounded-sm ${i === 5 ? 'bg-accent shadow-[0_0_8px_rgba(198,96,63,0.6)]' : 'bg-white/20'}`} 
           />
         ))}
      </div>
    </div>
  );
}

function ShareCard() {
  return (
    <div className="group relative flex h-40 w-full flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-accent/30 hover:bg-white/10 hover:shadow-accent/5">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      {/* Header */}
      <div className="relative flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-light shadow-lg shadow-accent/20">
          O
        </div>
        <div className="flex flex-col leading-tight">
           <span className="font-heading text-sm font-bold text-light">@ohong</span>
           <span className="text-[10px] text-gray/60">just now · via Cursor</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative mt-2 grow rounded-lg bg-black/20 p-3">
         <p className="font-body text-xs italic text-light/90 leading-relaxed">
           &ldquo;Claude just oneshotted our whole billing system. Sunday well spent.&rdquo;
         </p>
      </div>

      {/* Footer */}
      <div className="relative mt-3 flex items-center gap-4 text-gray/60">
         <div className="flex items-center gap-1.5 transition-colors hover:text-accent">
           <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
           </svg>
           <span className="font-mono text-[10px] font-medium">24</span>
         </div>
         <div className="flex items-center gap-1.5 transition-colors hover:text-light">
           <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
           </svg>
           <span className="font-mono text-[10px] font-medium">8</span>
         </div>
      </div>
    </div>
  );
}

function CompeteCard() {
  return (
    <div className="group relative flex h-40 w-full flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-accent/30 hover:bg-white/10 hover:shadow-accent/5">
       <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

       {/* Header */}
       <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-medium text-accent">🌎</span>
             <span className="font-mono text-[10px] font-medium tracking-widest text-gray/70 uppercase">
               North America
             </span>
          </div>
          <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-400">▲ 2</span>
       </div>

       {/* Leaderboard mini */}
       <div className="relative flex flex-col gap-1">
          <div className="flex items-center gap-2 rounded px-2 py-1 text-[10px] text-gray/50">
             <span className="w-4 font-mono">#6</span>
             <span className="font-medium">@shipfast</span>
             <span className="ml-auto font-mono">$31.20</span>
          </div>
          <div className="flex items-center gap-2 rounded bg-accent/20 px-2 py-1 text-[10px] text-light border-l-2 border-accent">
             <span className="w-4 font-mono font-bold">#7</span>
             <span className="font-bold">@ohong</span>
             <span className="ml-auto font-mono font-bold">🔥 $26.67</span>
          </div>
          <div className="flex items-center gap-2 rounded px-2 py-1 text-[10px] text-gray/50">
             <span className="w-4 font-mono">#8</span>
             <span className="font-medium">@levelsio</span>
             <span className="ml-auto font-mono">$24.89</span>
          </div>
       </div>
    </div>
  );
}

// --- Hero Background ---

function HeroBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none">
      {/* Background Image */}
      <Image
        src="/hero-bg.jpg"
        alt=""
        fill
        priority
        className="object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-dark/70" />
      {/* Gradient overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-dark/30" />
    </div>
  );
}

export default function Home() {
  const [showBadge, setShowBadge] = useState(true);

  return (
    <div className="relative flex min-h-dvh flex-col bg-dark text-light selection:bg-accent selection:text-light overflow-x-hidden">
      <HeroBackground />

      <main className="relative z-20 flex flex-1 flex-col items-center justify-start pt-20 sm:justify-center sm:pt-0 px-4 sm:px-8">
        
        {/* Hero Text */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
             {/* Glow behind title */}
             <div className="absolute -inset-10 bg-accent/20 blur-3xl rounded-full opacity-50" />
             
             <h1 className="relative font-heading text-6xl font-extrabold tracking-tight text-light drop-shadow-sm sm:text-8xl md:text-9xl">
               STRAUDE
             </h1>
          </motion.div>

          <motion.p
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
             className="mt-6 font-body text-lg text-gray sm:text-xl md:text-2xl"
          >
            <span className="text-light font-medium border-b border-accent/50">Stra</span>va for Cl<span className="text-light font-medium border-b border-accent/50">aude</span> Code
          </motion.p>
        </div>

        {/* Visual Cards */}
        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
           <motion.div
             initial={{ opacity: 0, y: 40 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.5 }}
           >
              <div className="flex flex-col items-center gap-4">
                 <TrackCard />
                 <span className="font-heading text-sm font-semibold tracking-widest uppercase text-accent">Track</span>
              </div>
           </motion.div>

           <motion.div
             initial={{ opacity: 0, y: 40 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.7 }}
           >
              <div className="flex flex-col items-center gap-4">
                 <ShareCard />
                 <span className="font-heading text-sm font-semibold tracking-widest uppercase text-accent">Share</span>
              </div>
           </motion.div>

           <motion.div
             initial={{ opacity: 0, y: 40 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.9 }}
           >
              <div className="flex flex-col items-center gap-4">
                 <CompeteCard />
                 <span className="font-heading text-sm font-semibold tracking-widest uppercase text-accent">Compete</span>
              </div>
           </motion.div>
        </div>

        {/* Footer / Status */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: showBadge ? 1 : 0 }}
           transition={{ duration: showBadge ? 1 : 0.3, delay: showBadge ? 1.5 : 0 }}
           className="mt-12 mb-8 sm:mt-16 sm:mb-12 flex flex-col items-center gap-3"
           style={{ pointerEvents: showBadge ? "auto" : "none" }}
        >
           <button
              onClick={() => setShowBadge(false)}
              className="flex items-center gap-3 rounded-full border border-gray/20 bg-dark/50 px-6 py-2.5 backdrop-blur-sm cursor-pointer transition-all hover:border-accent/30 hover:bg-dark/70"
           >
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex size-2.5 rounded-full bg-accent"></span>
              </span>
              <span className="font-mono text-sm uppercase tracking-widest text-gray">
                Coming Soon
              </span>
           </button>
        </motion.div>

      </main>
    </div>
  );
}