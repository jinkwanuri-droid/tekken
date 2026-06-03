import React, { useState, useEffect, useMemo } from 'react';
import { Gamepad2, Flame, ArrowRight, Lock } from 'lucide-react';

interface IntroScreenProps {
  onEnter: () => void;
}

export function IntroScreen({ onEnter }: IntroScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  // Smooth loading progression
  useEffect(() => {
    const start = Date.now();
    const duration = 2000; // 2 seconds high-end load
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const calculatedProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(calculatedProgress);
      
      if (calculatedProgress >= 100) {
        setIsLoaded(true);
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, []);

  const loadingStatusText = useMemo(() => {
    if (progress < 25) return 'NETWORK PROTOCOL STABILIZING...';
    if (progress < 50) return 'LOADING CORE TOURNAMENT ENGINE...';
    if (progress < 75) return 'SYNCHRONIZING ARENA DATABASE...';
    if (progress < 95) return 'PREPARING COMBAT SYSTEMS...';
    return 'READY TO BATTLE';
  }, [progress]);

  // Enhanced particles with higher count and dynamic, prominent sizes
  const particles = useMemo(() => {
    const colors = ['bg-primary', 'bg-yellow-400', 'bg-white', 'bg-orange-500'];
    return [...Array(140)].map((_, i) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 0.8 + Math.random() * 3.2; // Optimized smaller size variety (70% of previous size for fine embers)
      const startX = -10 - Math.random() * 25;
      const top = Math.random() * 100;
      const duration = 3.5 + Math.random() * 5;
      const delay = Math.random() * 8;
      const driftY = -80 - Math.random() * 160;
      return {
        id: i,
        color,
        size,
        startX,
        top,
        driftY,
        duration: `${duration}s`,
        delay: `${delay}s`
      };
    });
  }, []);

  const handleEnterClick = () => {
    setIsEntering(true);
    setTimeout(() => {
      onEnter();
    }, 500);
  };

  return (
    <div className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden p-6 transition-all duration-700 ease-out ${
      isEntering ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'
    }`}>
      {/* Styles to support left-to-right fire particle flying and flows */}
      <style>{`
        @keyframes fire-particle-left {
          0% { 
            transform: translateX(0) translateY(0) scale(1.1); 
            opacity: 0; 
            filter: blur(1px) brightness(3); 
          }
          15% { 
            opacity: 1; 
            transform: translateX(20vw) translateY(-25px) scale(1.0); 
            filter: blur(0.8px) brightness(2.6);
          }
          35% {
            opacity: 0.9;
            transform: translateX(45vw) translateY(-10px) scale(0.8);
            filter: blur(1.2px) brightness(3.1);
          }
          55% {
            opacity: 0.85;
            transform: translateX(70vw) translateY(-45px) scale(0.9);
            filter: blur(0.9px) brightness(2.1);
          }
          75% {
            opacity: 0.95;
            transform: translateX(95vw) translateY(-30px) scale(0.65);
            filter: blur(1.3px) brightness(2.7);
          }
          100% { 
            transform: translateX(120vw) translateY(-150px) scale(0.15); 
            opacity: 0; 
          }
        }
        .fire-left-effect {
          animation: fire-particle-left var(--duration, 3s) linear infinite;
          will-change: transform, opacity;
        }
      `}</style>

      {/* 1. Background Layers (Gradient and Ambient Glow) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0508] via-black to-black"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#e11d48]/25 via-[#f43f5e]/15 to-transparent flame-flow-effect"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(225,29,72,0.2),transparent_75%)] animate-pulse"></div>
      </div>
      
      {/* 2. Main Content (No Box, directly in the center) */}
      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        <div className="flex flex-col items-center justify-center text-center mb-10">
          {/* Single line clean title */}
          <h1 className="text-[20px] sm:text-[24px] font-black text-white tracking-[0.16em] uppercase font-titular leading-none mb-3 whitespace-nowrap drop-shadow-lg">
            TEKKEN IRON ARENA
          </h1>
          <p className="text-primary text-[9px] font-black uppercase tracking-[0.45em] whitespace-nowrap leading-none drop-shadow-md">
            GET READY FOR THE NEXT BATTLE
          </p>
          <div className="h-[1px] w-14 bg-gradient-to-r from-transparent via-primary/60 to-transparent mt-4" />
        </div>

        <div className="w-full space-y-8 flex flex-col items-center">
          {!isLoaded ? (
            /* Charging Sleek Progress Loader */
            <div className="w-64 space-y-4">
              <div className="w-full h-1 bg-white/5 border border-white/10 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-[#ff3b61] rounded-full shadow-[0_0_10px_rgba(225,29,72,0.5)] transition-all duration-100 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-[9px] font-mono font-bold text-rose-500/90 tracking-widest text-center uppercase">
                  {loadingStatusText} ({progress}%)
                </span>
                <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-black">
                  토너먼트 대진표 로딩 중
                </span>
              </div>
            </div>
          ) : (
            /* Compact and delicate enter button */
            <div className="flex flex-col items-center gap-4 animate-fade-in w-full">
              <button
                onClick={handleEnterClick}
                className="w-64 sm:w-80 py-3.5 px-6 bg-gradient-to-r from-primary to-[#ff3b61] hover:brightness-110 active:scale-95 text-[11px] font-black text-white tracking-[0.25em] uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_25px_rgba(225,29,72,0.45)] border border-primary/30 hover:border-white/45 whitespace-nowrap"
              >
                <span>ARENA ENTER</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <p className="text-[10px] text-white/40 font-black tracking-widest uppercase leading-none mt-1 animate-pulse whitespace-nowrap">
                버튼을 클릭하여 아레나 입장
              </p>
            </div>
          )}
        </div>

        <div className="mt-14 pt-6 border-t border-white/5 w-64 sm:w-80 flex items-center justify-center">
           <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 whitespace-nowrap text-center">
             Designed by GosL
           </div>
        </div>
      </div>

      {/* 3. Top-Layer Particles (Flying OVER everything) */}
      <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden opacity-80">
        {particles.map((p) => (
          <div 
            key={p.id}
            className={`absolute rounded-full blur-[0.2px] fire-left-effect ${p.color}`}
            style={{ 
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.startX}%`, 
              top: `${p.top}%`,
              '--duration': p.duration,
              '--drift-y': `${p.driftY}px`,
              animationDelay: p.delay
            } as React.CSSProperties}
          ></div>
        ))}
      </div>
    </div>
  );
}
