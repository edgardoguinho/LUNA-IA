export type MemoryCategory = 'preference' | 'project' | 'goal' | 'fact' | 'correction';

export interface MemoryItem {
  id: string;
  userId: string;
  category: MemoryCategory;
  content: string;
  confirmed: boolean;
  importance: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastAccessedAt?: number;
}

export interface MemorySettings {
  userId: string;
  enabled: boolean;
  allowPreferences: boolean;
  allowProjects: boolean;
  allowGoals: boolean;
  allowCorrections: boolean;
  allowKnowledgeRetrieval: boolean;
  maxMemoriesInContext: number;
}

export interface FeedbackItem {
  id: string;
  userId: string;
  messageId: string;
  userPrompt: string;
  lunaReply: string;
  rating: 'positive' | 'negative';
  correctionText?: string;
  savedAsPreference: boolean;
  createdAt: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  isSystem: boolean;
  author?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
  isVerifiedCreator?: boolean;
  authProvider?: 'local' | 'google';
  affinityPoints?: number;
  level?: number;
  createdAt: number;
}

export interface SavedConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface SavedConversation {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface SearchSource {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  type?: 'web' | 'youtube';
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
  feedbackGiven?: 'positive' | 'negative' | 'corrected';
  retrievedMemoriesCount?: number;
  imageUrl?: string;
  generatedImageUrl?: string;
  imagePrompt?: string;
  sources?: SearchSource[];
  usedSearch?: boolean;
}

export type LunaTone =
  | 'maduro'
  | 'equilibrado'
  | 'direto'
  | 'carinhoso'
  | 'carinhosa'
  | 'amiga'
  | 'romantica'
  | 'sabia'
  | 'espirituoso'
  | 'intelectual';

export interface PersonalityConfig {
  tone: LunaTone;
  adultMode: boolean;
  playfulness: number; // 1 to 5
  verbosity: 'conciso' | 'equilibrado' | 'detalhado';
  customInstructions: string;
  creatorAffection: boolean;
}

export interface AffinityLogEntry {
  id: string;
  userId: string;
  points: number;
  reason: string;
  category: 'chat' | 'image_gen' | 'image_edit' | 'feedback' | 'search' | 'admin_bonus' | 'daily';
  timestamp: number;
  totalAfter: number;
  levelAfter: number;
}

export interface UserProfile {
  name: string;
  nickname: string;
  tone: LunaTone;
  aboutUser: string;
  affinityPoints: number;
  level?: number;
  voiceAutoPlay: boolean;
  personality?: PersonalityConfig;
  affinityHistory?: AffinityLogEntry[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type LunaStatus = 'online' | 'typing' | 'listening' | 'loving' | 'thinking';

export interface ServerStatus {
  ok: boolean;
  hasApiKey: boolean;
  model: string;
  fallbackModels?: string[];
  name: string;
  usersCount?: number;
  memoriesCount?: number;
  features?: {
    vision: boolean;
    imageGeneration: boolean;
    imageEditing: boolean;
    webSearch: boolean;
    youtubeSearch: boolean;
    persistentMemory: boolean;
    ephemeralMemory: boolean;
    pwa: boolean;
    affinityLevels: boolean;
  };
  storage?: {
    storageType: string;
    isTemporary: boolean;
    dir: string;
    warning?: string | null;
    note?: string;
  };
  auth?: {
    googleConfigured: boolean;
    googleClientId: string | null;
  };
}
