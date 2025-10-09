/**
 * Profile Data Structure
 * Complete user profile system for PaiiD trading platform
 * Tracks investment capital, preferences, and portfolio state across all workflows
 */

export interface InvestmentSettings {
  initialCapital: number; // Total starting capital
  currentCapital: number; // Current available capital
  allocatedCapital: number; // Capital in open positions
  maxPositionSize: number; // Max $ per position
  maxPortfolioRisk: number; // Max % of portfolio at risk
  marginEnabled: boolean;
  marginMultiplier?: number; // 2x, 4x, etc.
}

export interface TradingPreferences {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  tradingStyle: 'day' | 'swing' | 'long-term' | 'mixed';
  preferredInstruments: ('stocks' | 'options' | 'crypto' | 'futures')[];
  preferredStrategies: string[]; // e.g., ["momentum", "mean-reversion", "breakout"]
  priceRange?: {
    min: number;
    max: number;
  };
  minimumVolume?: number;
  avoidEarnings?: boolean;
}

export interface PersonalInfo {
  name?: string;
  email?: string;
  timezone: string;
  tradingHours?: {
    start: string; // "09:30"
    end: string; // "16:00"
  };
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface Position {
  id: string;
  symbol: string;
  type: 'stock' | 'option' | 'crypto';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  entryDate: string;
  strategyId?: string;
  stopLoss?: number;
  takeProfit?: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface PortfolioState {
  positions: Position[];
  totalValue: number; // Current portfolio value
  totalPnL: number; // All-time P&L
  totalPnLPercent: number;
  dayPnL: number;
  dayPnLPercent: number;
  winRate: number; // % of winning trades
  averageWin: number;
  averageLoss: number;
  sharpeRatio?: number;
  maxDrawdown: number;
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  personalInfo: PersonalInfo;
  investmentSettings: InvestmentSettings;
  tradingPreferences: TradingPreferences;
  portfolio: PortfolioState;
  watchlists: Watchlist[];
  activeStrategies: string[]; // Strategy IDs
  activeMorningRoutines: string[]; // Routine IDs
  onboardingCompleted: boolean;
  lastLogin?: string;
}

// Helper functions

export function createDefaultProfile(): UserProfile {
  return {
    id: `profile-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    personalInfo: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      tradingHours: {
        start: '09:30',
        end: '16:00',
      },
      notifications: {
        email: false,
        push: true,
        sms: false,
      },
    },
    investmentSettings: {
      initialCapital: 0,
      currentCapital: 0,
      allocatedCapital: 0,
      maxPositionSize: 0,
      maxPortfolioRisk: 0.02, // 2% default
      marginEnabled: false,
    },
    tradingPreferences: {
      riskTolerance: 'moderate',
      tradingStyle: 'mixed',
      preferredInstruments: ['stocks'],
      preferredStrategies: [],
      avoidEarnings: true,
    },
    portfolio: {
      positions: [],
      totalValue: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      dayPnL: 0,
      dayPnLPercent: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      maxDrawdown: 0,
    },
    watchlists: [],
    activeStrategies: [],
    activeMorningRoutines: [],
    onboardingCompleted: false,
  };
}

export function calculateDerivedValues(profile: UserProfile): UserProfile {
  const { investmentSettings, portfolio } = profile;

  // Calculate current capital (initial - allocated)
  investmentSettings.currentCapital =
    investmentSettings.initialCapital - investmentSettings.allocatedCapital;

  // Calculate max position size (% of initial capital)
  investmentSettings.maxPositionSize = investmentSettings.initialCapital * 0.1; // 10% default

  // Calculate portfolio value
  portfolio.totalValue =
    investmentSettings.currentCapital +
    portfolio.positions.reduce((sum, pos) => sum + pos.currentPrice * pos.quantity, 0);

  // Calculate total P&L
  portfolio.totalPnL = portfolio.totalValue - investmentSettings.initialCapital;
  portfolio.totalPnLPercent =
    investmentSettings.initialCapital > 0
      ? (portfolio.totalPnL / investmentSettings.initialCapital) * 100
      : 0;

  return profile;
}

export function saveProfile(profile: UserProfile): void {
  profile.updatedAt = new Date().toISOString();
  const calculated = calculateDerivedValues(profile);
  localStorage.setItem('paid_user_profile', JSON.stringify(calculated));

  // Emit custom event for other components to listen
  window.dispatchEvent(
    new CustomEvent('profile-updated', { detail: calculated })
  );
}

export function loadProfile(): UserProfile | null {
  try {
    const stored = localStorage.getItem('paid_user_profile');
    if (!stored) return null;

    const profile = JSON.parse(stored) as UserProfile;
    return calculateDerivedValues(profile);
  } catch (error) {
    console.error('[Profile] Failed to load profile:', error);
    return null;
  }
}

export function getOrCreateProfile(): UserProfile {
  const existing = loadProfile();
  if (existing) return existing;

  const newProfile = createDefaultProfile();
  saveProfile(newProfile);
  return newProfile;
}

export function updateInvestmentCapital(
  profile: UserProfile,
  newCapital: number
): UserProfile {
  profile.investmentSettings.initialCapital = newCapital;
  return calculateDerivedValues(profile);
}

export function addPosition(profile: UserProfile, position: Position): UserProfile {
  profile.portfolio.positions.push(position);
  profile.investmentSettings.allocatedCapital += position.entryPrice * position.quantity;
  return calculateDerivedValues(profile);
}

export function removePosition(profile: UserProfile, positionId: string): UserProfile {
  const position = profile.portfolio.positions.find((p) => p.id === positionId);
  if (position) {
    profile.portfolio.positions = profile.portfolio.positions.filter(
      (p) => p.id !== positionId
    );
    profile.investmentSettings.allocatedCapital -= position.entryPrice * position.quantity;
  }
  return calculateDerivedValues(profile);
}

export function addWatchlist(profile: UserProfile, watchlist: Watchlist): UserProfile {
  profile.watchlists.push(watchlist);
  profile.updatedAt = new Date().toISOString();
  return profile;
}

export function removeWatchlist(profile: UserProfile, watchlistId: string): UserProfile {
  profile.watchlists = profile.watchlists.filter((w) => w.id !== watchlistId);
  profile.updatedAt = new Date().toISOString();
  return profile;
}

// Export type guards
export function isValidProfile(obj: any): obj is UserProfile {
  return (
    obj &&
    typeof obj === 'object' &&
    'id' in obj &&
    'investmentSettings' in obj &&
    'tradingPreferences' in obj &&
    'portfolio' in obj
  );
}
