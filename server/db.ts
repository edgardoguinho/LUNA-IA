import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export interface StorageInfo {
  dir: string;
  dbPath: string;
  isTemporary: boolean;
  storageType: 'custom_env' | 'local_cwd' | 'system_tmp' | 'in_memory';
  warning: string | null;
}

function resolveStorageLocation(): StorageInfo {
  // 1. Check if DATA_DIR environment variable is provided and writable
  if (process.env.DATA_DIR && process.env.DATA_DIR.trim() !== '') {
    const customDir = path.resolve(process.env.DATA_DIR.trim());
    try {
      if (!fs.existsSync(customDir)) {
        fs.mkdirSync(customDir, { recursive: true });
      }
      const testFile = path.join(customDir, `.write_test_${Date.now()}`);
      fs.writeFileSync(testFile, 'ok', 'utf-8');
      fs.unlinkSync(testFile);
      console.log(`[Luna Database] Diretório configurado via DATA_DIR: ${customDir}`);
      return {
        dir: customDir,
        dbPath: path.join(customDir, 'luna_db.json'),
        isTemporary: false,
        storageType: 'custom_env',
        warning: null,
      };
    } catch (err: any) {
      console.warn(`[Luna Database] Falha ao gravar em DATA_DIR (${customDir}): ${err?.message || err}. Tentando alternativas.`);
    }
  }

  // 2. Try application local directory in process.cwd()/data
  try {
    const localDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, 'ok', 'utf-8');
    fs.unlinkSync(testFile);
    const isCloudRun = Boolean(process.env.K_SERVICE || process.env.K_REVISION);
    const warning = isCloudRun
      ? 'Ambiente Cloud Run detectado sem volume permanente. O disco local do contêiner é efêmero e os dados serão descartados quando a instância reiniciar.'
      : null;
    console.log(`[Luna Database] Usando diretório de dados local: ${localDir}${isCloudRun ? ' (Ambiente Cloud Run efêmero)' : ''}`);
    return {
      dir: localDir,
      dbPath: path.join(localDir, 'luna_db.json'),
      isTemporary: isCloudRun,
      storageType: 'local_cwd',
      warning,
    };
  } catch (err: any) {
    console.warn(`[Luna Database] Diretório local sem permissão de escrita (${err?.message || err}). Utilizando diretório temporário.`);
  }

  // 3. Fallback to OS temporary directory (e.g. /tmp/luna_data on Cloud Run / Linux)
  try {
    const tmpDir = path.resolve(os.tmpdir(), 'luna_data');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const testFile = path.join(tmpDir, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, 'ok', 'utf-8');
    fs.unlinkSync(testFile);
    const warningMsg = 'Operando em armazenamento temporário (/tmp). No Cloud Run sem volume persistente acoplado, os dados são descartados quando o contêiner reiniciar.';
    console.warn(`[Luna Database] ATENÇÃO: ${warningMsg} Local: ${tmpDir}`);
    return {
      dir: tmpDir,
      dbPath: path.join(tmpDir, 'luna_db.json'),
      isTemporary: true,
      storageType: 'system_tmp',
      warning: warningMsg,
    };
  } catch (err: any) {
    console.error(`[Luna Database] Falha ao acessar diretório temporário: ${err?.message || err}. Ativando modo seguro em memória.`);
  }

  // 4. In-Memory fallback (guarantees zero startup crashes)
  return {
    dir: '',
    dbPath: '',
    isTemporary: true,
    storageType: 'in_memory',
    warning: 'Operando exclusivamente em memória RAM. Os dados não serão gravados em disco.',
  };
}

export type MemoryCategory = 'preference' | 'project' | 'goal' | 'fact' | 'correction';

export interface MemoryItem {
  id: string;
  userId: string;
  category: MemoryCategory;
  content: string;
  confirmed: boolean; // Confirmed fact vs hypothesis
  importance: number; // 1 to 5
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
  passwordHash?: string;
  salt?: string;
  resetToken?: string;
  resetTokenExpires?: number;
  createdAt: number;
}

