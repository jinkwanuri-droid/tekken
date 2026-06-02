import React, { useState, useEffect } from 'react';
import { BracketView } from './views/BracketView';
import { TeamsView } from './views/TeamsView';
import { DashboardView } from './views/DashboardView';
import { LoginView } from './views/LoginView';
import { TournamentProvider } from './store';
import { Gamepad2, Users, GitMerge, LayoutDashboard } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'bracket', label: '대진표', icon: GitMerge },
  { id: 'teams', label: '팀 및 선수 관리', icon: Users },
];

function Nav({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded text-[13px] font-semibold transition-all ${
                isActive 
                  ? 'btn-accent shadow-[0_0_15px_rgba(225,29,72,0.2)]' 
                  : 'text-ink border border-transparent hover:border-hairline hover:bg-surface-2'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'opacity-70'}`} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Mobile Nav Bar (Bottom) */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-lg h-16 bg-[#1a0505]/90 backdrop-blur-3xl border border-primary/40 rounded-2xl z-[100] px-1 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(225,29,72,0.2)]">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full relative transition-all duration-300 ${
                isActive ? 'text-primary scale-110' : 'text-ink-subtle'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/10' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'opacity-60'}`} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label === '팀 및 선수 관리' ? '팀/선수' : item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-6 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
              )}
            </button>
          )
        })}
      </nav>
    </>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const expiresAt = localStorage.getItem('auth_expires_at');
      if (expiresAt && Date.now() < parseInt(expiresAt)) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Session refresh interval: While active, extend the expiry every 5 minutes
    const interval = setInterval(() => {
      const expiresAt = localStorage.getItem('auth_expires_at');
      if (expiresAt && Date.now() < parseInt(expiresAt)) {
        const newExpiry = Date.now() + 3600000; // 1 hour from now
        localStorage.setItem('auth_expires_at', newExpiry.toString());
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    const expiry = Date.now() + 3600000; // 1 hour from login
    localStorage.setItem('auth_expires_at', expiry.toString());
    setIsAuthenticated(true);
  };

  if (isAuthenticated === null) return null;
  if (!isAuthenticated) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="w-full h-screen bg-black bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.15),transparent_80%),linear-gradient(to_bottom,#000000,#0c0202)] flex flex-col items-center justify-center font-sans text-ink p-0 sm:pt-0 sm:pb-6 sm:px-6 overflow-hidden">
      <div className={`w-full ${activeTab === 'bracket' ? 'max-w-[1500px] sm:max-h-[900px]' : 'max-w-5xl sm:max-h-[850px]'} h-full shadow-2xl md:rounded-b-2xl grid grid-rows-[64px_1fr] bg-[#0c0f12] overflow-hidden border-x border-b border-hairline/50 md:border-x md:border-b md:border-hairline/50 relative transition-all duration-300`}>
        <header className="flex items-center justify-between px-6 border-b border-hairline backdrop-blur-xl z-20 relative overflow-hidden h-16">
          {/* Intense Flame/Fire Animated Background Effect */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Base Red Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#e11d48]/25 via-[#f43f5e]/15 to-transparent animate-flame-flow"></div>
            
            {/* Moving Flame "Tongues" */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_120%,rgba(225,29,72,0.4),transparent_50%),radial-gradient(circle_at_80%_120%,rgba(225,29,72,0.3),transparent_50%)] blur-2xl animate-pulse"></div>
            
            {/* Shimmering highlights */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
            
            {/* Spark Particles - Refined and smaller */}
            <div className="absolute inset-0 overflow-hidden opacity-90">
              <div className="fire-particles-container absolute inset-0">
                {[...Array(50)].map((_, i) => {
                  const colors = ['bg-primary', 'bg-yellow-300', 'bg-white', 'bg-orange-400'];
                  const color = colors[Math.floor(Math.random() * colors.length)];
                  const size = 0.5 + Math.random() * 1.5;
                  
                  return (
                    <div 
                      key={i}
                      className={`absolute rounded-full blur-[0.5px] animate-fire-particle ${color}`}
                      style={{ 
                        width: `${size}px`,
                        height: `${size}px`,
                        left: `${-5 + Math.random() * 110}%`, 
                        top: `${40 + Math.random() * 65}%`,
                        '--duration': `${0.8 + Math.random() * 2.5}s`,
                        animationDelay: `${Math.random() * 6}s`
                      } as React.CSSProperties}
                    ></div>
                  );
                })}
              </div>
            </div>
            
            {/* Bottom highlight line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/80 to-transparent shadow-[0_0_10px_rgba(225,29,72,0.5)]"></div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
              <path d='M13 2L3 14h9l-1 8 10-12h-9l1-8z' fill='var(--color-primary)'/>
            </svg>
            <span className="text-[15px] md:text-[18px] font-titular text-white tracking-widest whitespace-nowrap">TEKKEN IRON ARENA</span>
          </div>
          
          <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
        </header>

        <main className={`bg-[#0c0f12] bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.05),transparent)] overflow-y-auto no-scrollbar min-h-0 relative z-10 flex flex-col pt-0 ${activeTab === 'dashboard' ? 'pb-24 md:pb-0' : 'pb-20 md:pb-0'}`}>
           {activeTab === 'dashboard' && <DashboardView />}
           {activeTab === 'bracket' && <BracketView />}
           {activeTab === 'teams' && <TeamsView />}
        </main>
      </div>

      {/* Mobile Nav Bar - Moved outside the grid container to ensure it stays on top */}
      <div className="md:hidden">
        <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TournamentProvider>
      <AppContent />
    </TournamentProvider>
  );
}
