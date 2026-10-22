import React, { useState } from 'react';
import { X, User, Plus, Check, Shield, Users } from 'lucide-react';
import { UserAccount } from '../types';

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  users: UserAccount[];
  onSelectUser: (user: UserAccount) => void;
  onCreateUser: (username: string, displayName: string) => Promise<void>;
}

export const UserSwitchModal: React.FC<UserSwitchModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onSelectUser,
  onCreateUser,
}) => {
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setCreating(true);
    try {
      await onCreateUser(newUsername.trim(), newDisplayName.trim() || newUsername.trim());
      setNewUsername('');
      setNewDisplayName('');
      setShowNewUserForm(false);
    } catch (e) {
      console.error('Falha ao criar usuário:', e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-[#140827] border border-pink-500/30 p-6 shadow-2xl text-purple-100 relative my-auto animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-400 hover:text-white p-1 rounded-lg hover:bg-purple-800/40 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 p-[2px] shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-[#1b0d33] rounded-[14px] flex items-center justify-center text-pink-300">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Contas & Isolamento de Usuários</h2>
            <p className="text-xs text-purple-300/80">
              Cada perfil possui memórias, histórico e preferências 100% isolados
            </p>
          </div>
        </div>

        {/* User list */}
        <div className="space-y-2 mb-4">
          <label className="block text-xs font-semibold text-purple-200 mb-1">
            Selecione o perfil ativo:
          </label>
          {users.map((u) => {
            const isCurrent = u.id === currentUser.id;
            return (
              <button
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition ${
                  isCurrent
                    ? 'bg-pink-600/25 border-pink-500 shadow-md shadow-pink-500/10'
                    : 'bg-[#1b0d33] border-purple-800/40 hover:border-pink-500/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-900 flex items-center justify-center text-xs font-bold text-pink-300 border border-purple-700">
                    {u.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{u.displayName}</p>
                    <p className="text-[10.5px] text-purple-400">@{u.username}</p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                    <Check className="w-3 h-3 text-pink-400" /> Ativo
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* New user button/form */}
        {!showNewUserForm ? (
          <button
            onClick={() => setShowNewUserForm(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-purple-700 hover:border-pink-500 text-purple-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Perfil para Testar Isolamento</span>
          </button>
        ) : (
          <form onSubmit={handleCreate} className="p-3.5 rounded-xl bg-[#1c0d38] border border-pink-500/30 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Criar Perfil de Usuário</span>
              <button
                type="button"
                onClick={() => setShowNewUserForm(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Nome de Exibição (ex: Visitante, Mariana)..."
                className="w-full px-3 py-1.5 rounded-lg bg-[#140827] border border-pink-500/25 text-white text-xs focus:outline-none"
                required
              />
            </div>

            <div>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="Identificador único (ex: mariana)..."
                className="w-full px-3 py-1.5 rounded-lg bg-[#140827] border border-pink-500/25 text-white text-xs focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNewUserForm(false)}
                className="px-2.5 py-1 rounded bg-purple-900/40 text-purple-300 text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-3 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs transition"
              >
                {creating ? 'Criando...' : 'Salvar Perfil'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-purple-900/50 flex items-center gap-2 text-[11px] text-purple-300/80">
          <Shield className="w-3.5 h-3.5 text-pink-400 shrink-0" />
          <span>Isolamento garantido: as memórias de um usuário nunca são misturadas ou consultadas por outro perfil.</span>
        </div>
      </div>
    </div>
  );
};