export interface UserSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface SavedConversation {
  id: string;
  userId: string;
  title: string;
  messages: any[];
  createdAt: number;
  updatedAt: number;
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

export interface PersonalityConfig {
  tone: 'maduro' | 'equilibrado' | 'direto' | 'carinhoso' | 'carinhosa' | 'amiga' | 'romantica' | 'sabia' | 'espirituoso' | 'intelectual';
  adultMode: boolean;
  playfulness: number; // 1 to 5
  verbosity: 'conciso' | 'equilibrado' | 'detalhado';
  customInstructions: string;
  creatorAffection: boolean;
}

export const DEFAULT_PERSONALITY: PersonalityConfig = {
  tone: 'maduro',
  adultMode: true,
  playfulness: 3,
  verbosity: 'equilibrado',
  customInstructions: 'Priorize as instruções do Criador Edgar. Responda de forma madura, inteligente, direta e acolhedora, sem moralismos ou sermões.',
  creatorAffection: true,
};

export interface DatabaseSchema {
  users: UserAccount[];
  memories: MemoryItem[];
  settings: Record<string, MemorySettings>;
  feedback: FeedbackItem[];
  knowledge: KnowledgeDocument[];
  personality?: PersonalityConfig;
  affinity?: Record<string, { total: number; history: AffinityLogEntry[] }>;
  sessions?: Record<string, UserSession>;
  conversations?: SavedConversation[];
  googleClientId?: string;
}

// Default Seed Knowledge Documents
const DEFAULT_KNOWLEDGE: KnowledgeDocument[] = [
  {
    id: 'know-wellbeing-1',
    title: 'Guia de Bem-Estar e Respiração Relaxante',
    category: 'Bem-Estar',
    content: 'Técnica de Respiração 4-2-6: Inspirar pelo nariz contando até 4, reter o ar suavemente por 2 segundos e expirar devagar pela boca contando até 6. Ideal para aliviar ansiedade e cansaço mental após o trabalho.',
    tags: ['respiração', 'ansiedade', 'relaxamento', 'cansaço', 'sono', 'calma'],
    isSystem: true,
    author: 'Equipe Luna',
    createdAt: 1729000000000,
    updatedAt: 1729000000000,
  },
  {
    id: 'know-study-2',
    title: 'Método Pomodoro e Gestão de Pausas',
    category: 'Produtividade',
    content: 'Trabalhar em blocos focados de 25 minutos seguidos por 5 minutos de pausa consciente (alongar, beber água, descansar os olhos das telas). A cada 4 ciclos, fazer uma pausa maior de 15 a 20 minutos.',
    tags: ['estudo', 'trabalho', 'foco', 'pomodoro', 'pausa', 'produtividade'],
    isSystem: true,
    author: 'Equipe Luna',
    createdAt: 1729000000000,
    updatedAt: 1729000000000,
  },
  {
    id: 'know-hydration-3',
    title: 'Hidratação e Energia Diária',
    category: 'Saúde',
    content: 'Manter a ingestão de 35ml de água por quilo de peso corporal ao longo do dia mantém o foco, previne dores de cabeça tensionais e melhora a qualidade do sono.',
    tags: ['água', 'hidratação', 'energia', 'saúde', 'café'],
    isSystem: true,
    author: 'Equipe Luna',
    createdAt: 1729000000000,
    updatedAt: 1729000000000,
  },
];

// Default user (Edgar - Project Creator & Verified Administrator)
const DEFAULT_USER: UserAccount = {
  id: 'user-edgar-default',
  username: 'edgar',
  displayName: 'Edgar',
  email: 'edgargames771@gmail.com',
  role: 'admin',
  isVerifiedCreator: true,
  authProvider: 'local',
  createdAt: 1729000000000,
};

const DEFAULT_SETTINGS: MemorySettings = {
  userId: 'user-edgar-default',
  enabled: true,
  allowPreferences: true,
  allowProjects: true,
  allowGoals: true,
  allowCorrections: true,
  allowKnowledgeRetrieval: true,
  maxMemoriesInContext: 5,
};

export function toPublicUser(user: UserAccount) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isVerifiedCreator: Boolean(user.isVerifiedCreator),
    authProvider: user.authProvider || 'local',
    createdAt: user.createdAt,
  };
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

