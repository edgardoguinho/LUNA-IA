import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  SquarePen,
  Volume2,
  VolumeX,
  User,
  Settings,
  Brain,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { LunaStatus, ServerStatus, UserProfile, UserAccount } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { LunaVerifiedBadge } from './LunaVerifiedBadge';

interface HeaderProps {
  status: LunaStatus;
  serverStatus: ServerStatus | null;
  profile: UserProfile;
  currentUser: UserAccount;
  memoriesCount: number;
  onOpenProfile: () => void;
  onOpenMemories: () => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  serverStatus,
  profile,
  currentUser,
  memoriesCount,
  onOpenProfile,
  onOpenMemories,
  onNewChat,
  onToggleSidebar,
  voiceEnabled,
  onToggleVoice,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 px-3 py-2 border-b transition-colors select-none backdrop-blur-md ${
        isDark
          ? 'bg-[#0d0d0d]/90 border-neutral-800 text-neutral-100'
          : 'bg-white/90 border-neutral-200 text-neutral-900'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Sidebar toggle & New Chat */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSidebar}
            title="Abrir menu lateral e histórico"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-100 text-neutral-700'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={onNewChat}
            title="Criar nova conversa"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-neutral-800 text-neutral-300'
                : 'hover:bg-neutral-100 text-neutral-700'
            }`}
          >
            <SquarePen className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Nova conversa</span>
          </button>
        </div>

        {/* Center: Title & Model */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-sm tracking-tight">
            <span>Luna AI</span>
            <LunaVerifiedBadge size="sm" />
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
          </div>
          {status === 'typing' && (
            <span className="text-[11px] text-neutral-400 animate-pulse hidden sm:inline">
              respondendo...
            </span>
          )}
        </div>

        {/* Right: Actions & User Dropdown */}
        <div className="flex items-center gap-1">
          {/* PWA Install */}
          <PWAInstallButton />

          {/* Voice toggle */}
          <button
            onClick={onToggleVoice}
            title={voiceEnabled ? 'Desativar respostas por voz' : 'Ativar respostas por voz'}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              voiceEnabled
                ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-800/40'
                : isDark
                ? 'text-neutral-400 hover:bg-neutral-800'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* User Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title={`Conta: ${currentUser.displayName}`}
              className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-neutral-700 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-neutral-700 text-white flex items-center justify-center text-xs font-semibold uppercase border border-neutral-600">
                {currentUser.displayName ? currentUser.displayName.slice(0, 2) : 'LU'}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                className={`absolute right-0 mt-2 w-56 rounded-xl border p-1.5 shadow-xl z-50 animate-fadeIn ${
                  isDark
                    ? 'bg-[#181818] border-neutral-700 text-neutral-200'
                    : 'bg-white border-neutral-200 text-neutral-800 shadow-lg'
                }`}
              >
                {/* User info header */}
                <div className="px-3 py-2 border-b border-neutral-800/60 mb-1">
                  <div className="text-xs font-semibold truncate flex items-center gap-1">
                    <span>{currentUser.displayName}</span>
                    {currentUser.isVerifiedCreator && (
                      <span title="Criador Verificado">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {currentUser.email || `@${currentUser.username}`}
                  </div>
                </div>

                {/* Menu items */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenProfile();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                    isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Perfil & Personalidade</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenMemories();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                    isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Brain className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Memórias Autorizadas</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">{memoriesCount}</span>
                </button>

                <button
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                    isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{isDark ? 'Tema Claro' : 'Tema Escuro'}</span>
                  </div>
                </button>

                <div className="my-1 border-t border-neutral-800/60" />

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da conta</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
