import React, { useState } from 'react';
import { BracketView } from './views/BracketView';
import { TeamsView } from './views/TeamsView';
import { DashboardView } from './views/DashboardView';
import { TournamentProvider } from './store';
import { Gamepad2, Users, GitMerge, LayoutDashboard } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'bracket', label: '대진표', icon: GitMerge },
  { id: 'teams', label: '팀 및 선수 관리', icon: Users },
];

function TopNav({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  return (
    <nav className="flex items-center gap-2">
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
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="w-full h-screen bg-black bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.15),transparent_80%),linear-gradient(to_bottom,#000000,#0c0202)] flex flex-col items-center justify-center font-sans text-ink p-0 sm:p-6 overflow-hidden">
      <div className={`w-full ${activeTab === 'bracket' ? 'max-w-[1500px] sm:max-h-[900px]' : 'max-w-5xl sm:max-h-[850px]'} h-full shadow-2xl md:rounded-2xl grid grid-rows-[72px_1fr] bg-[#0c0f12] overflow-hidden border border-hairline/50 relative transition-all duration-300`}>
        <header className="bg-gradient-to-r from-[#1a0505] to-[#0c0f14] flex flex-col md:flex-row items-center justify-between px-6 border-b border-hairline backdrop-blur-xl z-20 gap-4 md:gap-0">
          <div className="flex items-center gap-3">
            <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
              <path d='M13 2L3 14h9l-1 8 10-12h-9l1-8z' fill='var(--color-primary)'/>
            </svg>
            <span className="text-[18px] font-titular text-white tracking-widest">TEKKEN IRON ARENA</span>
          </div>
          <TopNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </header>

        <main className="bg-[#0c0f12] bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.05),transparent)] overflow-hidden min-h-0 relative z-10 flex flex-col pt-0">
           {activeTab === 'dashboard' && <DashboardView />}
           {activeTab === 'bracket' && <BracketView />}
           {activeTab === 'teams' && <TeamsView />}
        </main>
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
