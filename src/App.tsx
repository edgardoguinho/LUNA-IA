import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertCircle,
  RefreshCw,
  BookHeart,
  Loader2,
} from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MessageItem } from './components/MessageItem';
import { TypingIndicator } from './components/TypingIndicator';
import { QuickPrompts } from './components/QuickPrompts';
import { ChatInput, AttachedImage } from './components/ChatInput';
import { OfflineBanner } from './components/OfflineBanner';
import { ProfileModal } from './components/ProfileModal';
import { MemoryPanel } from './components/MemoryPanel';
import { FeedbackModal } from './components/FeedbackModal';
import { AuthScreen } from './components/AuthScreen';
import { useSpeech } from './hooks/useSpeech';
import {
  Message,
  UserProfile,
  LunaStatus,
  ServerStatus,
  UserAccount,
  MemoryItem,
  MemoryCategory,
  MemorySettings,
  KnowledgeDocument,
  FeedbackItem,
  SearchSource,
  SavedConversationSummary,
} from './types';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'luna_auth_token',
  CURRENT_USER: 'luna_current_user_v2',
  PROFILE_PREFIX: 'luna_profile_',
  MESSAGES_PREFIX: 'luna_messages_',
  VOICE: 'luna_voice_enabled_v2',
  THEME: 'luna_theme',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Você',
  nickname: 'Você',
  tone: 'maduro',
  aboutUser: '',
  affinityPoints: 0,
  voiceAutoPlay: false,
};

const DEFAULT_SETTINGS: MemorySettings = {
  userId: '',
  enabled: true,
  allowPreferences: true,
  allowProjects: true,
  allowGoals: true,
  allowCorrections: true,
  allowKnowledgeRetrieval: true,
  maxMemoriesInContext: 5,
};

