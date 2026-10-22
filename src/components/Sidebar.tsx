import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Brain,
  Sun,
  Moon,
  LogOut,
  X,
  Sparkles,
  ShieldCheck,
  Check,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { UserAccount, SavedConversationSummary } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  conversations: SavedConversationSummary[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onMigrateLegacy?: () => void;
  isMigrating?: boolean;
  onOpenProfile: () => void;
  onOpenMemories: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  memoriesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentUser,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onMigrateLegacy,
  isMigrating = false,
  onOpenProfile,
  onOpenMemories,
  onLogout,
  theme,
  onToggleTheme,
  memoriesCount,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const isDark = theme === 'dark';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-fadeIn"
        />
      )}

      {/* Sliding Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 flex flex-col transition-all duration-300 ease-in-out select-none border-r ${
          isDark
            ? 'bg-[#171717] border-neutral-800 text-neutral-200'
            : 'bg-[#f9f9f9] border-neutral-200 text-neutral-800'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden md:border-r-0'
        }`}
      >
        {/* Top Header inside Sidebar */}
        <div className="p-3.5 flex items-center justify-between border-b border-neutral-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-xs border border-neutral-700/60">
              🌙
            </div>
            <span className="font-semibold text-sm tracking-tight">Luna AI</span>
          </div>

          <button
            onClick={onClose}
            title="Fechar menu lateral"
            className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer border ${
              isDark
                ? 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700/70 text-white active:bg-neutral-750'
                : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Nova conversa</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Ctrl+K</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
              Conversas Anteriores
            </span>
            {onMigrateLegacy && (
              <button
                onClick={onMigrateLegacy}
                disabled={isMigrating}
                title="Sincronizar e recuperar conversas de sessões anteriores"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isMigrating ? 'animate-spin' : ''}`} />
                <span>{isMigrating ? 'Sincronizando...' : 'Recuperar'}</span>
              </button>
            )}
          </div>

          {conversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-neutral-500 space-y-2">
              <MessageSquare className="w-5 h-5 mx-auto opacity-40" />
              <p>Nenhuma conversa arquivada ainda no servidor.</p>
              {onMigrateLegacy && (
                <button
                  onClick={onMigrateLegacy}
                  disabled={isMigrating}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isMigrating ? 'animate-spin' : ''}`} />
                  <span>Procurar mensagens antigas no navegador</span>
                </button>
              )}
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = currentConversationId === conv.id;
              const isConfirming = confirmDeleteId === conv.id;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-neutral-800 text-white font-medium'
                        : 'bg-neutral-200 text-neutral-900 font-medium'
                      : isDark
                      ? 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                  onClick={() => {
                    if (isEditing) return;
                    onSelectConversation(conv.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                >
                  {isEditing ? (
                    <div
                      className="flex items-center gap-1.5 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editTitle.trim() && onRenameConversation) {
                              onRenameConversation(conv.id, editTitle.trim());
                            }
                            setEditingId(null);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        autoFocus
                        className="flex-1 bg-neutral-900 text-white text-[12px] px-2 py-0.5 rounded border border-emerald-500/80 outline-none"
                      />
                      <button
                        onClick={() => {
                          if (editTitle.trim() && onRenameConversation) {
                            onRenameConversation(conv.id, editTitle.trim());
                          }
                          setEditingId(null);
                        }}
                        title="Salvar título"
                        className="p-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-neutral-700/50"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        title="Cancelar"
                        className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-700/50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate text-[12.5px]">{conv.title || 'Conversa sem título'}</span>
                      </div>

                      {/* Actions: Rename & Delete */}
                      <div
                        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isConfirming ? (
                          <div className="flex items-center gap-1 bg-red-950/80 px-1 py-0.5 rounded border border-red-800">
                            <span className="text-[10px] text-red-200">Excluir?</span>
                            <button
                              onClick={() => {
                                onDeleteConversation(conv.id);
                                setConfirmDeleteId(null);
                              }}
                              title="Confirmar exclusão"
                              className="p-0.5 rounded text-red-300 hover:text-white"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              title="Cancelar"
                              className="p-0.5 rounded text-neutral-400 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            {onRenameConversation && (
                              <button
                                onClick={() => {
                                  setEditingId(conv.id);
                                  setEditTitle(conv.title || '');
                                }}
                                title="Renomear conversa"
                                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-700/50 transition"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmDeleteId(conv.id)}
                              title="Excluir conversa"
                              className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-700/50 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: User Account & Settings */}
        <div className={`p-3 border-t ${isDark ? 'border-neutral-800 bg-[#141414]' : 'border-neutral-200 bg-neutral-50'}`}>
          {/* Quick Buttons: Memories & Theme */}
          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
            <button
              onClick={onOpenMemories}
              title="Acessar memórias autorizadas da Luna"
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                isDark
                  ? 'bg-neutral-800/70 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/50'
                  : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-emerald-400" />
              <span>Memórias ({memoriesCount})</span>
            </button>

            <button
              onClick={onToggleTheme}
              title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                isDark
                  ? 'bg-neutral-800/70 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/50'
                  : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
              }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{isDark ? 'Tema Claro' : 'Tema Escuro'}</span>
            </button>
          </div>

          {/* User Profile Card */}
          <div
            className={`flex items-center justify-between p-2 rounded-xl transition ${
              isDark ? 'hover:bg-neutral-800/70' : 'hover:bg-neutral-200/60'
            }`}
          >
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
              title="Abrir perfil e preferências"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-700 text-white flex items-center justify-center text-xs font-semibold shrink-0 uppercase border border-neutral-600">
                {currentUser.displayName ? currentUser.displayName.slice(0, 2) : 'LU'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate flex items-center gap-1">
                  <span>{currentUser.displayName}</span>
                  {currentUser.isVerifiedCreator && (
                    <span title="Criador Verificado">
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-neutral-500 truncate">
                  {currentUser.email || `@${currentUser.username}`}
                </div>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Sair da conta"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-700/40 transition shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
