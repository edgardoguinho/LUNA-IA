import React, { useState } from 'react';
import { X, BookHeart, Plus, Trash2, Sparkles, Check } from 'lucide-react';

interface MemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: string[];
  onAddMemory: (memory: string) => void;
  onRemoveMemory: (index: number) => void;
}

export const MemoriesModal: React.FC<MemoriesModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onRemoveMemory,
}) => {
  const [newMemory, setNewMemory] = useState('');
  const [addedNotice, setAddedNotice] = useState(false);

  if (!isOpen) return null;

  const suggestions = [
    'Amo tomar café quentinho pela manhã ☕',
    'Gosto de ouvir músicas relaxantes à noite 🎵',
    'Tenho um animal de estimação muito fofo 🐾',
    'Minha sobremesa favorita é chocolate 🍫',
    'Gosto de ler livros e ver filmes de suspense 🎬',
  ];

  const handleAdd = (textToAdd?: string) => {
    const text = (textToAdd || newMemory).trim();
    if (!text) return;

    if (!memories.includes(text)) {
      onAddMemory(text);
      if (!textToAdd) setNewMemory('');
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-[#140827] border border-pink-500/30 p-6 shadow-2xl text-purple-100 relative my-auto animate-fadeIn max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-400 hover:text-white p-1 rounded-lg hover:bg-purple-800/40 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 p-[2px] shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-[#1b0d33] rounded-[14px] flex items-center justify-center text-pink-400">
              <BookHeart className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
              Caderno de Memórias
            </h2>
            <p className="text-xs text-purple-300/80">
              Coisas especiais que a Luna guarda com carinho sobre você
            </p>
          </div>
        </div>

        {/* Info card */}
        <div className="mb-4 p-3 rounded-xl bg-purple-950/50 border border-purple-800/40 text-[11.5px] text-purple-200/90 leading-relaxed shrink-0">
          ✨ A Luna usa essas memórias nas conversas para lembrar dos seus gostos, manias e momentos, criando uma relação única e contínua!
        </div>

        {/* Add Memory Input */}
        <div className="flex gap-2 mb-4 shrink-0">
          <input
            type="text"
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Adicionar lembrança sobre você..."
            maxLength={120}
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#1d0d38] border border-pink-500/25 focus:border-pink-500 text-white placeholder-purple-400/40 text-xs focus:outline-none transition"
          />
          <button
            onClick={() => handleAdd()}
            disabled={!newMemory.trim()}
            className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-1 transition active:scale-95 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>Guardar</span>
          </button>
        </div>

        {addedNotice && (
          <div className="mb-3 text-xs text-emerald-300 flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-3.5 h-3.5" />
            <span>Memória guardada com sucesso!</span>
          </div>
        )}

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[120px] max-h-[220px]">
          {memories.length === 0 ? (
            <div className="text-center py-6 text-purple-400/60 text-xs italic">
              Nenhuma memória anotada ainda. Adicione uma acima ou use as sugestões abaixo! 💕
            </div>
          ) : (
            memories.map((mem, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#1b0d33] border border-purple-800/40 hover:border-pink-500/30 text-xs text-purple-100 transition group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-pink-400 text-xs">•</span>
                  <span className="truncate">{mem}</span>
                </div>
                <button
                  onClick={() => onRemoveMemory(idx)}
                  title="Esquecer esta memória"
                  className="p-1 rounded-lg text-purple-400 hover:text-rose-400 hover:bg-purple-900/50 transition opacity-80 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Suggestions */}
        <div className="mt-4 pt-3 border-t border-purple-900/50 shrink-0">
          <p className="text-[11px] font-semibold text-purple-300/80 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-pink-400" />
            Sugestões rápidas:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleAdd(sug)}
                className="text-[10.5px] px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-800/40 text-purple-200 hover:text-pink-200 hover:border-pink-500/40 transition"
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