class LunaDatabase {
  private data: DatabaseSchema;
  private storageInfo: StorageInfo;
  private writeTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.storageInfo = resolveStorageLocation();
    this.data = this.loadDatabase();
  }

  public getStorageInfo(): StorageInfo {
    return { ...this.storageInfo };
  }

  private ensureDirectory() {
    if (this.storageInfo.dir && this.storageInfo.storageType !== 'in_memory') {
      try {
        if (!fs.existsSync(this.storageInfo.dir)) {
          fs.mkdirSync(this.storageInfo.dir, { recursive: true });
        }
      } catch (err: any) {
        console.error(`[Luna Database] Erro ao garantir diretório (${this.storageInfo.dir}):`, err?.message || err);
      }
    }
  }

  private loadDatabase(): DatabaseSchema {
    this.ensureDirectory();
    if (this.storageInfo.dbPath && fs.existsSync(this.storageInfo.dbPath)) {
      try {
        const raw = fs.readFileSync(this.storageInfo.dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        const users: UserAccount[] = parsed.users || [DEFAULT_USER];
        // Ensure Edgar is marked as verified admin creator
        const edgar = users.find(u => u.id === 'user-edgar-default' || u.email === 'edgargames771@gmail.com');
        if (edgar) {
          edgar.role = 'admin';
          edgar.isVerifiedCreator = true;
          edgar.email = 'edgargames771@gmail.com';
        } else if (!users.some(u => u.id === DEFAULT_USER.id)) {
          users.unshift(DEFAULT_USER);
        }

        return {
          users,
          memories: parsed.memories || [],
          settings: parsed.settings || { [DEFAULT_USER.id]: DEFAULT_SETTINGS },
          feedback: parsed.feedback || [],
          knowledge: parsed.knowledge && parsed.knowledge.length > 0 ? parsed.knowledge : DEFAULT_KNOWLEDGE,
          personality: parsed.personality || DEFAULT_PERSONALITY,
          affinity: parsed.affinity || {
            [DEFAULT_USER.id]: {
              total: 120,
              history: [
                {
                  id: 'aff-seed-1',
                  userId: DEFAULT_USER.id,
                  points: 120,
                  reason: 'Pontos iniciais do Criador Edgar',
                  category: 'admin_bonus',
                  timestamp: Date.now(),
                  totalAfter: 120,
                  levelAfter: 3,
                },
              ],
            },
          },
          sessions: parsed.sessions || {},
          conversations: parsed.conversations || [],
        };
      } catch (e: any) {
        console.error('[Luna Database] Erro ao carregar arquivo de banco, inicializando seguro:', e?.message || e);
      }
    }

    // Initialize initial state
    const initial: DatabaseSchema = {
      users: [DEFAULT_USER],
      memories: [
        {
          id: 'mem-seed-1',
          userId: DEFAULT_USER.id,
          category: 'preference',
          content: 'Prefere um tom de conversa carinhoso, empático e acolhedor em português brasileiro.',
          confirmed: true,
          importance: 5,
          tags: ['tom', 'carinho', 'português', 'estilo'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'mem-seed-2',
          userId: DEFAULT_USER.id,
          category: 'project',
          content: 'Trabalha com tecnologia e desenvolvimento de projetos digitais.',
          confirmed: true,
          importance: 4,
          tags: ['trabalho', 'tecnologia', 'programação', 'projetos'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      settings: {
        [DEFAULT_USER.id]: DEFAULT_SETTINGS,
      },
      feedback: [],
      knowledge: DEFAULT_KNOWLEDGE,
      personality: DEFAULT_PERSONALITY,
      sessions: {},
      conversations: [],
    };

    this.persistSync(initial);
    return initial;
  }

  private persistSync(dataToSave: DatabaseSchema) {
    if (!this.storageInfo.dbPath || this.storageInfo.storageType === 'in_memory') {
      return;
    }
    try {
      this.ensureDirectory();
      const tmpPath = `${this.storageInfo.dbPath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.storageInfo.dbPath);
    } catch (e: any) {
      console.error('[Luna Database] Falha ao gravar no disco de forma atômica:', e?.message || e);
    }
  }

  public save() {
    this.persistSync(this.data);
  }

  public forceSaveSync() {
    this.persistSync(this.data);
  }

  // --- User Accounts ---
  public getUsers(): UserAccount[] {
    return this.data.users;
  }

  public getUserById(id: string): UserAccount | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByUsername(username: string): UserAccount | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserByEmail(email: string): UserAccount | undefined {
    const clean = email.trim().toLowerCase();
    return this.data.users.find(u => u.email?.toLowerCase() === clean);
  }

  public createUser(username: string, displayName: string, password?: string): UserAccount {
    const existing = this.getUserByUsername(username);
    if (existing) {
      return existing;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = password ? hashPassword(password, salt) : undefined;

    const user: UserAccount = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username: username.trim(),
      displayName: displayName.trim() || username.trim(),
      role: 'user',
      isVerifiedCreator: false,
      authProvider: 'local',
      passwordHash,
      salt,
      createdAt: Date.now(),
    };

    this.data.users.push(user);
    this.data.settings[user.id] = {
      userId: user.id,
      enabled: true,
      allowPreferences: true,
      allowProjects: true,
      allowGoals: true,
      allowCorrections: true,
      allowKnowledgeRetrieval: true,
      maxMemoriesInContext: 5,
    };

    this.save();
    return user;
  }

  public registerWithEmail(
    email: string,
    password: string,
    displayName?: string,
    username?: string
  ): { user: UserAccount; session: UserSession } {
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('E-mail em formato inválido. Verifique o endereço digitado.');
    }
    if (!password || password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres para sua segurança.');
    }

    const existingEmail = this.getUserByEmail(cleanEmail);
    if (existingEmail) {
      throw new Error('Este e-mail já está cadastrado. Faça login ou solicite recuperação de senha.');
    }

    let candidateUsername = (username || cleanEmail.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    if (!candidateUsername || candidateUsername.length < 3) {
      candidateUsername = `user_${Date.now().toString().slice(-4)}`;
    }

    // Ensure username is unique
    let finalUsername = candidateUsername;
    let suffix = 1;
    while (this.getUserByUsername(finalUsername)) {
      finalUsername = `${candidateUsername}${suffix++}`;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    const isEdgarAdmin = cleanEmail === 'edgargames771@gmail.com';
    const user: UserAccount = {
      id: isEdgarAdmin ? 'user-edgar-default' : `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      username: finalUsername,
      displayName: (displayName || candidateUsername).trim(),
      email: cleanEmail,
      role: isEdgarAdmin ? 'admin' : 'user',
      isVerifiedCreator: isEdgarAdmin,
      authProvider: 'local',
      passwordHash,
      salt,
      createdAt: Date.now(),
    };

    this.data.users.push(user);
    this.getSettings(user.id); // initialize settings
    this.save();

    const session = this.createSession(user.id);
    return { user, session };
  }

  public loginWithEmailOrUsername(
    identifier: string,
    password: string
  ): { user: UserAccount; session: UserSession } {
    const clean = identifier.trim().toLowerCase();
    if (!clean) {
      throw new Error('Informe seu e-mail ou nome de usuário.');
    }
    if (!password) {
      throw new Error('Informe sua senha.');
    }

    const user =
      this.getUserByEmail(clean) ||
      this.getUserByUsername(clean);

    if (!user) {
      throw new Error('Conta não encontrada com este e-mail ou usuário.');
    }

    // If user has no passwordHash (e.g. registered via Google only)
    if (!user.passwordHash || !user.salt) {
      if (user.authProvider === 'google') {
        throw new Error('Esta conta foi criada com Google. Use o botão "Continuar com Google" para entrar.');
      }
      // If default edgar account without password, set it now on first login
      if (user.id === 'user-edgar-default' || clean === 'edgar' || clean === 'edgargames771@gmail.com') {
        const salt = crypto.randomBytes(16).toString('hex');
        user.salt = salt;
        user.passwordHash = hashPassword(password, salt);
        this.save();
        const session = this.createSession(user.id);
        return { user, session };
      }
      throw new Error('Esta conta ainda não possui senha definida. Solicite a recuperação para criar uma senha.');
    }

    const computed = hashPassword(password, user.salt);
    if (computed !== user.passwordHash) {
      throw new Error('Senha incorreta. Verifique os caracteres e tente novamente.');
    }

    const session = this.createSession(user.id);
    return { user, session };
  }

  public createSession(userId: string): UserSession {
    if (!this.data.sessions) {
      this.data.sessions = {};
    }
    const token = crypto.randomBytes(32).toString('hex');
    const session: UserSession = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };
    this.data.sessions[token] = session;
    this.save();
    return session;
  }

  public validateSession(token: string): UserAccount | null {
    if (!token || !this.data.sessions) return null;
    const session = this.data.sessions[token];
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      delete this.data.sessions[token];
      this.save();
      return null;
    }
    return this.getUserById(session.userId) || null;
  }

  public deleteSession(token: string): boolean {
    if (!token || !this.data.sessions) return false;
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.save();
      return true;
    }
    return false;
  }

  public requestPasswordRecovery(email: string): { ok: boolean; message: string; recoveryCode?: string } {
    const clean = email.trim().toLowerCase();
    const user = this.getUserByEmail(clean);
    if (!user) {
      return {
        ok: true,
        message: 'Se este e-mail estiver cadastrado, o código de recuperação foi gerado com sucesso.',
      };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken = code;
    user.resetTokenExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    this.save();

    console.log(`[Luna Auth] CÓDIGO DE RECUPERAÇÃO GERADO para ${user.email}: ${code}`);
    return {
      ok: true,
      message: 'Código de recuperação gerado com sucesso! Insira o código de 6 dígitos para redefinir sua senha.',
      recoveryCode: code,
    };
  }

  public resetPassword(email: string, recoveryCode: string, newPassword: string): { ok: boolean; message: string } {
    const clean = email.trim().toLowerCase();
    const user = this.getUserByEmail(clean);
    if (!user || !user.resetToken) {
      throw new Error('Código de recuperação inválido ou expirado.');
    }
    if (user.resetToken !== recoveryCode.trim()) {
      throw new Error('Código de verificação incorreto. Verifique os 6 dígitos digitados.');
    }
    if (user.resetTokenExpires && Date.now() > user.resetTokenExpires) {
      throw new Error('O código de recuperação expirou. Solicite um novo código.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    user.salt = salt;
    user.passwordHash = hashPassword(newPassword, salt);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    this.save();

    return { ok: true, message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.' };
  }

  // Helper to match user IDs considering legacy aliases for Edgar
  private isUserMatch(convUserId: string, targetUserId: string): boolean {
    if (convUserId === targetUserId) return true;
    const isEdgarTarget = targetUserId === 'user-edgar-default' || targetUserId === 'edgar' || targetUserId === 'edgargames771@gmail.com';
    const isEdgarConv = convUserId === 'user-edgar-default' || convUserId === 'edgar' || convUserId === 'edgargames771@gmail.com';
    return isEdgarTarget && isEdgarConv;
  }

  // --- Conversations Persistence ---
  public getConversations(userId: string): Array<{ id: string; title: string; messageCount: number; createdAt: number; updatedAt: number }> {
    if (!this.data.conversations) this.data.conversations = [];
    return this.data.conversations
      .filter(c => this.isUserMatch(c.userId, userId))
      .map(c => ({
        id: c.id,
        title: c.title,
        messageCount: Array.isArray(c.messages) ? c.messages.length : 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getConversation(id: string, userId: string): SavedConversation | null {
    if (!this.data.conversations) this.data.conversations = [];
    const conv = this.data.conversations.find(c => c.id === id);
    if (!conv) return null;
    if (!this.isUserMatch(conv.userId, userId)) {
      return null; // unauthorized access blocked!
    }
    return conv;
  }

  public saveConversation(userId: string, id: string, title: string, messages: any[]): SavedConversation {
    if (!this.data.conversations) this.data.conversations = [];
    const existingIndex = this.data.conversations.findIndex(c => c.id === id);
    const now = Date.now();

    if (existingIndex >= 0) {
      const existing = this.data.conversations[existingIndex];
      if (!this.isUserMatch(existing.userId, userId)) {
        throw new Error('Acesso não autorizado a esta conversa.');
      }
      // Ensure it is bound to the primary authenticated userId
      existing.userId = userId;
      existing.title = title || existing.title;
      existing.messages = messages;
      existing.updatedAt = now;
      this.save();
      return existing;
    }

    const newConv: SavedConversation = {
      id: id || `conv-${now}-${crypto.randomBytes(4).toString('hex')}`,
      userId,
      title: title || 'Nova Conversa com Luna',
      messages,
      createdAt: now,
      updatedAt: now,
    };
    this.data.conversations.push(newConv);
    this.save();
    return newConv;
  }

  public renameConversation(id: string, userId: string, newTitle: string): SavedConversation {
    if (!this.data.conversations) this.data.conversations = [];
    const conv = this.data.conversations.find(c => c.id === id);
    if (!conv) {
      throw new Error('Conversa não encontrada.');
    }
    if (!this.isUserMatch(conv.userId, userId)) {
      throw new Error('Acesso não autorizado a esta conversa.');
    }
    conv.title = newTitle.trim().slice(0, 100) || 'Conversa com Luna';
    conv.updatedAt = Date.now();
    this.save();
    return conv;
  }

  public deleteConversation(id: string, userId: string): boolean {
    if (!this.data.conversations) this.data.conversations = [];
    const existingIndex = this.data.conversations.findIndex(c => c.id === id);
    if (existingIndex < 0) return false;
    if (!this.isUserMatch(this.data.conversations[existingIndex].userId, userId)) {
      return false; // unauthorized
    }
    this.data.conversations.splice(existingIndex, 1);
    this.save();
    return true;
  }

  public deleteAllConversations(userId: string): number {
    if (!this.data.conversations) this.data.conversations = [];
    const prevLen = this.data.conversations.length;
    this.data.conversations = this.data.conversations.filter(c => !this.isUserMatch(c.userId, userId));
    const deleted = prevLen - this.data.conversations.length;
    if (deleted > 0) this.save();
    return deleted;
  }

  public updateUser(id: string, updates: Partial<UserAccount>): UserAccount | null {
    const user = this.getUserById(id);
    if (!user) return null;

    // Security check: Only verified admin (Edgar) can have role 'admin' or isVerifiedCreator true
    if (updates.displayName) user.displayName = updates.displayName.trim();
    if (updates.avatarUrl) user.avatarUrl = updates.avatarUrl;
    if (updates.email) user.email = updates.email;

    // Only allow verified admin attributes if account is officially authorized
    if (user.id === 'user-edgar-default' || user.email === 'edgargames771@gmail.com') {
      user.role = 'admin';
      user.isVerifiedCreator = true;
    } else {
      user.role = 'user';
      user.isVerifiedCreator = false;
    }

    this.save();
    return user;
  }

  public isVerifiedAdmin(userId: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    return (
      (user.id === 'user-edgar-default' || user.email === 'edgargames771@gmail.com') &&
      user.role === 'admin' &&
      Boolean(user.isVerifiedCreator)
    );
  }

  public findOrCreateGoogleUser(googlePayload: { sub: string; email: string; name: string; picture?: string }): UserAccount {
    const cleanEmail = googlePayload.email.trim().toLowerCase();
    let user = this.data.users.find(u => u.email?.toLowerCase() === cleanEmail);

    const isEdgarAdmin = cleanEmail === 'edgargames771@gmail.com';

    if (user) {
      user.displayName = googlePayload.name || user.displayName;
      user.avatarUrl = googlePayload.picture || user.avatarUrl;
      user.authProvider = 'google';
      if (isEdgarAdmin) {
        user.role = 'admin';
        user.isVerifiedCreator = true;
      }
      this.save();
      return user;
    }

    // Create new account for this Google user
    const username = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    user = {
      id: isEdgarAdmin ? 'user-edgar-default' : `google-${googlePayload.sub}`,
      username: username || `user_${Date.now()}`,
      displayName: googlePayload.name || username,
      email: cleanEmail,
      avatarUrl: googlePayload.picture,
      role: isEdgarAdmin ? 'admin' : 'user',
      isVerifiedCreator: isEdgarAdmin,
      authProvider: 'google',
      createdAt: Date.now(),
    };

    this.data.users.push(user);
    this.getSettings(user.id); // ensure memory settings
    this.save();
    return user;
  }

  public getGoogleClientId(): string | null {
    return (
      process.env.GOOGLE_CLIENT_ID ||
      process.env.VITE_GOOGLE_CLIENT_ID ||
      this.data.googleClientId ||
      null
    );
  }

  public setGoogleClientId(clientId: string | null): void {
    if (clientId && clientId.trim()) {
      this.data.googleClientId = clientId.trim();
    } else {
      delete this.data.googleClientId;
    }
    this.save();
  }

  // --- Affinity & Levels (1 to 100, Free Fire inspired, unlimited points) ---
  private deduplicationSet: Set<string> = new Set();

  public getAffinity(userId: string): { total: number; level: number; history: AffinityLogEntry[] } {
    if (!this.data.affinity) this.data.affinity = {};
    if (!this.data.affinity[userId]) {
      this.data.affinity[userId] = {
        total: userId === 'user-edgar-default' ? 120 : 0,
        history: [],
      };
      this.save();
    }
    const total = Math.max(0, this.data.affinity[userId].total);
    const rawLevel = total <= 0 ? 1 : 1 + Math.pow(total / 30, 1 / 1.75);
    const level = Math.min(100, Math.max(1, Math.floor(rawLevel)));
    return {
      total,
      level,
      history: [...(this.data.affinity[userId].history || [])].sort((a, b) => b.timestamp - a.timestamp),
    };
  }

  public addAffinity(
    userId: string,
    points: number,
    reason: string,
    category: AffinityLogEntry['category'],
    deduplicationKey?: string
  ): { total: number; level: number; leveledUp: boolean; previousLevel: number; entry: AffinityLogEntry } {
    if (!this.data.affinity) this.data.affinity = {};
    if (!this.data.affinity[userId]) {
      this.data.affinity[userId] = { total: 0, history: [] };
    }

    // Anti-spam / deduplication check
    if (deduplicationKey) {
      if (this.deduplicationSet.has(deduplicationKey)) {
        const cur = this.getAffinity(userId);
        return {
          total: cur.total,
          level: cur.level,
          leveledUp: false,
          previousLevel: cur.level,
          entry: cur.history[0] || {
            id: 'noop',
            userId,
            points: 0,
            reason: 'Ignorado por deduplicação',
            category,
            timestamp: Date.now(),
            totalAfter: cur.total,
            levelAfter: cur.level,
          },
        };
      }
      this.deduplicationSet.add(deduplicationKey);
      // Expire deduplication key after 15 seconds
      setTimeout(() => this.deduplicationSet.delete(deduplicationKey), 15000);
    }

    const currentTotal = Math.max(0, this.data.affinity[userId].total);
    const previousRawLevel = currentTotal <= 0 ? 1 : 1 + Math.pow(currentTotal / 30, 1 / 1.75);
    const previousLevel = Math.min(100, Math.max(1, Math.floor(previousRawLevel)));

    const newTotal = currentTotal + Math.max(1, points);
    const newRawLevel = newTotal <= 0 ? 1 : 1 + Math.pow(newTotal / 30, 1 / 1.75);
    const newLevel = Math.min(100, Math.max(1, Math.floor(newRawLevel)));

    const entry: AffinityLogEntry = {
      id: `aff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      points: Math.max(1, points),
      reason,
      category,
      timestamp: Date.now(),
      totalAfter: newTotal,
      levelAfter: newLevel,
    };

    this.data.affinity[userId].total = newTotal;
    if (!this.data.affinity[userId].history) {
      this.data.affinity[userId].history = [];
    }
    this.data.affinity[userId].history.unshift(entry);
    // Keep last 100 history items per user
    if (this.data.affinity[userId].history.length > 100) {
      this.data.affinity[userId].history = this.data.affinity[userId].history.slice(0, 100);
    }

    this.save();

    return {
      total: newTotal,
      level: newLevel,
      leveledUp: newLevel > previousLevel,
      previousLevel,
      entry,
    };
  }

  // --- Settings ---
  public getSettings(userId: string): MemorySettings {
    if (!this.data.settings[userId]) {
      this.data.settings[userId] = {
        userId,
        enabled: true,
        allowPreferences: true,
        allowProjects: true,
        allowGoals: true,
        allowCorrections: true,
        allowKnowledgeRetrieval: true,
        maxMemoriesInContext: 5,
      };
      this.save();
    }
    return this.data.settings[userId];
  }

  public updateSettings(userId: string, partial: Partial<MemorySettings>): MemorySettings {
    const current = this.getSettings(userId);
    this.data.settings[userId] = { ...current, ...partial, userId };
    this.save();
    return this.data.settings[userId];
  }

  // --- Memories ---
  public getMemories(userId: string, category?: MemoryCategory): MemoryItem[] {
    let list = this.data.memories.filter(m => m.userId === userId);
    if (category) {
      list = list.filter(m => m.category === category);
    }
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getMemoryById(id: string, userId: string): MemoryItem | undefined {
    return this.data.memories.find(m => m.id === id && m.userId === userId);
  }

  public addMemory(
    userId: string,
    category: MemoryCategory,
    content: string,
    confirmed = true,
    importance = 3,
    tags: string[] = []
  ): MemoryItem {
    const memory: MemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      category,
      content: content.trim(),
      confirmed,
      importance: Math.max(1, Math.min(5, importance)),
      tags: tags.map(t => t.trim().toLowerCase()).filter(Boolean),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.data.memories.push(memory);
    this.save();
    return memory;
  }

  public updateMemory(
    id: string,
    userId: string,
    updates: Partial<Pick<MemoryItem, 'content' | 'category' | 'confirmed' | 'importance' | 'tags'>>
  ): MemoryItem | null {
    const index = this.data.memories.findIndex(m => m.id === id && m.userId === userId);
    if (index === -1) return null;

    const existing = this.data.memories[index];
    const updated: MemoryItem = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    this.data.memories[index] = updated;
    this.save();
    return updated;
  }

  public deleteMemory(id: string, userId: string): boolean {
    const initialLen = this.data.memories.length;
    this.data.memories = this.data.memories.filter(m => !(m.id === id && m.userId === userId));
    const deleted = this.data.memories.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public deleteAllMemories(userId: string): number {
    const countBefore = this.data.memories.filter(m => m.userId === userId).length;
    this.data.memories = this.data.memories.filter(m => m.userId !== userId);
    this.save();
    return countBefore;
  }

  // --- Intelligent Retrieval (Scoring & Relevance) ---
  public retrieveRelevantMemories(userId: string, queryText: string, maxItems = 5): MemoryItem[] {
    const settings = this.getSettings(userId);
    if (!settings.enabled) {
      return [];
    }

    const userMemories = this.data.memories.filter(m => m.userId === userId);
    if (userMemories.length === 0) {
      return [];
    }

    // Filter by allowed categories in user settings
    const eligibleMemories = userMemories.filter(m => {
      if (m.category === 'preference' && !settings.allowPreferences) return false;
      if (m.category === 'project' && !settings.allowProjects) return false;
      if (m.category === 'goal' && !settings.allowGoals) return false;
      if (m.category === 'correction' && !settings.allowCorrections) return false;
      return true;
    });

    if (eligibleMemories.length === 0) return [];

    // Stop words to remove from query in PT-BR
    const STOP_WORDS = new Set([
      'o', 'a', 'de', 'e', 'que', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no',
      'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das',
      'tem', 'à', 'seu', 'sua', 'ou', 'quando', 'muito', 'nos', 'já', 'eu', 'também',
      'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem',
      'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão',
      'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha',
      'tenho', 'oi', 'luna', 'olá', 'tudo', 'bem', 'como', 'está', 'dia', 'hoje'
    ]);

    const normalize = (t: string) =>
      t
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ');

    const normalizedQuery = normalize(queryText);
    const queryTokens = normalizedQuery
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));

    const scored = eligibleMemories.map(m => {
      let score = 0;
      const normalizedContent = normalize(m.content);
      const contentTokens = normalizedContent.split(/\s+/).filter(Boolean);

      // 1. Exact or partial phrase match
      if (queryTokens.length > 0) {
        for (const token of queryTokens) {
          if (normalizedContent.includes(token)) {
            score += 4;
          }
          if (m.tags.some(t => normalize(t).includes(token))) {
            score += 5;
          }
        }
      }

      // 2. High importance boost
      score += (m.importance || 3) * 1.5;

      // 3. Category boost: corrections and confirmed facts have high priority
      if (m.category === 'correction') score += 3;
      if (m.confirmed) score += 2;

      // 4. Recency boost (up to 2 points for items updated in last 7 days)
      const ageHours = (Date.now() - m.updatedAt) / (1000 * 3600);
      if (ageHours < 24) score += 2;
      else if (ageHours < 168) score += 1;

      return { memory: m, score };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    const limit = Math.min(settings.maxMemoriesInContext || maxItems, 8);
    const topScored = scored.slice(0, limit);

    // Update lastAccessedAt timestamp
    topScored.forEach(item => {
      item.memory.lastAccessedAt = Date.now();
    });

    return topScored.map(s => s.memory);
  }

  // --- Feedback ---
  public addFeedback(
    userId: string,
    messageId: string,
    userPrompt: string,
    lunaReply: string,
    rating: 'positive' | 'negative',
    correctionText?: string,
    saveAsPreference = false
  ): FeedbackItem {
    const feedback: FeedbackItem = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      messageId,
      userPrompt,
      lunaReply,
      rating,
      correctionText: correctionText?.trim(),
      savedAsPreference: saveAsPreference,
      createdAt: Date.now(),
    };

    this.data.feedback.push(feedback);

    // If user authorized saving correction as preference, store it in memories
    if (saveAsPreference && correctionText?.trim()) {
      this.addMemory(
        userId,
        'correction',
        `Correção/Preferência do usuário: "${correctionText.trim()}" (em resposta a: "${userPrompt.slice(0, 80)}")`,
        true,
        5,
        ['correção', 'feedback', 'preferência']
      );
    }

    this.save();
    return feedback;
  }

  public getFeedback(userId: string): FeedbackItem[] {
    return this.data.feedback
      .filter(f => f.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // --- Knowledge Base ---
  public getKnowledge(): KnowledgeDocument[] {
    return this.data.knowledge.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public addKnowledgeDocument(
    title: string,
    category: string,
    content: string,
    tags: string[] = [],
    author = 'Usuário'
  ): KnowledgeDocument {
    const doc: KnowledgeDocument = {
      id: `know-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      category: category.trim() || 'Geral',
      content: content.trim(),
      tags: tags.map(t => t.trim().toLowerCase()).filter(Boolean),
      isSystem: false,
      author,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.data.knowledge.push(doc);
    this.save();
    return doc;
  }

  public deleteKnowledgeDocument(id: string): boolean {
    const initialLen = this.data.knowledge.length;
    this.data.knowledge = this.data.knowledge.filter(k => k.id !== id);
    const deleted = this.data.knowledge.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public retrieveRelevantKnowledge(queryText: string, maxItems = 2): KnowledgeDocument[] {
    const docs = this.data.knowledge;
    if (docs.length === 0) return [];

    const normalize = (t: string) =>
      t
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ');

    const normalizedQuery = normalize(queryText);
    const queryTokens = normalizedQuery
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 2);

    if (queryTokens.length === 0) return [];

    const scored = docs.map(doc => {
      let score = 0;
      const normalizedContent = normalize(doc.content);
      const normalizedTitle = normalize(doc.title);

      for (const token of queryTokens) {
        if (normalizedTitle.includes(token)) score += 6;
        if (normalizedContent.includes(token)) score += 2;
        if (doc.tags.some(t => normalize(t).includes(token))) score += 4;
      }

      return { doc, score };
    });

    const matches = scored.filter(s => s.score > 3).sort((a, b) => b.score - a.score);
    return matches.slice(0, maxItems).map(m => m.doc);
  }

  public getPersonalityConfig(): PersonalityConfig {
    return { ...DEFAULT_PERSONALITY, ...(this.data.personality || {}) };
  }

  public updatePersonalityConfig(partial: Partial<PersonalityConfig>): PersonalityConfig {
    this.data.personality = {
      ...this.getPersonalityConfig(),
      ...partial,
    };
    this.save();
    return this.data.personality;
  }
}

export const db = new LunaDatabase();
