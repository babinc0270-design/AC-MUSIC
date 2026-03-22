import React from 'react';
import { HomeIcon, SearchIcon, HeartIcon, UserIcon } from './Icons';
import type { ViewType } from '../types';

interface MobileNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isAuthenticated: boolean;
}

const navItems: {
  view: ViewType;
  label: string;
  Icon: React.FC<{ className?: string }>;
  authRequired?: boolean;
}[] = [
  { view: 'home', label: 'Home', Icon: HomeIcon },
  { view: 'search', label: 'Search', Icon: SearchIcon },
  { view: 'liked', label: 'Liked', Icon: HeartIcon, authRequired: true },
  { view: 'profile', label: 'Profile', Icon: UserIcon },
];

export function MobileNav({
  currentView,
  onNavigate,
  isAuthenticated,
}: MobileNavProps) {
  const handleNav = (view: ViewType, authRequired?: boolean) => {
    if (authRequired && !isAuthenticated) {
      onNavigate('auth');
      return;
    }
    if (view === 'profile' && !isAuthenticated) {
      onNavigate('auth');
      return;
    }
    onNavigate(view);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800/50 z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ view, label, Icon, authRequired }) => {
          const isActive =
            currentView === view ||
            (view === 'profile' &&
              (currentView === 'auth' || currentView === 'profile'));

          return (
            <button
              key={view}
              onClick={() => handleNav(view, authRequired)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-emerald-400'
                  : 'text-zinc-500 active:text-zinc-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span
                className={`text-[10px] font-semibold ${isActive ? 'text-emerald-400' : ''}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
