import React from 'react';
import { Gamepad2, Users, GitMerge, LayoutDashboard } from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'bracket', label: '대진표', icon: GitMerge },
    { id: 'match', label: '경기진행', icon: Gamepad2 },
    { id: 'teams', label: '팀 및 선수 관리', icon: Users },
  ];

  return (
    <aside className="bg-[rgba(10,12,16,0.95)] backdrop-blur-md p-5 flex flex-col gap-4 border-r border-hairline z-10 h-full overflow-y-auto min-h-0">
      <div className="text-[11px] text-ink-subtle uppercase tracking-widest font-bold mb-2 pt-2">Menu</div>
      <nav className="flex-1 flex flex-col gap-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-[13px] font-semibold transition-all ${
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
      <div className="p-4 text-[10px] text-ink-tertiary text-center tracking-widest uppercase">
        <p>Tekken Tournament v1.0</p>
      </div>
    </aside>
  );
};

