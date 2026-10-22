import React, { useState } from 'react';
import {
  X,
  BookHeart,
  Plus,
  Trash2,
  Sparkles,
  Check,
  Shield,
  Search,
  Sliders,
  FileText,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Star,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';
import {
  MemoryItem,
  MemoryCategory,
  MemorySettings,
  KnowledgeDocument,
  FeedbackItem,
} from '../types';

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  memories: MemoryItem[];
  settings: MemorySettings;
  knowledge: KnowledgeDocument[];
  feedbacks: FeedbackItem[];
  onAddMemory: (
    category: MemoryCategory,
    content: string,
    confirmed: boolean,
    importance: number,
    tags: string[]
  ) => Promise<void>;
  onUpdateMemory: (
    id: string,
    content: string,
    category: MemoryCategory,
    confirmed: boolean,
    importance: number,
    tags: string[]
  ) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onDeleteAllMemories: () => Promise<void>;
  onUpdateSettings: (partial: Partial<MemorySettings>) => Promise<void>;
  onAddKnowledge: (title: string, category: string, content: string, tags: string[]) => Promise<void>;
  onDeleteKnowledge: (id: string) => Promise<void>;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  memories,
  settings,
  knowledge,
  feedbacks,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onDeleteAllMemories,
  onUpdateSettings,
  onAddKnowledge,
  onDeleteKnowledge,
}) => {
  const [activeTab, setActiveTab] = useState<'memories' | 'privacy' | 'knowledge' | 'feedback'>('memories');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // New Memory Form State
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('preference');
  const [newConfirmed, setNewConfirmed] = useState(true);
  const [newImportance, setNewImportance] = useState(4);
  const [newTags, setNewTags] = useState('');

  // Editing state
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<MemoryCategory>('preference');
  const [editConfirmed, setEditConfirmed] = useState(true);
  const [editImportance, setEditImportance] = useState(3);

  // New Knowledge Form State
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [knowTitle, setKnowTitle] = useState('');
  const [knowCategory, setKnowCategory] = useState('Geral');
  const [knowContent, setKnowContent] = useState('');
  const [knowTags, setKnowTags] = useState('');

  if (!isOpen) return null;

  const categories: Array<{ id: string; label: string; icon: string }> = [
    { id: 'all', label: 'Todas', icon: '✨' },
    { id: 'preference', label: 'Preferências', icon: '🌸' },
    { id: 'project', label: 'Projetos', icon: '💼' },
    { id: 'goal', label: 'Objetivos', icon: '🎯' },
    { id: 'fact', label: 'Fatos Confirmados', icon: '✅' },
    { id: 'correction', label: 'Correções', icon: '🛠️' },
  ];

  // Filter memories
  const filteredMemories = memories.filter((m) => {
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inContent = m.content.toLowerCase().includes(q);
      const inTags = m.tags.some((t) => t.toLowerCase().includes(q));
      return inContent || inTags;
    }
    return true;
  });

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    const tagList = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onAddMemory(newCategory, newContent.trim(), newConfirmed, newImportance, tagList);
    setNewContent('');
    setNewTags('');
    setShowAddForm(false);
  };

  const handleStartEdit = (m: MemoryItem) => {
    setEditingMemoryId(m.id);
    setEditContent(m.content);
    setEditCategory(m.category);
    setEditConfirmed(m.confirmed);
    setEditImportance(m.importance);
  };

  const handleSaveEdit = async () => {
    if (!editingMemoryId || !editContent.trim()) return;
    await onUpdateMemory(
      editingMemoryId,
      editContent.trim(),
      editCategory,
      editConfirmed,
      editImportance,
      []
    );
    setEditingMemoryId(null);
  };

  const handleCreateKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowTitle.trim() || !knowContent.trim()) return;
    const tagList = knowTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    await onAddKnowledge(knowTitle.trim(), knowCategory.trim(), knowContent.trim(), tagList);
    setKnowTitle('');
    setKnowContent('');
    setKnowTags('');
    setShowAddKnowledge(false);
  };

  const renderCategoryBadge = (cat: MemoryCategory) => {
    switch (cat) {
      case 'preference':
        return <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-medium border border-pink-500/30">Preferência</span>;
      case 'project':
        return <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-medium border border-blue-500/30">Projeto</span>;
      case 'goal':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-medium border border-emerald-500/30">Objetivo</span>;
      case 'correction':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-medium border border-amber-500/30">Correção</span>;
      case 'fact':
      default:
        return <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-medium border border-purple-500/30">Fato Confirmado</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-[#140827] border border-pink-500/30 shadow-2xl text-purple-100 relative my-auto animate-fadeIn max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-pink-500/20 flex items-center justify-between shrink-0 bg-[#160a2c]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 p-[2px] shadow-lg shadow-pink-500/20 shrink-0">
              <div className="w-full h-full bg-[#1b0d33] rounded-[14px] flex items-center justify-center text-pink-400">
                <BookHeart className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Memória da Luna</h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-700/50 text-[11px] text-pink-300 font-semibold">
                  {memories.length} memórias
                </span>
              </div>
              <p className="text-xs text-purple-300/80">
                Contexto seguro e isolado para <strong>{userName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-purple-400 hover:text-white p-1.5 rounded-lg hover:bg-purple-800/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-purple-900/60 px-4 shrink-0 bg-[#130724] overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setActiveTab('memories')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'memories'
                ? 'border-pink-500 text-pink-300'
                : 'border-transparent text-purple-400 hover:text-purple-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Memórias Pessoais ({memories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-pink-500 text-pink-300'
                : 'border-transparent text-purple-400 hover:text-purple-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Privacidade & Controles</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'knowledge'
                ? 'border-pink-500 text-pink-300'
                : 'border-transparent text-purple-400 hover:text-purple-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Base de Conhecimento ({knowledge.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'feedback'
                ? 'border-pink-500 text-pink-300'
                : 'border-transparent text-purple-400 hover:text-purple-200'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Feedbacks ({feedbacks.length})</span>
          </button>
        </div>

        {/* Tab 1: Memories List */}
        {activeTab === 'memories' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Search and Action Bar */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar memórias por palavra ou tag..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1d0d38] border border-pink-500/25 focus:border-pink-500 text-white placeholder-purple-400/40 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-1 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Memória</span>
                </button>

                {memories.length > 0 && (
                  <button
                    onClick={() => setShowDeleteAllConfirm(true)}
                    title="Apagar todas as memórias"
                    className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1 ${
                    selectedCategory === c.id
                      ? 'bg-pink-600/30 border border-pink-500 text-pink-200'
                      : 'bg-purple-950/50 border border-purple-800/40 text-purple-300 hover:border-purple-700'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>

            {/* Add Memory Form */}
            {showAddForm && (
              <form onSubmit={handleCreateMemory} className="p-4 rounded-xl bg-[#1e0f36] border border-pink-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-pink-400" /> Adicionar Informação à Memória
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-purple-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-200 mb-1">
                    Conteúdo da Memória:
                  </label>
                  <textarea
                    rows={2}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Ex: Trabalho no projeto de aplicativo móvel e prefiro respostas em tópicos..."
                    maxLength={300}
                    className="w-full px-3 py-2 rounded-xl bg-[#160a2b] border border-pink-500/25 focus:border-pink-500 text-white placeholder-purple-400/40 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-200 mb-1">
                      Categoria:
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#160a2b] border border-pink-500/25 text-white text-xs focus:outline-none"
                    >
                      <option value="preference">Preferência Pessoal</option>
                      <option value="project">Projeto em Andamento</option>
                      <option value="goal">Objetivo Pessoal</option>
                      <option value="fact">Fato Confirmado</option>
                      <option value="correction">Correção de Resposta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-purple-200 mb-1">
                      Importância (1 a 5 estrelas):
                    </label>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewImportance(star)}
                          className="p-1 text-xs"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= newImportance ? 'text-amber-400 fill-amber-400' : 'text-purple-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-200 mb-1">
                    Tags (separadas por vírgula):
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Ex: trabalho, café, rotina, tecnologia"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#160a2b] border border-pink-500/25 text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-purple-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newConfirmed}
                      onChange={(e) => setNewConfirmed(e.target.checked)}
                      className="w-3.5 h-3.5 accent-pink-500 rounded"
                    />
                    <span>Fato confirmado e autorizado explicitamente</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-xl bg-purple-900/40 text-purple-300 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs transition"
                  >
                    Salvar na Memória
                  </button>
                </div>
              </form>
            )}

            {/* Memories Cards */}
            <div className="space-y-2.5">
              {filteredMemories.length === 0 ? (
                <div className="text-center py-8 text-purple-400/60 text-xs italic bg-purple-950/20 rounded-xl p-4 border border-purple-900/30">
                  {searchQuery ? 'Nenhuma memória encontrada com esses termos.' : 'Nenhuma memória cadastrada nesta categoria.'}
                </div>
              ) : (
                filteredMemories.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-[#190c30] border border-purple-800/40 hover:border-pink-500/30 transition text-xs space-y-2 relative group"
                  >
                    {editingMemoryId === m.id ? (
                      /* Editing Form */
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#140827] border border-pink-500/40 text-white text-xs focus:outline-none"
                        />
                        <div className="flex items-center justify-between">
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as MemoryCategory)}
                            className="px-2 py-1 rounded bg-[#140827] border border-purple-700 text-purple-200 text-xs"
                          >
                            <option value="preference">Preferência</option>
                            <option value="project">Projeto</option>
                            <option value="goal">Objetivo</option>
                            <option value="fact">Fato</option>
                            <option value="correction">Correção</option>
                          </select>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setEditingMemoryId(null)}
                              className="px-2.5 py-1 rounded bg-purple-900/40 text-purple-300 text-xs"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Card Content */
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {renderCategoryBadge(m.category)}
                            {m.confirmed && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Confirmado
                              </span>
                            )}
                            <div className="flex items-center text-amber-400">
                              {Array.from({ length: m.importance }).map((_, i) => (
                                <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={() => handleStartEdit(m)}
                              className="p-1 rounded text-purple-400 hover:text-white hover:bg-purple-800/40"
                              title="Editar memória"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteMemory(m.id)}
                              className="p-1 rounded text-purple-400 hover:text-rose-400 hover:bg-rose-950/50"
                              title="Apagar memória"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-purple-100 leading-relaxed">{m.content}</p>

                        {/* Tags & Access Time */}
                        <div className="flex items-center justify-between text-[10.5px] text-purple-400/70 pt-1 border-t border-purple-900/30">
                          <div className="flex items-center gap-1 flex-wrap">
                            {m.tags.map((t, idx) => (
                              <span key={idx} className="bg-purple-950/80 px-1.5 py-0.5 rounded text-purple-300">
                                #{t}
                              </span>
                            ))}
                          </div>

                          {m.lastAccessedAt && (
                            <span className="flex items-center gap-1 text-pink-300/80">
                              <Clock className="w-3 h-3" /> Usada recentemente
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Privacy & Controls */}
        {activeTab === 'privacy' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Master Memory Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-purple-950/60 border border-pink-500/30">
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  Ativar Memória Persistente da Luna
                </p>
                <p className="text-xs text-purple-300/80 mt-0.5">
                  Quando ativada, a Luna resgata apenas memórias úteis e autorizadas para responder.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => onUpdateSettings({ enabled: e.target.checked })}
                className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
              />
            </div>

            {/* Granular Categories Controls */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                Quais tipos de informações a Luna pode salvar e usar?
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="p-3 rounded-xl bg-[#180c2f] border border-purple-800/40 flex items-center justify-between cursor-pointer hover:border-pink-500/30 transition">
                  <div className="pr-2">
                    <p className="text-xs font-semibold text-white">Preferências Pessoais</p>
                    <p className="text-[10.5px] text-purple-300/70">Tom, formato, horários e gostos</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowPreferences}
                    onChange={(e) => onUpdateSettings({ allowPreferences: e.target.checked })}
                    className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                  />
                </label>

                <label className="p-3 rounded-xl bg-[#180c2f] border border-purple-800/40 flex items-center justify-between cursor-pointer hover:border-pink-500/30 transition">
                  <div className="pr-2">
                    <p className="text-xs font-semibold text-white">Projetos em Andamento</p>
                    <p className="text-[10.5px] text-purple-300/70">Trabalhos e estudos ativos</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowProjects}
                    onChange={(e) => onUpdateSettings({ allowProjects: e.target.checked })}
                    className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                  />
                </label>

                <label className="p-3 rounded-xl bg-[#180c2f] border border-purple-800/40 flex items-center justify-between cursor-pointer hover:border-pink-500/30 transition">
                  <div className="pr-2">
                    <p className="text-xs font-semibold text-white">Objetivos & Metas</p>
                    <p className="text-[10.5px] text-purple-300/70">Planos e sonhos pessoais</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowGoals}
                    onChange={(e) => onUpdateSettings({ allowGoals: e.target.checked })}
                    className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                  />
                </label>

                <label className="p-3 rounded-xl bg-[#180c2f] border border-purple-800/40 flex items-center justify-between cursor-pointer hover:border-pink-500/30 transition">
                  <div className="pr-2">
                    <p className="text-xs font-semibold text-white">Correções de Respostas</p>
                    <p className="text-[10.5px] text-purple-300/70">Ajustes feitos via feedback</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowCorrections}
                    onChange={(e) => onUpdateSettings({ allowCorrections: e.target.checked })}
                    className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Retrieval Limit Slider */}
            <div className="p-4 rounded-xl bg-[#180c2f] border border-purple-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Limite de Memórias por Resposta</p>
                  <p className="text-[10.5px] text-purple-300/70">
                    A Luna recupera apenas as {settings.maxMemoriesInContext || 5} memórias mais relevantes para não sobrecarregar o contexto.
                  </p>
                </div>
                <span className="text-sm font-bold text-pink-400">
                  {settings.maxMemoriesInContext || 5} itens
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={settings.maxMemoriesInContext || 5}
                onChange={(e) => onUpdateSettings({ maxMemoriesInContext: parseInt(e.target.value, 10) })}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Privacy & Transparency Card */}
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-300 space-y-2 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Shield className="w-4 h-4 text-pink-400" />
                Segurança, Isolamento e Transparência
              </div>
              <ul className="space-y-1.5 text-[11px] list-disc list-inside text-purple-300/80">
                <li>Suas memórias são vinculadas exclusivamente à sua conta ({userName}) e nunca compartilhadas com outros usuários.</li>
                <li>As memórias ficam armazenadas no servidor de forma segura e não expõem senhas ou tokens.</li>
                <li><strong>O modelo de IA não tem seus parâmetros ou pesos modificados.</strong> O aprendizado ocorre exclusivamente por meio do contexto autorizado que a Luna consulta no início de cada resposta relevante.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Knowledge Base */}
        {activeTab === 'knowledge' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">Base de Conhecimento Geral</h3>
                <p className="text-[11px] text-purple-300/70">
                  Documentos autorizados e materiais que a Luna pode consultar (separados das suas memórias pessoais).
                </p>
              </div>

              <button
                onClick={() => setShowAddKnowledge(!showAddKnowledge)}
                className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Documento</span>
              </button>
            </div>

            {/* Add Knowledge Form */}
            {showAddKnowledge && (
              <form onSubmit={handleCreateKnowledge} className="p-4 rounded-xl bg-[#1e0f36] border border-pink-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Novo Documento de Conhecimento</span>
                  <button type="button" onClick={() => setShowAddKnowledge(false)} className="text-purple-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={knowTitle}
                    onChange={(e) => setKnowTitle(e.target.value)}
                    placeholder="Título do Documento..."
                    className="px-3 py-1.5 rounded-xl bg-[#160a2b] border border-pink-500/25 text-white text-xs focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={knowCategory}
                    onChange={(e) => setKnowCategory(e.target.value)}
                    placeholder="Categoria (ex: Saúde, Produtividade, Estudo)..."
                    className="px-3 py-1.5 rounded-xl bg-[#160a2b] border border-pink-500/25 text-white text-xs focus:outline-none"
                  />
                </div>

                <textarea
                  rows={3}
                  value={knowContent}
                  onChange={(e) => setKnowContent(e.target.value)}
                  placeholder="Conteúdo informativo ou instrução temática que a Luna pode consultar..."
                  className="w-full px-3 py-2 rounded-xl bg-[#160a2b] border border-pink-500/25 text-white text-xs focus:outline-none"
                  required
                />

                <input
                  type="text"
                  value={knowTags}
                  onChange={(e) => setKnowTags(e.target.value)}
                  placeholder="Palavras-chave / Tags (ex: foco, respiração, rotina)..."
                  className="w-full px-3 py-1.5 rounded-xl bg-[#160a2b] border border-pink-500/25 text-white text-xs focus:outline-none"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddKnowledge(false)}
                    className="px-3 py-1 rounded-xl bg-purple-900/40 text-purple-300 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs transition"
                  >
                    Salvar na Base
                  </button>
                </div>
              </form>
            )}

            {/* Knowledge List */}
            <div className="space-y-3">
              {knowledge.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl bg-[#190c30] border border-purple-800/40 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                        {doc.category}
                      </span>
                      <h4 className="font-bold text-white">{doc.title}</h4>
                    </div>

                    {!doc.isSystem && (
                      <button
                        onClick={() => onDeleteKnowledge(doc.id)}
                        className="text-purple-400 hover:text-rose-400 p-1"
                        title="Remover documento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-purple-200/90 leading-relaxed text-[11.5px]">{doc.content}</p>

                  <div className="flex items-center justify-between text-[10px] text-purple-400/60 pt-1 border-t border-purple-900/30">
                    <div className="flex gap-1">
                      {doc.tags.map((t, i) => (
                        <span key={i} className="bg-purple-950/80 px-1 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span>Autor: {doc.author || (doc.isSystem ? 'Sistema Luna' : 'Usuário')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Feedback History */}
        {activeTab === 'feedback' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-white">Histórico de Feedbacks e Correções</h3>
              <p className="text-[11px] text-purple-300/70">
                Avaliações que você enviou para orientar o comportamento e as respostas da Luna.
              </p>
            </div>

            {feedbacks.length === 0 ? (
              <div className="text-center py-8 text-purple-400/60 text-xs italic bg-purple-950/20 rounded-xl p-4 border border-purple-900/30">
                Nenhum feedback registrado ainda. Use os botões de curtir ou corrigir nas mensagens da Luna!
              </div>
            ) : (
              feedbacks.map((f) => (
                <div key={f.id} className="p-3 rounded-xl bg-[#190c30] border border-purple-800/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {f.rating === 'positive' ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                          <ThumbsUp className="w-3 h-3 text-emerald-400" /> Resposta Aprovada
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-pink-300 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-500/30">
                          <ThumbsDown className="w-3 h-3 text-pink-400" /> Correção Solicitada
                        </span>
                      )}

                      {f.savedAsPreference && (
                        <span className="text-[10px] text-purple-300 bg-purple-900/50 px-1.5 py-0.5 rounded">
                          ✓ Salvo na Memória
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-purple-400">
                      {new Date(f.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {f.correctionText && (
                    <div className="p-2 rounded-lg bg-purple-950/70 border border-purple-800/50 text-[11px] text-purple-100">
                      <strong>Sua orientação:</strong> {f.correctionText}
                    </div>
                  )}

                  <p className="text-[10px] text-purple-400/70 truncate">
                    Mensagem: "{f.lunaReply.slice(0, 80)}..."
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Delete All Confirmation Dialog */}
        {showDeleteAllConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="p-5 rounded-2xl bg-[#1e0a24] border border-rose-500/60 max-w-sm w-full space-y-3 animate-fadeIn text-xs">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Apagar Toda a Memória?</span>
              </div>
              <p className="text-rose-200/90 leading-relaxed">
                Tem certeza que deseja apagar todas as {memories.length} memórias de <strong>{userName}</strong>?
                Esta ação é irreversível e a Luna não lembrará mais das suas preferências anteriores.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-purple-900/60 text-purple-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    await onDeleteAllMemories();
                    setShowDeleteAllConfirm(false);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition"
                >
                  Sim, apagar tudo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
