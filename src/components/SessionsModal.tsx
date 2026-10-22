import React, { useState } from 'react';
import { X, History, PlusCircle, Download, Trash2, Check, ShieldAlert } from 'lucide-react';
import { Message } from '../types';

interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onNewChat: () => void;
  onClearHistory: () => void;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({
  isOpen,
  onClose,
  messages,
  onNewChat,
  onClearHistory,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExportTxt = () => {
    let content = `=== Conversa com Luna AI ❤️ ===\nData: ${new Date().toLocaleString('pt-BR')}\nTotal de mensagens: ${messages.length}\n\n`;

    messages.forEach((m) => {
      const sender = m.role === 'user' ? 'Você' : 'Luna AI';
      const time = new Date(m.timestamp).toLocaleTimeString('pt-BR');
      content += `[${time}] ${sender}:\n${m.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luna-conversa-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setExportedSuccess(true);
    setTimeout(() => setExportedSuccess(false), 2500);
  };

  const handleConfirmClear = () => {
    onClearHistory();
    setShowConfirmClear(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-[#140827] border border-pink-500/30 p-6 shadow-2xl text-purple-100 relative my-auto animate-fadeIn">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-400 hover:text-white p-1 rounded-lg hover:bg-purple-800/40 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 p-[2px] shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-[#1b0d33] rounded-[14px] flex items-center justify-center text-purple-300">
              <History className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Histórico & Conversas</h2>
            <p className="text-xs text-purple-300/80">
              {messages.length} mensagens salvas localmente
            </p>
          </div>
        </div>

        {/* Action List */}
        <div className="space-y-3 mb-5">
          {/* New Chat */}
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#1d0d38] hover:bg-[#251048] border border-pink-500/20 hover:border-pink-500/40 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <PlusCircle className="w-5 h-5 text-pink-400 group-hover:scale-110 transition" />
              <div>
                <p className="text-xs font-bold text-white">Iniciar Nova Conversa</p>
                <p className="text-[11px] text-purple-300/70">
                  Comece um novo papo mantendo o perfil e memórias salvos
                </p>
              </div>
            </div>
          </button>

          {/* Export Conversation */}
          <button
            onClick={handleExportTxt}
            disabled={messages.length === 0}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#1d0d38] hover:bg-[#251048] border border-pink-500/20 hover:border-pink-500/40 transition text-left group disabled:opacity-40"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" />
              <div>
                <p className="text-xs font-bold text-white">Exportar Histórico</p>
                <p className="text-[11px] text-purple-300/70">
                  Baixe a conversa em arquivo de texto (.txt)
                </p>
              </div>
            </div>
            {exportedSuccess && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Clear History */}
          {!showConfirmClear ? (
            <button
              onClick={() => setShowConfirmClear(true)}
              disabled={messages.length === 0}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/30 transition text-left group disabled:opacity-40"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-rose-400 group-hover:scale-110 transition" />
                <div>
                  <p className="text-xs font-bold text-rose-200">Limpar Conversa Atual</p>
                  <p className="text-[11px] text-rose-300/70">
                    Apaga as mensagens da tela mantendo suas configurações
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500 text-xs text-rose-100 animate-fadeIn">
              <div className="flex items-center gap-2 mb-2 font-bold text-rose-300">
                <ShieldAlert className="w-4 h-4" />
                <span>Confirmar exclusão?</span>
              </div>
              <p className="text-[11px] text-rose-200 mb-3 leading-relaxed">
                Essa ação apagará as mensagens locais atuais. Não é possível desfazer.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmClear}
                  className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition"
                >
                  Sim, apagar
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-semibold transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Local Storage Privacy Note */}
        <p className="text-[11px] text-purple-300/60 text-center leading-relaxed">
          🔒 Todos os dados ficam salvos de forma privada no seu próprio navegador e são preservados durante as atualizações.
        </p>
      </div>
    </div>
  );
};
