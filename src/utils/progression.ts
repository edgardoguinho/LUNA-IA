// Sistema de Afinidade e Progressão de Níveis (1 a 100)
// Inspirado na progressão de patentes de jogos competitivos como Free Fire

export interface LevelTierInfo {
  tier: 'Bronze' | 'Prata' | 'Ouro' | 'Platina' | 'Diamante' | 'Mestre' | 'Desafiante';
  title: string;
  color: string;
  bgGradient: string;
  badge: string;
  accent: string;
  minLevel: number;
  maxLevel: number;
}

export const LEVEL_TIERS: LevelTierInfo[] = [
  {
    tier: 'Bronze',
    title: 'Bronze Inicial',
    color: 'text-amber-500',
    bgGradient: 'from-amber-900/60 to-yellow-950/40',
    badge: '🥉',
    accent: '#d97706',
    minLevel: 1,
    maxLevel: 15,
  },
  {
    tier: 'Prata',
    title: 'Prata Companheira',
    color: 'text-slate-300',
    bgGradient: 'from-slate-700/60 to-slate-900/40',
    badge: '🥈',
    accent: '#cbd5e1',
    minLevel: 16,
    maxLevel: 30,
  },
  {
    tier: 'Ouro',
    title: 'Ouro Conectado',
    color: 'text-amber-300',
    bgGradient: 'from-amber-600/60 to-yellow-800/40',
    badge: '🥇',
    accent: '#fcd34d',
    minLevel: 31,
    maxLevel: 50,
  },
  {
    tier: 'Platina',
    title: 'Platina Afetuosa',
    color: 'text-teal-300',
    bgGradient: 'from-teal-800/60 to-cyan-950/40',
    badge: '💎',
    accent: '#5eead4',
    minLevel: 51,
    maxLevel: 70,
  },
  {
    tier: 'Diamante',
    title: 'Diamante Estelar',
    color: 'text-cyan-300',
    bgGradient: 'from-cyan-700/60 to-blue-950/40',
    badge: '💠',
    accent: '#67e8f9',
    minLevel: 71,
    maxLevel: 85,
  },
  {
    tier: 'Mestre',
    title: 'Mestre da Cumplicidade',
    color: 'text-fuchsia-300',
    bgGradient: 'from-fuchsia-800/60 to-purple-950/40',
    badge: '👑',
    accent: '#f0abfc',
    minLevel: 86,
    maxLevel: 98,
  },
  {
    tier: 'Desafiante',
    title: 'Desafiante Cósmico',
    color: 'text-rose-300',
    bgGradient: 'from-rose-800/60 via-purple-900/50 to-amber-900/40',
    badge: '🌌',
    accent: '#fda4af',
    minLevel: 99,
    maxLevel: 100,
  },
];

/**
 * Retorna os pontos necessários para alcançar um nível específico (1 a 100).
 * Fórmula matemática progressiva, previsível e consistente:
 * Nível 1: 0 pontos
 * Nível L: floor(30 * (L - 1)^1.75)
 */
export function pointsRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  const clamped = Math.min(100, Math.max(1, Math.round(level)));
  return Math.floor(30 * Math.pow(clamped - 1, 1.75));
}

/**
 * Calcula o nível do usuário (1 a 100) com base na afinidade acumulada.
 * Mesmo após o nível 100, a afinidade continua aumentando infinitamente,
 * mas o nível máximo permanece em 100.
 */
export function calculateLevelFromAffinity(affinity: number): number {
  if (!affinity || affinity <= 0) return 1;
  // Inversa da fórmula: L = 1 + (affinity / 30)^(1 / 1.75)
  const rawLevel = 1 + Math.pow(affinity / 30, 1 / 1.75);
  const level = Math.floor(rawLevel);
  return Math.min(100, Math.max(1, level));
}

export interface LevelProgressDetails {
  currentLevel: number;
  totalAffinity: number;
  currentLevelBasePoints: number;
  nextLevelTargetPoints: number;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressPercent: number; // 0 a 100
  isMaxLevel: boolean;
  tierInfo: LevelTierInfo;
}

/**
 * Retorna todos os detalhes de progresso para a barra e indicadores visuais.
 */
export function getLevelProgressDetails(affinity: number): LevelProgressDetails {
  const safeAffinity = Math.max(0, Math.floor(affinity || 0));
  const currentLevel = calculateLevelFromAffinity(safeAffinity);
  const tierInfo = getTierForLevel(currentLevel);
  const isMaxLevel = currentLevel >= 100;

  const currentLevelBasePoints = pointsRequiredForLevel(currentLevel);
  const nextLevelTargetPoints = isMaxLevel
    ? currentLevelBasePoints
    : pointsRequiredForLevel(currentLevel + 1);

  const levelSpan = Math.max(1, nextLevelTargetPoints - currentLevelBasePoints);
  const pointsInCurrentLevel = safeAffinity - currentLevelBasePoints;
  const pointsNeededForNextLevel = isMaxLevel ? 0 : Math.max(0, nextLevelTargetPoints - safeAffinity);

  const progressPercent = isMaxLevel
    ? 100
    : Math.min(100, Math.max(0, Math.round((pointsInCurrentLevel / levelSpan) * 100)));

  return {
    currentLevel,
    totalAffinity: safeAffinity,
    currentLevelBasePoints,
    nextLevelTargetPoints,
    pointsInCurrentLevel,
    pointsNeededForNextLevel,
    progressPercent,
    isMaxLevel,
    tierInfo,
  };
}

/**
 * Retorna a patente / emblema para um determinado nível (1 a 100).
 */
export function getTierForLevel(level: number): LevelTierInfo {
  const safeLevel = Math.min(100, Math.max(1, level));
  for (const t of LEVEL_TIERS) {
    if (safeLevel >= t.minLevel && safeLevel <= t.maxLevel) {
      return t;
    }
  }
  return LEVEL_TIERS[0];
}
