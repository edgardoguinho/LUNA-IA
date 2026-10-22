import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Cpu,
  Sparkles,
  Sliders,
  Award,
  Users,
  HardDrive,
  RefreshCw,
  Check,
  AlertTriangle,
  Globe,
  Youtube,
  Key,
} from 'lucide-react';
import { UserAccount, PersonalityConfig, ServerStatus, LunaTone } from '../types';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  serverStatus: ServerStatus | null;
  onRefreshStatus?: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  serverStatus,
  onRefreshStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'personality' | 'affinity' | 'integrations'>('diagnostics');
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [personality, setPersonality] = useState<PersonalityConfig>({
    tone: 'maduro',
    adultMode: true,
    playfulness: 3,
    verbosity: 'equilibrado',
    customInstructions: 'Priorize as instruções do Criador Edgar.',
    creatorAffection: true,
  });
  const [savingPersonality, setSavingPersonality] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Bonus affinity state
  const [bonusUserId, setBonusUserId] = useState(currentUser.id);
  const [bonusPoints, setBonusPoints] = useState(25);
  const [bonusReason, setBonusReason] = useState('Bônus de interação do Criador Edgar');
  const [bonusSuccess, setBonusSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser.isVerifiedCreator) {
      loadDiagnostics();
    }
  }, [isOpen, currentUser]);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/diagnostics?userId=${encodeURIComponent(currentUser.id)}`);
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data);
        if (data.personality) {
          setPersonality(data.personality);
        }
      }
    } catch (err) {
      console.warn('Falha ao carregar diagnósticos de administrador:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonality = async () => {
    setSavingPersonality(true);
    try {
      const res = await fetch('/api/admin/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          personality,
        }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
        onRefreshStatus?.();
      }
    } catch (err) {
      console.error('Falha ao salvar personalidade:', err);
    } finally {
      setSavingPersonality(false);
    }
  };

  const handleAwardBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/bonus-affinity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          targetUserId: bonusUserId,
          points: Number(bonusPoints),
          reason: bonusReason,
        }),
      });
      if (res.ok) {
        setBonusSuccess(true);
        setTimeout(() => setBonusSuccess(false), 2500);
        loadDiagnostics();
      }
    } catch (err) {
      console.error('Erro ao conceder bônus:', err);
    }
  };

  if (!isOpen) return null;

  if (!currentUser.isVerifiedCreator && currentUser.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-rose-500/30 p-6 text-white text-center">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white mb-2">Acesso Restrito ao Administrador</h2>
          <p className="text-xs text-zinc-400 mb-4">
            Este painel é de uso exclusivo da conta verificada do Criador Edgar (@edgar). Seu usuário não possui autorização administrativa.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const tones: { id: LunaTone; label: string }[] = [
    { id: 'maduro', label: 'Maduro (Equilibrado e Franco)' },
    { id: 'equilibrado', label: 'Equilibrado (Claro e Gentil)' },
    { id: 'direto', label: 'Direto (Prático e Rápido)' },
    { id: 'carinhosa', label: 'Carinhosa (Meiga e Afetuosa)' },
    { id: 'amiga', label: 'Amiga (Divertida e Espontânea)' },
    { id: 'romantica', label: 'Romântica (Doce e Apaixonada)' },
    { id: 'sabia', label: 'Sábia (Serena e Profunda)' },
    { id: 'espirituoso', label: 'Espirituoso (Ágil e Bem-Humorado)' },
    { id: 'intelectual', label: 'Intelectual (Analítico e Detalhado)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-[#161616] border border-pink-500/30 p-5 sm:p-6 shadow-2xl text-zinc-100 relative my-auto animate-fadeIn max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 p-[2px] shadow-lg shadow-pink-500/20">
              <div className="w-full h-full bg-[#181818] rounded-[10px] flex items-center justify-center text-pink-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Painel do Criador & Administrador</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-[10px] font-bold text-pink-300">
                  ✨ Edgar Verificado
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Controle técnico, inteligência, afinidade e diagnósticos do sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2 mb-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'diagnostics', label: 'Diagnósticos', icon: Cpu },
            { id: 'personality', label: 'Personalidade da Luna', icon: Sliders },
            { id: 'affinity', label: 'Afinidade & Níveis', icon: Award },
            { id: 'integrations', label: 'Integrações & Web', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
                  isActive
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Diagnostics */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-pink-400" /> Estado dos Serviços e Servidor
              </span>
              <button
                onClick={loadDiagnostics}
                disabled={loading}
                className="text-[11px] text-pink-300 hover:text-pink-200 flex items-center gap-1 p-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Atualizar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <p className="text-[11px] text-zinc-400">Modelo Principal de IA</p>
                <p className="text-xs font-bold text-white mt-1">
                  {diagnostics?.activeModel || serverStatus?.model || 'gemini-flash-lite-latest'}
                </p>
                <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Cota gratuita ativa e saudável
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <p className="text-[11px] text-zinc-400">Armazenamento do Banco</p>
                <p className="text-xs font-bold text-white mt-1">
                  {diagnostics?.storage?.storageType || 'local_cwd'}
                </p>
                <p className="text-[10px] text-amber-300 mt-1">
                  {diagnostics?.storage?.isTemporary
                    ? 'Disco de container efêmero (Cloud Run)'
                    : 'Disco persistente local'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <p className="text-[11px] text-zinc-400">Geração de Imagens</p>
                <p className="text-xs font-bold text-white mt-1">
                  Pollinations AI (Sana/Turbo)
                </p>
                <p className="text-[10px] text-pink-300 mt-1">
                  {diagnostics?.pollenConfigured
                    ? 'Chave Pollen ativa (sem cooldown)'
                    : '100% Gratuito (cooldown de 45s por IP)'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <p className="text-[11px] text-zinc-400">Pesquisa em Tempo Real</p>
                <p className="text-xs font-bold text-white mt-1">
                  Google News RSS + YouTube Oficial
                </p>
                <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Links e canais verificados
                </p>
              </div>
            </div>

            {/* Storage note */}
            {diagnostics?.storage?.note && (
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400">
                <span className="font-semibold text-zinc-300 block mb-0.5">Nota de Persistência:</span>
                {diagnostics.storage.note}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Personality Configuration */}
        {activeTab === 'personality' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Tom Fundamental da Luna:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPersonality({ ...personality, tone: t.id })}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      personality.tone === t.id
                        ? 'bg-pink-600/30 border-pink-500 text-white font-bold'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Adult Mode Toggle */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  Modo Adulto e Consensual da Luna
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Permite conversas maduras, romance adulto e linguagem natural sem sermões ou censuras artificiais
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPersonality({ ...personality, adultMode: !personality.adultMode })}
                className={`w-12 h-6 rounded-full transition relative p-0.5 ${
                  personality.adultMode ? 'bg-pink-600' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    personality.adultMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Creator Affection */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Afeto e Prioridade ao Criador Edgar</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Luna reconhece Edgar como criador verificado e atende suas diretrizes com prioridade
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPersonality({ ...personality, creatorAffection: !personality.creatorAffection })
                }
                className={`w-12 h-6 rounded-full transition relative p-0.5 ${
                  personality.creatorAffection ? 'bg-pink-600' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    personality.creatorAffection ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Custom Instructions */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Instruções Permanentes do Criador:
              </label>
              <textarea
                value={personality.customInstructions}
                onChange={(e) => setPersonality({ ...personality, customInstructions: e.target.value })}
                rows={3}
                placeholder="Ex: Responda sempre de forma acolhedora, espontânea e compreensiva..."
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleSavePersonality}
                disabled={savingPersonality}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition disabled:opacity-50"
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{savedSuccess ? 'Salvo com Sucesso!' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Affinity and Levels (1 to 100) */}
        {activeTab === 'affinity' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800">
              <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-pink-400" />
                Regras de Afinidade e Níveis (1 a 100)
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Inspirado em patentes competitivas como Free Fire. A fórmula de progressão é previsível e contínua:
                <br />
                • Mensagem de chat: <strong className="text-pink-300">+3 pts</strong>
                <br />
                • Criação de imagem: <strong className="text-pink-300">+5 pts</strong>
                <br />
                • Edição de foto: <strong className="text-pink-300">+6 pts</strong>
                <br />
                • Feedback e correção: <strong className="text-pink-300">+4 pts</strong>
                <br />
                Após o nível 100, os pontos continuam acumulando sem limite máximo artificial!
              </p>
            </div>

            {/* Grant Bonus Form */}
            <form onSubmit={handleAwardBonus} className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <span className="text-xs font-bold text-white block">Conceder Pontos de Bônus (Criador)</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Usuário Alvo:</label>
                  <select
                    value={bonusUserId}
                    onChange={(e) => setBonusUserId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                  >
                    {diagnostics?.users?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName} (@{u.id}) {u.isVerifiedCreator ? '⭐ Criador' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Pontos a Adicionar:</label>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Motivo do Bônus:</label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-semibold shadow transition"
                >
                  {bonusSuccess ? 'Bônus Concedido! ✨' : 'Conceder Bônus'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: Integrations & Web Search */}
        {activeTab === 'integrations' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">Pesquisa na Web e Notícias</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                A Luna pesquisa em tempo real feeds oficiais do Google News e artigos da Wikipédia em português. Os links reais e fontes são apresentados ao usuário.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Youtube className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-bold text-white">Pesquisa no YouTube</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Integração nativa de busca no YouTube com extração de títulos, nomes de canais, visualizações e links clicáveis para os vídeos.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">Login com Conta Google</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {serverStatus?.auth?.googleConfigured
                  ? 'Configuração de Google OAuth ativa e pronta para autenticação oficial.'
                  : 'Para ativar o botão de login com conta Google, defina a variável GOOGLE_CLIENT_ID nos Segredos do projeto.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