export default function App() {
  // Theme state: dark (ChatGPT style) or light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Sidebar & Navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<SavedConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isMigratingLegacy, setIsMigratingLegacy] = useState<boolean>(false);
  const hasMigratedRef = useRef(false);

  // Active Messages
  const [messages, setMessages] = useState<Message[]>([]);

  // Profile per user
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // Server-managed persistent memory, settings, knowledge, feedbacks
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [memorySettings, setMemorySettings] = useState<MemorySettings>(DEFAULT_SETTINGS);
  const [knowledge, setKnowledge] = useState<KnowledgeDocument[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  // Voice toggle
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOICE);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // UI state
  const [lunaStatus, setLunaStatus] = useState<LunaStatus>('online');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [statusChecking, setStatusChecking] = useState(false);

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(false);
  const [feedbackTargetMessage, setFeedbackTargetMessage] = useState<Message | null>(null);
  const [feedbackTargetPrompt, setFeedbackTargetPrompt] = useState('');
  const [pendingEditImage, setPendingEditImage] = useState<AttachedImage | null>(null);

  // Speech Hook (with exclusive female voices & tone controls)
  const {
    isSpeaking,
    currentSpeakingId,
    femaleVoices,
    selectedVoiceURI,
    voiceTone,
    selectVoice,
    selectVoiceTone,
    speak,
    stop,
  } = useSpeech();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync theme with document element class & localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Erro ao sincronizar tema:', e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 1. Initial Authentication & Session Verification
  useEffect(() => {
    const verifyInitialSession = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        setCurrentUser(null);
        setIsAuthChecking(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.user) {
            setCurrentUser(data.user);
            setAuthToken(token);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
            loadUserData(data.user.id, token);
            loadConversations(data.user.id, token);
            initUserChat(data.user);
          } else {
            performClientLogout();
          }
        } else {
          performClientLogout();
        }
      } catch (err) {
        console.warn('Erro ao checar sessão com backend:', err);
        const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            setCurrentUser(u);
            initUserChat(u);
          } catch {
            performClientLogout();
          }
        } else {
          performClientLogout();
        }
      } finally {
        setIsAuthChecking(false);
      }
    };

    verifyInitialSession();
  }, []);

  const initUserChat = (user: UserAccount) => {
    // 1. Check user-specific key and legacy keys
    const candidateKeys = [`${STORAGE_KEYS.MESSAGES_PREFIX}${user.id}`];
    if (user.id === 'user-edgar-default' || user.email === 'edgargames771@gmail.com') {
      candidateKeys.push('luna_messages_edgar', 'luna_messages', 'luna_chat_history', 'luna_messages_default');
    }

    for (const key of candidateKeys) {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hasUserMsg = parsed.some((m: any) => m && m.role === 'user');
            if (hasUserMsg) {
              setMessages(parsed);
              return;
            }
          }
        }
      } catch {}
    }

    setMessages([
      {
        id: `greeting-${Date.now()}`,
        role: 'model',
        text: `Oi, ${user.displayName}! ✨ Como posso te ajudar hoje?`,
        timestamp: Date.now(),
      },
    ]);
  };

  // Perform complete logout
  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
    } catch (e) {
      console.warn('Erro na chamada /api/auth/logout:', e);
    } finally {
      performClientLogout();
    }
  };

  const performClientLogout = () => {
    hasMigratedRef.current = false;
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {}
    setAuthToken(null);
    setCurrentUser(null);
    setMessages([]);
    setConversations([]);
    setCurrentConversationId(null);
    setMemories([]);
    stop();
  };

  // Auth Success Callback
  const handleAuthSuccess = (user: UserAccount, token: string) => {
    setAuthToken(token);
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch {}
    loadUserData(user.id, token);
    loadConversations(user.id, token);
    initUserChat(user);
  };

  // Synchronize localStorage on user change
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } catch (e) {
      console.warn('Erro ao salvar usuário ativo:', e);
    }
  }, [currentUser]);

  // Persist messages in localStorage per user
  useEffect(() => {
    if (!currentUser) return;
    try {
      const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${currentUser.id}`;
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (e) {
      console.warn('Erro ao salvar mensagens:', e);
    }
  }, [messages, currentUser]);

  // Persist profile in localStorage per user
  useEffect(() => {
    if (!currentUser) return;
    try {
      const key = `${STORAGE_KEYS.PROFILE_PREFIX}${currentUser.id}`;
      localStorage.setItem(key, JSON.stringify(profile));
    } catch (e) {
      console.warn('Erro ao salvar perfil:', e);
    }
  }, [profile, currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOICE, JSON.stringify(voiceEnabled));
    } catch {}
  }, [voiceEnabled]);

  // Load server-side data for active user (memories, settings, knowledge, feedbacks)
  const loadUserData = useCallback(async (userId: string, tokenParam?: string | null) => {
    const token = tokenParam || authToken || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const authHeaders: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-user-id': userId,
    };

    try {
      // 1. Load memories
      const memRes = await fetch(`/api/memories?userId=${userId}`, { headers: authHeaders });
      if (memRes.ok) {
        const mList = await memRes.json();
        setMemories(mList);
      }

      // 2. Load settings
      const setRes = await fetch(`/api/memories/settings?userId=${userId}`, { headers: authHeaders });
      if (setRes.ok) {
        const sData = await setRes.json();
        setMemorySettings(sData);
      }

      // 3. Load knowledge
      const knowRes = await fetch('/api/knowledge', { headers: authHeaders });
      if (knowRes.ok) {
        const kList = await knowRes.json();
        setKnowledge(kList);
      }

      // 4. Load feedbacks
      const fbRes = await fetch(`/api/feedback?userId=${userId}`, { headers: authHeaders });
      if (fbRes.ok) {
        const fbList = await fbRes.json();
        setFeedbacks(fbList);
      }
    } catch (e) {
      console.warn('Erro ao carregar dados do servidor:', e);
    }
  }, [authToken]);

  // Load conversations list for this authenticated user
  const loadConversations = useCallback(async (userId: string, tokenParam?: string | null) => {
    const token = tokenParam || authToken || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const authHeaders: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-user-id': userId,
    };

    try {
      const res = await fetch(`/api/conversations?userId=${userId}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.conversations)) {
          setConversations(data.conversations);

          // If the user has saved conversations on server, and active messages only has a greeting or is empty,
          // load the latest conversation so returning users don't see an empty screen!
          if (data.conversations.length > 0) {
            setMessages((prevMsgs) => {
              if (prevMsgs.length <= 1) {
                const latestId = data.conversations[0].id;
                fetch(`/api/conversations/${latestId}?userId=${userId}`, { headers: authHeaders })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.conversation?.messages && Array.isArray(d.conversation.messages)) {
                      setMessages(d.conversation.messages);
                      setCurrentConversationId(latestId);
                    }
                  })
                  .catch((e) => console.warn('Erro ao carregar última conversa:', e));
              }
              return prevMsgs;
            });
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar lista de conversas:', err);
    }
  }, [authToken]);

  // Rename a saved conversation
  const handleRenameConversation = async (convId: string, newTitle: string) => {
    if (!currentUser) return;
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    try {
      const res = await fetch(`/api/conversations/${convId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          title: newTitle,
          userId: currentUser.id,
        }),
      });

      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
        );
      }
    } catch (err) {
      console.warn('Erro ao renomear conversa:', err);
    }
  };

  // Safe scanner and migrator for legacy conversations stored in browser localStorage
  const scanAndMigrateLegacyConversations = useCallback(async (user: UserAccount, tokenParam?: string | null) => {
    if (!user) return;
    const token = tokenParam || authToken || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    setIsMigratingLegacy(true);

    const isCreatorAccount = Boolean(
      user.isVerifiedCreator ||
      user.id === 'user-edgar-default' ||
      user.email === 'edgargames771@gmail.com'
    );

    // Strictly separate legacy keys: only creator Edgar can import legacy keys from before multi-account.
    // Regular accounts (e.g., Mariana) must NEVER import or touch Edgar's legacy history!
    const legacyKeysToCheck: string[] = [`${STORAGE_KEYS.MESSAGES_PREFIX}${user.id}`];
    if (isCreatorAccount) {
      legacyKeysToCheck.push(
        'luna_messages_edgar',
        'luna_messages',
        'luna_messages_default',
        'luna_chat_history'
      );
    }

    const discoveredConversations: Array<{ id: string; title: string; messages: Message[] }> = [];

    for (const key of legacyKeysToCheck) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);

        // Case A: Array of Messages
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasUserMsg = parsed.some((m: any) => m && (m.role === 'user' || m.role === 'model'));
          if (hasUserMsg) {
            const firstUser = parsed.find((m: any) => m.role === 'user');
            const title = firstUser?.text ? firstUser.text.slice(0, 38).trim() : `Histórico (${key.replace('luna_', '')})`;
            discoveredConversations.push({
              id: `conv-legacy-${key}-${Date.now()}`,
              title,
              messages: parsed,
            });
          }
        }
        // Case B: Array of Conversations
        else if (Array.isArray(parsed?.conversations)) {
          for (const item of parsed.conversations) {
            if (Array.isArray(item.messages) && item.messages.length > 0) {
              discoveredConversations.push({
                id: item.id || `conv-legacy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                title: item.title || 'Conversa Recuperada',
                messages: item.messages,
              });
            }
          }
        }
      } catch (e) {
        // ignore parse error
      }
    }

    if (discoveredConversations.length > 0) {
      console.log(`[Luna Migration] ${discoveredConversations.length} conjunto(s) de mensagens legadas identificados.`);

      // If active chat currently only has a greeting or is empty, restore the richest conversation!
      setMessages((currentMsgs) => {
        if (!currentMsgs || currentMsgs.length <= 1) {
          const richest = [...discoveredConversations].sort((a, b) => b.messages.length - a.messages.length)[0];
          if (richest && richest.messages.length > 0) {
            console.log(`[Luna Migration] Restaurando conversa ativa mais rica (${richest.messages.length} msgs).`);
            setCurrentConversationId(richest.id);
            return richest.messages;
          }
        }
        return currentMsgs;
      });

      // Send to server to persist permanently in data/luna_db.json
      try {
        const authHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const res = await fetch('/api/conversations/migrate-legacy', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            userId: user.id,
            legacyItems: discoveredConversations,
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          console.log(`[Luna Migration] Migração concluída no servidor:`, resData);
          await loadConversations(user.id, token);
        }
      } catch (err) {
        console.warn('[Luna Migration] Falha na sincronização com servidor:', err);
      }
    }

    setIsMigratingLegacy(false);
  }, [authToken]);

  // Auto-run legacy scan once on user login or session recovery
  useEffect(() => {
    if (currentUser && !hasMigratedRef.current) {
      hasMigratedRef.current = true;
      scanAndMigrateLegacyConversations(currentUser);
    }
  }, [currentUser, scanAndMigrateLegacyConversations]);

  // Select / Open a saved conversation
  const handleSelectConversation = async (convId: string) => {
    if (!currentUser) return;
    const authHeaders: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    try {
      const res = await fetch(`/api/conversations/${convId}?userId=${currentUser.id}`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversation?.messages && Array.isArray(data.conversation.messages)) {
          setMessages(data.conversation.messages);
          setCurrentConversationId(convId);
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar conversa selecionada:', err);
    }
  };

  // Start fresh chat
  const handleNewChat = () => {
    stop();
    setCurrentConversationId(null);
    setMessages([
      {
        id: `greeting-${Date.now()}`,
        role: 'model',
        text: `Oi, ${profile.nickname || currentUser?.displayName || 'meu bem'}! ✨ O que você gostaria de conversar ou criar agora?`,
        timestamp: Date.now(),
      },
    ]);
  };

  // Delete conversation
  const handleDeleteConversation = async (convId: string) => {
    if (!currentUser) return;
    const authHeaders: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    try {
      await fetch(`/api/conversations/${convId}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConversationId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.warn('Erro ao remover conversa:', err);
    }
  };

  // Auto-save active conversation to backend
  const saveCurrentConversation = async (updatedMsgs: Message[]) => {
    if (!currentUser || updatedMsgs.length <= 1) return;
    const convId = currentConversationId || `conv-${Date.now()}`;
    const firstUserMsg = updatedMsgs.find((m) => m.role === 'user');
    const title = firstUserMsg ? firstUserMsg.text.slice(0, 38).trim() : 'Conversa com Luna';

    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          id: convId,
          title,
          messages: updatedMsgs,
          userId: currentUser.id,
        }),
      });

      if (res.ok) {
        if (!currentConversationId) {
          setCurrentConversationId(convId);
        }
        loadConversations(currentUser.id);
      }
    } catch (e) {
      console.warn('Erro ao persistir conversa:', e);
    }
  };

  // Server health check
  const checkServerStatus = useCallback(async () => {
    setStatusChecking(true);
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch {
      setServerStatus(null);
    } finally {
      setStatusChecking(false);
    }
  }, []);

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 25000);
    return () => clearInterval(interval);
  }, [checkServerStatus]);

  // Auto-scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  // Memory Handlers
  const handleAddMemory = async (
    category: MemoryCategory,
    content: string,
    confirmed: boolean,
    importance: number,
    tags: string[]
  ) => {
    if (!currentUser) return;
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: currentUser.id,
          category,
          content,
          confirmed,
          importance,
          tags,
        }),
      });
      if (res.ok) {
        const mem = await res.json();
        setMemories((prev) => [mem, ...prev]);
        setProfile((prev) => ({ ...prev, affinityPoints: prev.affinityPoints + 5 }));
      }
    } catch (e) {
      console.error('Erro ao adicionar memória:', e);
    }
  };

  const handleUpdateMemory = async (
    id: string,
    content: string,
    category: MemoryCategory,
    confirmed: boolean,
    importance: number,
    tags: string[]
  ) => {
    if (!currentUser) return;
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    try {
      const res = await fetch(`/api/memories/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          userId: currentUser.id,
          content,
          category,
          confirmed,
          importance,
          tags,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)));
      }
    } catch (e) {
      console.error('Erro ao atualizar memória:', e);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!currentUser) return;
    const authHeaders: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    try {
      const res = await fetch(`/api/memories/${id}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (e) {
      console.error('Erro ao apagar memória:', e);
    }
  };

  const handleDeleteAllMemories = async () => {
    if (!currentUser) return;
    const authHeaders: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    try {
      const res = await fetch(`/api/memories?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        setMemories([]);
      }
    } catch (e) {
      console.error('Erro ao apagar todas memórias:', e);
    }
  };

  const handleUpdateSettings = async (partial: Partial<MemorySettings>) => {
    if (!currentUser) return;
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    try {
      const res = await fetch('/api/memories/settings', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ userId: currentUser.id, ...partial }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMemorySettings(updated);
      }
    } catch (e) {
      console.error('Erro ao atualizar configurações:', e);
    }
  };

  // Knowledge base handlers
  const handleAddKnowledge = async (title: string, category: string, content: string, tags: string[]) => {
    if (!currentUser) return;
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ title, category, content, tags, author: currentUser.displayName }),
      });
      if (res.ok) {
        const doc = await res.json();
        setKnowledge((prev) => [doc, ...prev]);
      }
    } catch (e) {
      console.error('Erro ao adicionar conhecimento:', e);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    const authHeaders: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE', headers: authHeaders });
      if (res.ok) {
        setKnowledge((prev) => prev.filter((k) => k.id !== id));
      }
    } catch (e) {
      console.error('Erro ao remover conhecimento:', e);
    }
  };

  // Feedback Handlers
  const handleThumbsUp = async (msg: Message) => {
    if (!currentUser) return;
    const msgIdx = messages.findIndex((m) => m.id === msg.id);
    const precedingUser = [...messages.slice(0, msgIdx)].reverse().find((m) => m.role === 'user');
    const promptText = precedingUser ? precedingUser.text : '';

    const authHeaders = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: currentUser.id,
          messageId: msg.id,
          userPrompt: promptText,
          lunaReply: msg.text,
          rating: 'positive',
        }),
      });

      if (res.ok) {
        const fb = await res.json();
        setFeedbacks((prev) => [fb, ...prev]);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, feedbackGiven: 'positive' } : m))
        );
        setProfile((prev) => ({ ...prev, affinityPoints: prev.affinityPoints + 3 }));
      }
    } catch (e) {
      console.error('Erro ao registrar feedback positivo:', e);
    }
  };

  const handleOpenFeedback = (msg: Message) => {
    const msgIdx = messages.findIndex((m) => m.id === msg.id);
    const precedingUser = [...messages.slice(0, msgIdx)].reverse().find((m) => m.role === 'user');
    setFeedbackTargetPrompt(precedingUser ? precedingUser.text : '');
    setFeedbackTargetMessage(msg);
  };

  const handleSubmitFeedback = async (
    messageId: string,
    rating: 'positive' | 'negative',
    correctionText?: string,
    saveAsPreference?: boolean
  ) => {
    if (!currentUser) return;
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: currentUser.id,
          messageId,
          userPrompt: feedbackTargetPrompt,
          lunaReply: feedbackTargetMessage?.text || '',
          rating,
          correctionText,
          saveAsPreference,
        }),
      });

      if (res.ok) {
        const fb = await res.json();
        setFeedbacks((prev) => [fb, ...prev]);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, feedbackGiven: rating } : m))
        );

        if (saveAsPreference) {
          const mRes = await fetch(`/api/memories?userId=${currentUser.id}`, { headers: authHeaders });
          if (mRes.ok) {
            const mList = await mRes.json();
            setMemories(mList);
          }
        }
      }
    } catch (e) {
      console.error('Erro ao submeter feedback:', e);
    }
  };

  // Helpers to detect and parse image creation requests from natural language
  const isImageCreationCommand = (t: string) =>
    (/(^|\b)(crie|criar|gere|gerar|gera|fa[çc]a|fazer|desenhe|desenhar|produza|produzir)\s+(um\s+|uma\s+)?(imagem|foto|desenho|ilustra[çc][ãa]o|arte|wallpaper|retrato|pintura)\b/i.test(t) ||
     /(^|\b)(desenhe|desenhar|ilustre|ilustrar)\s+(pra\s+mim\s+|para\s+mim\s+)?(um|uma|o|a|[a-z])/i.test(t) ||
     /(^|\b)(quero|mostre|mostra)\s+(uma\s+)?(imagem|foto|desenho|ilustra[çc][ãa]o)\s+(de\s+|com\s+|sobre\s+)/i.test(t) ||
     /(\bgerar imagem\b|\bcriar imagem\b|\bdesenhe pra mim\b)/i.test(t));

  const cleanImagePrompt = (raw: string): string => {
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^(luna[,!:]?\s*)?/i, '');
    cleaned = cleaned.replace(/^(por\s+favor\s*[,:]?\s*)?/i, '');
    cleaned = cleaned.replace(/^(crie|criar|gere|gerar|gera|fa[çc]a|fazer|desenhe|desenhar|produza|produzir)\s+(um\s+|uma\s+)?(imagem|foto|desenho|ilustra[çc][ãa]o|arte|wallpaper|retrato|pintura)\s*(de\s+|com\s+|sobre\s+|para\s+)?/i, '');
    cleaned = cleaned.replace(/^(desenhe|desenhar|ilustre|ilustrar)\s*(pra\s+mim\s+|para\s+mim\s+)?(de\s+|com\s+|um\s+|uma\s+)?/i, '');
    cleaned = cleaned.replace(/^(quero|mostre|mostra)\s+(uma\s+)?(imagem|foto|desenho|ilustra[çc][ãa]o)\s*(de\s+|com\s+|sobre\s+)?/i, '');
    cleaned = cleaned.replace(/,?\s*(no\s+)?formato\s*(vertical|horizontal|quadrado|story|stories|\d+:\d+).*$/i, '');
    return cleaned.trim() || raw.trim();
  };

  const detectAspectRatio = (raw: string): string => {
    if (/(9:16|vertical|story|stories|em pé)/i.test(raw)) return '9:16';
    if (/(16:9|horizontal|paisagem|deitada|wallpaper)/i.test(raw)) return '16:9';
    if (/(4:3)/i.test(raw)) return '4:3';
    if (/(3:4)/i.test(raw)) return '3:4';
    return '1:1';
  };

  // Send message to Gemini via server-side /api/chat with intelligent memory retrieval & multimodal vision
  const handleSendMessage = async (text: string, attachedImg?: AttachedImage | null) => {
    if (!currentUser) return;
    const trimmedText = text.trim();
    if ((!trimmedText && !attachedImg) || isLoading) return;

    // Direct interception: create image
    if (!attachedImg && isImageCreationCommand(trimmedText)) {
      const cleanPrompt = cleanImagePrompt(trimmedText);
      const ratio = detectAspectRatio(trimmedText);
      await handleGenerateImage(cleanPrompt, ratio, trimmedText);
      return;
    }

    // Direct interception: edit image
    const isImageEditRequest =
      Boolean(attachedImg?.data) &&
      (/(edite|editar|edita|transforme|transformar|transforma|altere|alterar|altera|modifique|modificar|modifica|mudar|trocar|coloque|colocar|bota|botar|adicione|adicionar|inclua|incluir|junto|ao\s+meu\s+lado|do\s+meu\s+lado|comigo|remova|remover|tire|tirar|fundo|versão\s+artística)/i.test(
        trimmedText
      ) ||
        trimmedText.toLowerCase().startsWith('luna, por favor edite') ||
        trimmedText.toLowerCase().includes('edite esta foto') ||
        trimmedText.toLowerCase().includes('edite esta imagem'));

    if (isImageEditRequest && attachedImg?.data) {
      await handleEditImageSubmit(attachedImg.data, attachedImg.mimeType, trimmedText);
      return;
    }

    const userMessageId = `user-${Date.now()}`;
    const newUserMessage: Message = {
      id: userMessageId,
      role: 'user',
      text: trimmedText || '📸 Foto enviada para análise da Luna',
      imageUrl: attachedImg ? attachedImg.data : undefined,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    setProfile((prev) => ({
      ...prev,
      affinityPoints: prev.affinityPoints + (attachedImg ? 5 : 2),
    }));

    setIsLoading(true);
    setLunaStatus('thinking');

    const modelMessageId = `luna-${Date.now()}`;
    const placeholderMessage: Message = {
      id: modelMessageId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
    };
    setMessages([...updatedMessages, placeholderMessage]);

    try {
      const historyPayload = messages
        .filter((m) => !m.isError && m.text.trim() !== '')
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const token = authToken || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-user-id': currentUser.id,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          message: trimmedText,
          history: historyPayload,
          userId: currentUser.id,
          userProfile: {
            name: currentUser.displayName,
            nickname: profile.nickname || currentUser.displayName,
            tone: profile.tone,
            aboutUser: profile.aboutUser,
          },
          image: attachedImg
            ? {
                data: attachedImg.data,
                mimeType: attachedImg.mimeType,
                name: attachedImg.name,
              }
            : null,
          stream: true,
          messageId: userMessageId,
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = {};
        }
        throw new Error(errorData.error || `Erro de comunicação com o servidor (${response.status})`);
      }

      setLunaStatus('typing');

      // Check content-type to handle direct JSON responses
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const jsonData = await response.json();
        const replyText = jsonData.reply || 'Oi meu bem! Estou aqui com você.';
        const genImg = jsonData.generatedImageUrl;
        const finalMsgs: Message[] = [
          ...updatedMessages,
          {
            id: modelMessageId,
            role: 'model',
            text: replyText,
            timestamp: Date.now(),
            generatedImageUrl: genImg,
            sources: jsonData.sources,
            usedSearch: Boolean(jsonData.sources && jsonData.sources.length > 0),
          },
        ];
        setMessages(finalMsgs);
        saveCurrentConversation(finalMsgs);

        if (voiceEnabled || profile.voiceAutoPlay) {
          speak(replyText, modelMessageId);
        }
        setLunaStatus('loving');
        setTimeout(() => setLunaStatus('online'), 2500);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Não foi possível iniciar o fluxo de transmissão com a Luna.');
      }

      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let returnedGeneratedImage: string | undefined;
      let retrievedMemoriesCount = 0;
      let buffer = '';
      let streamError: string | null = null;
      let returnedSources: SearchSource[] | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                accumulatedText += parsed.chunk;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === modelMessageId ? { ...m, text: accumulatedText } : m
                  )
                );
              }
              if (parsed.fullText && !accumulatedText) {
                accumulatedText = parsed.fullText;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === modelMessageId ? { ...m, text: accumulatedText } : m
                  )
                );
              }
              if (parsed.generatedImageUrl) {
                returnedGeneratedImage = parsed.generatedImageUrl;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === modelMessageId ? { ...m, generatedImageUrl: parsed.generatedImageUrl } : m
                  )
                );
              }
              if (parsed.retrievedMemoriesCount !== undefined) {
                retrievedMemoriesCount = parsed.retrievedMemoriesCount;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === modelMessageId
                      ? { ...m, retrievedMemoriesCount: parsed.retrievedMemoriesCount }
                      : m
                  )
                );
              }
              if (parsed.sources && Array.isArray(parsed.sources)) {
                returnedSources = parsed.sources;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === modelMessageId
                      ? {
                          ...m,
                          sources: parsed.sources,
                          usedSearch: parsed.sources.length > 0,
                        }
                      : m
                  )
                );
              }
              if (parsed.error) {
                streamError = parsed.error;
              }
            } catch (err: any) {
              if (err.message && err.message !== 'Unexpected end of JSON input') {
                console.warn('Chunk SSE incompleto:', err);
              }
            }
          }
        }
      }

      if (buffer.trim()) {
        const remainingLines = buffer.split('\n');
        for (const line of remainingLines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (parsed.chunk) accumulatedText += parsed.chunk;
              if (parsed.fullText && !accumulatedText) accumulatedText = parsed.fullText;
              if (parsed.generatedImageUrl) {
                returnedGeneratedImage = parsed.generatedImageUrl;
              }
              if (parsed.sources && Array.isArray(parsed.sources)) {
                returnedSources = parsed.sources;
              }
              if (parsed.error) streamError = parsed.error;
            } catch {}
          }
        }
      }

      if (streamError) {
        throw new Error(streamError);
      }

      // Fallback to direct fetch if stream ended empty
      if (!accumulatedText.trim()) {
        console.warn('Stream vazio, executando fallback direto...');
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            message: trimmedText,
            history: historyPayload.slice(0, -1),
            userId: currentUser.id,
            userProfile: {
              name: currentUser.displayName,
              nickname: profile.nickname || currentUser.displayName,
              tone: profile.tone,
              aboutUser: profile.aboutUser,
            },
            image: attachedImg
              ? {
                  data: attachedImg.data,
                  mimeType: attachedImg.mimeType,
                  name: attachedImg.name,
                }
              : null,
            stream: false,
          }),
        });

        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData?.reply) {
            accumulatedText = fallbackData.reply;
            returnedGeneratedImage = fallbackData.generatedImageUrl;
            returnedSources = fallbackData.sources;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === modelMessageId
                  ? {
                      ...m,
                      text: accumulatedText,
                      generatedImageUrl: returnedGeneratedImage,
                      sources: returnedSources,
                      usedSearch: Boolean(returnedSources && returnedSources.length > 0),
                    }
                  : m
              )
            );
          }
        }
      }

      if (!accumulatedText.trim()) {
        throw new Error('A inteligência artificial não retornou resposta no momento. Por favor tente novamente.');
      }

      const finalMsgs: Message[] = [
        ...updatedMessages,
        {
          id: modelMessageId,
          role: 'model',
          text: accumulatedText,
          timestamp: Date.now(),
          generatedImageUrl: returnedGeneratedImage,
          sources: returnedSources,
          usedSearch: Boolean(returnedSources && returnedSources.length > 0),
        },
      ];
      saveCurrentConversation(finalMsgs);

      if (voiceEnabled || profile.voiceAutoPlay) {
        speak(accumulatedText, modelMessageId);
      }

      setLunaStatus('loving');
      setTimeout(() => setLunaStatus('online'), 2500);
    } catch (err: any) {
      console.error('Falha no envio:', err);
      const errText =
        err?.message ||
        'Não consegui me conectar com a IA da Luna no momento. Verifique sua conexão ou tente novamente.';

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === modelMessageId);
        if (exists) {
          return prev.map((m) =>
            m.id === modelMessageId
              ? { ...m, text: `Ops, amor... ${errText}`, isError: true }
              : m
          );
        }
        return [
          ...prev,
          {
            id: modelMessageId,
            role: 'model',
            text: `Ops, amor... ${errText}`,
            isError: true,
            timestamp: Date.now(),
          },
        ];
      });
      setLunaStatus('online');
    } finally {
      setIsLoading(false);
    }
  };

  // Direct AI Image Generator handler
  const handleGenerateImage = async (
    prompt: string,
    aspectRatio = '1:1',
    userDisplayText?: string,
    provider: 'auto' | 'magichour' | 'pollinations' = 'auto'
  ) => {
    if (!currentUser) return;
    const userMsgId = `user-${Date.now()}`;
    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      text: userDisplayText || `Luna, crie uma imagem de: ${prompt.trim()}`,
      timestamp: Date.now(),
    };

    const updated = [...messages, newUserMessage];
    setMessages(updated);
    setIsLoading(true);
    setLunaStatus('thinking');

    const modelMsgId = `luna-${Date.now()}`;
    const token = authToken || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-user-id': currentUser.id,
    };

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ prompt: prompt.trim(), aspectRatio, userId: currentUser.id, provider }),
      });

      if (!res.ok) {
        let errData: any = {};
        try {
          errData = await res.json();
        } catch {}
        throw new Error(errData?.error || 'Erro ao gerar imagem.');
      }

      const data = await res.json();
      const providerLabel = data.provider === 'magichour' ? 'Magic Hour AI ✨' : 'Pollinations AI 🎨';
      const finalMsgs: Message[] = [
        ...updated,
        {
          id: modelMsgId,
          role: 'model',
          text: `Criei essa imagem especialmente para você (${providerLabel})! ✨🎨 Me diz o que achou dela! 💕`,
          generatedImageUrl: data.imageUrl,
          timestamp: Date.now(),
        },
      ];
      setMessages(finalMsgs);
      saveCurrentConversation(finalMsgs);
      setProfile((prev) => ({ ...prev, affinityPoints: prev.affinityPoints + 5 }));
      setLunaStatus('loving');
      setTimeout(() => setLunaStatus('online'), 2500);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: modelMsgId,
          role: 'model',
          text: `Ops amor, tive uma dificuldade para criar essa imagem: ${err?.message || 'Tente novamente em instantes'}.`,
          isError: true,
          timestamp: Date.now(),
        },
      ]);
      setLunaStatus('online');
    } finally {
      setIsLoading(false);
    }
  };

  // Direct AI Image Editor handler
  const handleEditImageSubmit = async (imageBase64: string, mimeType: string, userPrompt: string) => {
    if (!currentUser) return;
    const userMsgId = `user-${Date.now()}`;
    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      text: userPrompt,
      imageUrl: imageBase64,
      timestamp: Date.now(),
    };

    const updated = [...messages, newUserMessage];
    setMessages(updated);
    setIsLoading(true);
    setLunaStatus('thinking');

    const modelMsgId = `luna-${Date.now()}`;
    const token = authToken || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-user-id': currentUser.id,
    };

    try {
      const res = await fetch('/api/edit-image', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          image: { data: imageBase64, mimeType },
          prompt: userPrompt,
          userId: currentUser.id,
        }),
      });

      if (!res.ok) {
        let errData: any = {};
        try {
          errData = await res.json();
        } catch {}
        throw new Error(errData?.error || 'Erro ao editar imagem.');
      }

      const data = await res.json();
      const finalMsgs: Message[] = [
        ...updated,
        {
          id: modelMsgId,
          role: 'model',
          text: data.description || 'Fiz a edição da sua foto com todo carinho! Olha só o resultado 💕✨',
          generatedImageUrl: data.imageUrl,
          timestamp: Date.now(),
        },
      ];
      setMessages(finalMsgs);
      saveCurrentConversation(finalMsgs);
      setProfile((prev) => ({ ...prev, affinityPoints: prev.affinityPoints + 5 }));
      setLunaStatus('loving');
      setTimeout(() => setLunaStatus('online'), 2500);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: modelMsgId,
          role: 'model',
          text: `Ops amor, tive uma dificuldade para editar essa imagem: ${err?.message || 'Tente novamente em instantes'}.`,
          isError: true,
          timestamp: Date.now(),
        },
      ]);
      setLunaStatus('online');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditImage = (imageUrl: string) => {
    setPendingEditImage({
      data: imageUrl,
      mimeType: 'image/jpeg',
      name: 'imagem-luna-para-editar.jpg',
      size: 120000,
    });
  };

  const handleRetry = (msgText: string) => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      handleSendMessage(lastUser.text);
    } else {
      handleSendMessage(msgText);
    }
  };

  // If initial auth verification is running, show clean loader
  if (isAuthChecking) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-[#0d0d0d] text-white' : 'bg-white text-black'}`}>
        <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xl mb-3 shadow-md">
          🌙
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          <span>Carregando Luna AI...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render ChatGPT-style Login & Register Screen
  if (!currentUser || !authToken) {
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-200 ${isDark ? 'dark bg-[#0d0d0d] text-[#ececec]' : 'light bg-white text-[#0d0d0d]'}`}>
      {/* Sidebar: Conversation history, New Chat, Settings, Logout */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onMigrateLegacy={() => scanAndMigrateLegacyConversations(currentUser)}
        isMigrating={isMigratingLegacy}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenMemories={() => setIsMemoryPanelOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        memoriesCount={memories.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Offline Alert */}
        <OfflineBanner />

        {/* Missing API Key Server Banner */}
        {serverStatus && !serverStatus.hasApiKey && (
          <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-2 z-40 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Atenção:</strong> A chave <code className="bg-amber-900/60 px-1 py-0.5 rounded text-[11px] font-mono text-amber-100">GEMINI_API_KEY</code> ainda não está configurada em <em>Settings &gt; Secrets</em>.
              </span>
            </div>
            <button
              onClick={checkServerStatus}
              disabled={statusChecking}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold border border-amber-500/40 flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3 h-3 ${statusChecking ? 'animate-spin' : ''}`} />
              <span>Verificar</span>
            </button>
          </div>
        )}

        {/* Top Header */}
        <Header
          status={lunaStatus}
          serverStatus={serverStatus}
          profile={profile}
          currentUser={currentUser}
          memoriesCount={memories.length}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenMemories={() => setIsMemoryPanelOpen(true)}
          onNewChat={handleNewChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => {
            const next = !voiceEnabled;
            setVoiceEnabled(next);
            if (!next) stop();
          }}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Chat Messages Body (Clean ChatGPT aesthetic) */}
        <main className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-1 relative max-w-3xl w-full mx-auto">
          {/* Minimalist Welcome State if no interaction yet */}
          {messages.length <= 1 && (
            <div className="my-10 text-center max-w-md mx-auto animate-fadeIn select-none">
              <div className="w-14 h-14 rounded-2xl bg-neutral-850 dark:bg-neutral-850 border border-neutral-700/80 flex items-center justify-center text-2xl mx-auto mb-3 shadow-sm">
                🌙
              </div>
              <h2 className="text-xl font-semibold tracking-tight mb-1">
                Olá, {currentUser.displayName}!
              </h2>
              <p className="text-xs text-neutral-400 mb-4">
                Como posso te ajudar hoje?
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setIsMemoryPanelOpen(true)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700 text-neutral-300'
                      : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                  }`}
                >
                  <BookHeart className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{memories.length} Memórias Ativas</span>
                </button>
              </div>
            </div>
          )}

          {/* Messages list */}
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isSpeaking={isSpeaking && currentSpeakingId === message.id}
              onSpeak={(txt, id) => speak(txt, id)}
              onStopSpeech={stop}
              onRetry={handleRetry}
              onThumbsUp={handleThumbsUp}
              onOpenFeedback={handleOpenFeedback}
              onEditImage={handleEditImage}
            />
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} className="h-2" />
        </main>

        {/* Quick Prompts Bar */}
        <div className="max-w-3xl w-full mx-auto">
          <QuickPrompts onSelectPrompt={(prompt) => handleSendMessage(prompt)} disabled={isLoading} />
        </div>

        {/* Chat Input Field */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onGenerateImage={handleGenerateImage}
          isLoading={isLoading}
          initialImage={pendingEditImage}
          onClearInitialImage={() => setPendingEditImage(null)}
        />
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        currentUser={currentUser}
        onSaveProfile={(updated) => setProfile(updated)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onMigrateLegacy={() => scanAndMigrateLegacyConversations(currentUser)}
        isMigrating={isMigratingLegacy}
        conversationsCount={conversations.length}
        femaleVoices={femaleVoices}
        selectedVoiceURI={selectedVoiceURI}
        voiceTone={voiceTone}
        onSelectVoice={selectVoice}
        onSelectVoiceTone={selectVoiceTone}
        onTestVoice={(text) => speak(text, 'test-voice')}
      />

      <MemoryPanel
        isOpen={isMemoryPanelOpen}
        onClose={() => setIsMemoryPanelOpen(false)}
        userId={currentUser.id}
        userName={currentUser.displayName}
        memories={memories}
        settings={memorySettings}
        knowledge={knowledge}
        feedbacks={feedbacks}
        onAddMemory={handleAddMemory}
        onUpdateMemory={handleUpdateMemory}
        onDeleteMemory={handleDeleteMemory}
        onDeleteAllMemories={handleDeleteAllMemories}
        onUpdateSettings={handleUpdateSettings}
        onAddKnowledge={handleAddKnowledge}
        onDeleteKnowledge={handleDeleteKnowledge}
      />

      <FeedbackModal
        isOpen={Boolean(feedbackTargetMessage)}
        onClose={() => setFeedbackTargetMessage(null)}
        message={feedbackTargetMessage}
        userPrompt={feedbackTargetPrompt}
        userId={currentUser.id}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </div>
  );
}
