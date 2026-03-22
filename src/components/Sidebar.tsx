import React from 'react';
import {
  HomeIcon,
  SearchIcon,
  HeartIcon,
  UserIcon,
  MusicNoteIcon,
} from './Icons';
import type { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isAuthenticated: boolean;
}

const navItems: { view: ViewType; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { view: 'home', label: 'Home', Icon: HomeIcon },
  { view: 'search', label: 'Search', Icon: SearchIcon },
  { view: 'liked', label: 'Liked Songs', Icon: HeartIcon },
];

export function Sidebar({ currentView, onNavigate, isAuthenticated }: SidebarProps) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-zinc-950 border-r border-zinc-800/40 flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
            <MusicNoteIcon className="w-5 h-5 text-black" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">AC Music</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-2">
          Menu
        </p>
        <div className="flex flex-col gap-0.5">
          {navItems.map(({ view, label, Icon }) => {
            const active = currentView === view;
            return (
              <button
                key={view}
                onClick={() => onNavigate(view)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full text-left group ${
                  active
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    active ? 'text-emerald-400' : 'group-hover:text-zinc-200'
                  }`}
                />
                <span className="flex-1">{label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Library divider */}
        <div className="my-4 border-t border-zinc-800/50" />

        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-2">
          Account
        </p>
        <button
          onClick={() => onNavigate(isAuthenticated ? 'profile' : 'auth')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all duration-150 group ${
            currentView === 'profile' || currentView === 'auth'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
          }`}
        >
          <UserIcon
            className={`w-5 h-5 flex-shrink-0 transition-colors ${
              currentView === 'profile' || currentView === 'auth'
                ? 'text-emerald-400'
                : 'group-hover:text-zinc-200'
            }`}
          />
          {isAuthenticated ? 'Profile' : 'Sign In'}
          {(currentView === 'profile' || currentView === 'auth') && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </button>
      </nav>

      {/* Footer & Legal Disclaimer */}
      <div className="px-5 py-4 border-t border-zinc-800/40">
        <p className="text-[10px] text-zinc-700 font-medium mb-3">AC Music © 2025</p>
        <p className="text-[9px] text-zinc-500 leading-tight">
          This is a personal, non-commercial educational project built to demonstrate full-stack web development.
          <br /><br />
          All audio content is streamed directly via third-party APIs and is the property of their respective copyright owners.
        </p>
      </div>
    </aside>
  );
}
