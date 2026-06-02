import React, { useState, useMemo } from 'react';
import { ShieldCheck, Lock, ArrowRight, Flame, X } from 'lucide-react';

interface LoginViewProps {
  onLogin: () => void;
  onClose?: () => void;
}

export const LoginView = ({ onLogin, onClose }: LoginViewProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Generate fire particles once to prevent re-creation on render (keystrokes)
  const particles = useMemo(() => {
    const colors = ['bg-primary', 'bg-yellow-400', 'bg-white', 'bg-orange-500'];
    return [...Array(90)].map((_, i) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 0.8 + Math.random() * 2.5;
      const startX = -20 + Math.random() * 40;
      const top = 45 + Math.random() * 55;
      const duration = 2 + Math.random() * 4;
      const delay = Math.random() * 10;
      return {
        id: i,
        color,
        size,
        startX,
        top,
        duration: `${duration}s`,
        delay: `${delay}s`
      };
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_APP_PASSWORD || '@Gamst321!';
    
    if (password === correctPassword) {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden p-6 animate-fade-in">
      {/* Intense Flame background effect matching header */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0508] via-black to-black"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#e11d48]/25 via-[#f43f5e]/15 to-transparent animate-flame-flow"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(225,29,72,0.2),transparent_75%)] animate-pulse"></div>
        
        {/* Fire Particles for login background - Enhanced density and sweep from left */}
        <div className="absolute inset-0 overflow-hidden opacity-70">
          {particles.map((p) => (
            <div 
              key={p.id}
              className={`absolute rounded-full blur-[0.3px] animate-fire-particle ${p.color}`}
              style={{ 
                width: `${p.size}px`,
                height: `${p.size}px`,
                left: `${p.startX}%`, 
                top: `${p.top}%`,
                '--duration': p.duration,
                animationDelay: p.delay
              } as React.CSSProperties}
            ></div>
          ))}
        </div>
      </div>
      
      <div className="w-full max-w-sm relative z-10">
        <div className={`glass-panel p-10 rounded-[2.5rem] border border-hairline/40 bg-[#0c0f12]/70 backdrop-blur-3xl shadow-[0_40px_120px_rgba(0,0,0,0.9),0_0_60px_rgba(225,29,72,0.1)] relative transition-all duration-300 ${error ? 'border-primary ring-2 ring-primary/20 scale-[0.99] translate-x-1' : ''}`}>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-8 h-8 rounded-full border border-hairline/25 flex items-center justify-center text-ink-subtle hover:text-white transition-all bg-surface-1 hover:bg-surface-2 cursor-pointer"
              title="관전 모드로 돌아가기"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex flex-col items-center mb-10">
            <h1 className="text-[28px] font-black text-white tracking-[0.08em] text-center uppercase font-titular leading-none mb-1">
              TEKKEN IRON ARENA
            </h1>
            <p className="text-primary text-[10px] font-black uppercase tracking-[0.45em]">
              ACCESS PROTOCOL
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-ink-tertiary group-focus-within:text-primary transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="인증 암호를 입력하십시오"
                className={`w-full bg-[#161a20]/80 border-hairline border rounded-2xl py-4.5 pl-12 pr-5 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium placeholder:text-ink-tertiary/40 ${error ? 'border-primary animate-shake' : ''}`}
                autoFocus
              />
              
              {/* Subtle entry indicator */}
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-bold text-ink-tertiary group-focus-within:border-primary/30 group-focus-within:text-primary transition-all">
                  ↵
                </div>
              </div>
            </div>
            
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 bg-surface-2 hover:bg-surface-3 hover:text-white border border-hairline rounded-2xl text-xs font-bold text-ink-subtle transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>관전자 모드로 계속 보기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <div className="mt-12 pt-6 border-t border-hairline/10 flex items-center justify-center">
             <div className="text-[9px] font-black uppercase tracking-[0.5em] text-ink-tertiary opacity-60 hover:opacity-100 transition-opacity cursor-default">
               Designed by GosL
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
