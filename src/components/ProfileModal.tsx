import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Settings,
  Check,
  Volume2,
  Play,
  ShieldCheck,
  History,
  Award,
  Sparkles,
  Image as ImageIcon,
  Database,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { LunaTone, UserProfile, UserAccount } from '../types';
import { getLevelProgressDetails } from '../utils/progression';
import { LunaVerifiedBadge } from './LunaVerifiedBadge';
import { FemaleVoiceOption, LunaVoiceTone } from '../hooks/useSpeech';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  currentUser: UserAccount;
  onSaveProfile: (updated: UserProfile) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onMigrateLegacy?: () => void;
  isMigrating?: boolean;
  conversationsCount?: number;
  femaleVoices?: FemaleVoiceOption[];
  selectedVoiceURI?: string;
  voiceTone?: LunaVoiceTone;
  onSelectVoice?: (uri: string) => void;
  onSelectVoiceTone?: (tone: LunaVoiceTone) => void;
  onTestVoice?: (text: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentUser,
  onSaveProfile,
  theme = 'dark',
  onToggleTheme,
  onMigrateLegacy,
  isMigrating = false,
  conversationsCount = 0,
  femaleVoices = [],
  selectedVoiceURI = '',
  voiceTone = 'acolhedora',
  onSelectVoice,
  onSelectVoiceTone,
  onTestVoice,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'affinity' | 'providers' | 'history'>('profile');
  const [appInfo, setAppInfo] = useState<{
    hasGeminiKey?: boolean;
    hasMagicHourKey?: boolean;
    hasGoogleAuth?: boolean;
    hasPollenKey?: boolean;
    activeImageProvider?: string;
    magicHourAccount?: {
      configured: boolean;
      email?: string;
      tier?: string;
      credits?: number;
      error?: string;
    };
  } | null>(null);
  const [testingMagicHour, setTestingMagicHour] = useState(false);
  const [testResult, setTestResult] = useState<{ imageUrl?: string; provider?: string; error?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/app-info')
        .then((r) => r.json())
        .then((d) => setAppInfo(d))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleRunMagicHourTest = async () => {
    setTestingMagicHour(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Um lindo avatar brilhante da Lua estilizado em aquarela suave',
          aspectRatio: '1:1',
          userId: currentUser.id,
          provider: 'magichour',
        }),
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setTestResult({ imageUrl: data.imageUrl, provider: data.provider });
        // Refresh credits
        fetch('/api/app-info')
          .then((r) => r.json())
          .then((d) => setAppInfo(d))
          .catch(() => {});
      } else {
        setTestResult({ error: data.error || 'Falha no teste com Magic Hour.' });
      }
    } catch (e: any) {
      setTestResult({ error: e?.message || 'Erro de rede ao testar Magic Hour.' });
    } finally {
      setTestingMagicHour(false);
    }
  };

  if (!isOpen) return null;

  const toneOptions: Array<{ id: LunaTone; title: string; desc: string; icon: string }> = [
    {
      id: 'maduro',
      title: 'Maduro & Franco',
      desc: 'Seguro, autêntico, inteligente e direto, sem moralismos ou sermões.',
      icon: '🌙',
    },
    {
      id: 'carinhosa',
      title: 'Carinhosa & Acolhedora',
      desc: 'Afetuosa, empática, gentil e atenciosa com o seu bem-estar.',
      icon: '🌸',
    },
    {
      id: 'equilibrado',
      title: 'Equilibrada & Serena',
      desc: 'Gentil, clara, adaptável e com empatia construtiva.',
      icon: '⚖️',
    },
    {
      id: 'amiga',
      title: 'Amiga Espontânea',
      desc: 'Divertida, bem-humorada, brincalhona e companheira.',
      icon: '✨',
    },
    {
      id: 'romantica',
      title: 'Romântica & Doce',
      desc: 'Atenciosa, poética e afetuosa em conversas mais profundas.',
      icon: '💕',
    },
    {
      id: 'sabia',
      title: 'Sábia & Reflexiva',
      desc: 'Conselheira com reflexões calmas que trazem clareza mental.',
      icon: '🔮',
    },
    {
      id: 'direto',
      title: 'Direto & Prático',
      desc: 'Objetivo, ágil e sucinto, mantendo o respeito.',
      icon: '🎯',
    },
    {
      id: 'intelectual',
      title: 'Intelectual & Analítica',
      desc: 'Curiosa, detalhista e apaixonada por ciência e debates profundos.',
      icon: '📚',
    },
  ];

  const progress = getLevelProgressDetails(formData.affinityPoints);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-[#181818] border border-neutral-700 p-5 sm:p-6 shadow-2xl text-neutral-100 relative my-auto max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-semibold shrink-0 uppercase">
            {currentUser.displayName ? currentUser.displayName.slice(0, 2) : 'LU'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">
                {currentUser.displayName}
              </h2>
              {currentUser.isVerifiedCreator && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[10px] font-semibold text-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Criador Verificado
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              {currentUser.email || `@${currentUser.username}`}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-2 mb-4 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'profile'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <User className="w-3.5 h-3.5 text-neutral-400" />
            <span>Perfil & Tom</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('affinity')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'affinity'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nível (1 a 100)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'providers'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Imagens & Magic Hour</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'history'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Histórico & Nuvem</span>
          </button>
        </div>

        {/* TAB 1: Profile & Preferences */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Como a Luna deve te chamar? (Apelido ou Nome)
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Ex: Edgar, Meu bem, Docinho..."
                maxLength={40}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-neutral-500 text-white placeholder-neutral-500 text-sm outline-none transition"
              />
            </div>

            {/* Luna's Tone Selection */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                Personalidade e Tom da Luna:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {toneOptions.map((opt) => {
                  const isSelected = formData.tone === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, tone: opt.id })}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-800 border-emerald-500/80 shadow-2xs'
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>{opt.icon}</span> {opt.title}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-tight">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* About User */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Sobre você (informações que a Luna deve lembrar para contextualizar respostas):
              </label>
              <textarea
                value={formData.aboutUser}
                onChange={(e) => setFormData({ ...formData, aboutUser: e.target.value })}
                placeholder="Ex: Trabalho com desenvolvimento web, gosto de café, estudo inteligência artificial..."
                rows={3}
                maxLength={500}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-neutral-500 text-white placeholder-neutral-500 text-xs outline-none transition resize-none"
              />
            </div>

            {/* Voice auto play toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-xs font-medium text-neutral-200">Reprodução Automática de Voz</p>
                  <p className="text-[11px] text-neutral-500">
                    Ouvir as respostas da Luna por síntese de voz automaticamente
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.voiceAutoPlay}
                onChange={(e) => setFormData({ ...formData, voiceAutoPlay: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Exclusive Female Voices Selector */}
            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">Voz da Luna (Feminina pt-BR)</span>
                      <LunaVerifiedBadge size="sm" />
                    </div>
                    <p className="text-[10.5px] text-neutral-400">
                      Vozes exclusivamente femininas para Português do Brasil
                    </p>
                  </div>
                </div>
                {onTestVoice && (
                  <button
                    type="button"
                    onClick={() => onTestVoice('Oi meu bem! Sou a Luna, sua companheira de inteligência artificial. Estou muito feliz em conversar com você!')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium border border-neutral-700 flex items-center gap-1 cursor-pointer transition"
                    title="Ouvir teste de voz feminina"
                  >
                    <Play className="w-3 h-3 text-emerald-400" />
                    <span>Testar Voz</span>
                  </button>
                )}
              </div>

              {/* Female Voice Selection Dropdown */}
              {femaleVoices && femaleVoices.length > 0 ? (
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Voz Sintetizada:
                  </label>
                  <select
                    value={selectedVoiceURI}
                    onChange={(e) => onSelectVoice?.(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-neutral-200 focus:border-neutral-500 outline-none cursor-pointer"
                  >
                    {femaleVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI} className="bg-neutral-900 text-neutral-200">
                        {v.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-[11px] text-neutral-400 italic bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800">
                  Voz feminina padrão em Português do Brasil ativa.
                </p>
              )}

              {/* Voice Tone Profile */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
                  Estilo Acústico da Voz:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'acolhedora' as LunaVoiceTone, label: 'Acolhedora', desc: 'Doce & suave' },
                    { id: 'serena' as LunaVoiceTone, label: 'Serena', desc: 'Calma & madura' },
                    { id: 'expressiva' as LunaVoiceTone, label: 'Expressiva', desc: 'Viva & animada' },
                  ].map((t) => {
                    const active = voiceTone === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelectVoiceTone?.(t.id)}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                          active
                            ? 'bg-neutral-800 border-emerald-500 text-emerald-300'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <span className="text-xs font-semibold block">{t.label}</span>
                        <span className="text-[9.5px] opacity-75 block">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Salvo!</span>
                  </>
                ) : (
                  <span>Salvar Alterações</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Optional Affinity & Level Info */}
        {activeTab === 'affinity' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{progress.tierInfo.badge}</span>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Nível {progress.currentLevel} de 100 • {progress.tierInfo.tier}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {progress.tierInfo.title}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-white block">
                    {progress.totalAffinity.toLocaleString('pt-BR')} pts
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    {progress.isMaxLevel ? 'Nível Máximo' : `${progress.pointsNeededForNextLevel} pts p/ Nível ${progress.currentLevel + 1}`}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden mb-2">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-neutral-500">
                <span>Progresso do nível atual: {progress.progressPercent}%</span>
                <span>Pontos acumulativos sem limite</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 leading-relaxed space-y-1.5">
              <p className="font-semibold text-neutral-200">Como funciona a afinidade na Luna AI?</p>
              <p>
                Os pontos são atribuídos conforme você interage com a Luna (conversando com carinho, gerando ilustrações, editando fotos ou salvando memórias).
              </p>
              <p className="text-[11px] text-neutral-500">
                Essa seção é totalmente opcional e serve para registrar seu histórico de cumplicidade e uso da plataforma.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: AI Image Providers & Magic Hour */}
        {activeTab === 'providers' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Magic Hour Card */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Magic Hour AI Image Generator</h4>
                    <p className="text-[10.5px] text-neutral-400">api.magichour.ai/v1/ai-image-generator</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    appInfo?.hasMagicHourKey
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  {appInfo?.hasMagicHourKey ? 'Autenticado & Ativo' : 'Não Configurada'}
                </span>
              </div>

              {appInfo?.hasMagicHourKey && appInfo.magicHourAccount ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/80">
                    <span className="text-[10px] text-neutral-500 block">Conta Vinculada</span>
                    <span className="font-medium text-neutral-200 truncate block">
                      {appInfo.magicHourAccount.email || 'edgargames771@gmail.com'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/80">
                    <span className="text-[10px] text-neutral-500 block">Plano / Assinatura</span>
                    <span className="font-medium text-emerald-400 block capitalize">
                      Plano {appInfo.magicHourAccount.tier || 'Gratuito'} (Sem cobrança)
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/80">
                    <span className="text-[10px] text-neutral-500 block">Créditos Gratuitos</span>
                    <span className="font-bold text-white text-sm">
                      {appInfo.magicHourAccount.credits ?? 395}{' '}
                      <span className="text-[10px] text-neutral-400 font-normal">créditos</span>
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/80">
                    <span className="text-[10px] text-neutral-500 block">Custo por Imagem</span>
                    <span className="font-medium text-neutral-300 block">
                      5 créditos / imagem
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-300 leading-relaxed">
                  A Luna integra o motor Magic Hour AI para geração de imagens com controle de proporção (1:1, 9:16 e 16:9).
                </p>
              )}

              {/* Test Action */}
              {appInfo?.hasMagicHourKey && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleRunMagicHourTest}
                    disabled={testingMagicHour}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-700/60 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${testingMagicHour ? 'animate-spin' : ''}`} />
                    <span>
                      {testingMagicHour
                        ? 'Renderizando no Magic Hour...'
                        : 'Executar Teste de Imagem no Magic Hour'}
                    </span>
                  </button>

                  {testResult && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-2">
                      {testResult.error ? (
                        <p className="text-red-400 text-[11px]">{testResult.error}</p>
                      ) : (
                        <div className="flex items-center gap-3">
                          {testResult.imageUrl && (
                            <img
                              src={testResult.imageUrl}
                              alt="Teste Magic Hour"
                              className="w-16 h-16 rounded-lg object-cover border border-neutral-700 shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-emerald-400 font-medium text-[11px] block">
                              ✓ Teste executado com sucesso!
                            </span>
                            <span className="text-neutral-400 text-[10px] block">
                              Motor: {testResult.provider} • Saldo atualizado
                            </span>
                            {testResult.imageUrl && (
                              <a
                                href={testResult.imageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-indigo-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                              >
                                Ver em tamanho real <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pollinations Fallback Card */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Pollinations AI / Flux (Fallback Gratuito)</h4>
                    <p className="text-[10.5px] text-neutral-400">Ativo como contingência instantânea</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                  Pronto
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Garante que a Luna continue criando ilustrações e fotos mesmo quando a chave Magic Hour não estiver configurada ou atingir o limite de requisições.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: History & Persistence */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Banco de Dados Persistente</h4>
                    <p className="text-[10.5px] text-neutral-400">data/luna_db.json vinculado à sua conta</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-400">
                  {conversationsCount} conversas arquivadas
                </span>
              </div>

              <div className="text-xs text-neutral-300 leading-relaxed space-y-1.5">
                <p>
                  Suas mensagens e conversas são salvas tanto no servidor da Luna quanto no cache do dispositivo, vinculadas à conta <strong>{currentUser.email || currentUser.displayName}</strong>.
                </p>
                <p className="text-neutral-400 text-[11px]">
                  Ao sair da conta Google, fechar o aplicativo ou trocar de aba, seu histórico <strong>permanece intacto</strong> e é recarregado automaticamente no próximo acesso.
                </p>
              </div>

              {onMigrateLegacy && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onMigrateLegacy}
                    disabled={isMigrating}
                    className="w-full py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isMigrating ? 'animate-spin' : ''}`} />
                    <span>{isMigrating ? 'Escaneando e sincronizando mensagens...' : 'Procurar e Sincronizar Mensagens Anteriores'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
