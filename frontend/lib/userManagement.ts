/**
 * User Management System
 *
 * Handles user identification and session tracking for paper testing.
 * Each tester gets a unique userId for tracking their trades and performance.
 */

export interface User {
  userId: string;
  displayName: string;
  email?: string;
  testGroup?: string; // For organizing testers (e.g., 'alpha', 'beta', 'control')
  createdAt: string;
  lastActive: string;
  sessionCount: number;
  preferences: {
    defaultExecutionMode: 'requires_approval' | 'autopilot';
    enableNotifications: boolean;
  };
  // Onboarding profile data
  onboarding?: {
    // Setup method
    setupMethod?: 'manual' | 'ai-guided';
    aiConversation?: Array<{ role: 'user' | 'assistant'; content: string }>;

    // Financial profile
    financialGoals?: string;
    investmentHorizon?: string;
    availableCapital?: string;
    currentAssets?: string;
    riskTolerance?: string;
    tradingExperience?: string;
    preferredStrategy?: string;

    // Enhanced investment amount
    investmentAmount?: {
      mode: 'range' | 'custom' | 'unlimited';
      value?: number;
      range?: string;
    };

    // Investment details
    investmentTypes?: string[];
    investmentRangeMin?: string;
    investmentRangeMax?: string;
    amountToInvest?: string;

    // Automation settings
    automationLevel?: string;
    executionMode?: string;

    // Custom morning routine workflow
    morningRoutineWorkflow?: string[];

    // Morning routine schedule
    morningRoutine?: {
      enabled: boolean;
      time: string;
      briefing: boolean;
      recommendations: boolean;
      portfolioReview: boolean;
    };

    completedAt?: string;
  };
}

export interface Session {
  sessionId: string;
  userId: string;
  startedAt: string;
  lastActivity: string;
  pageViews: number;
  actionsCount: number;
}

const USER_STORAGE_KEY = 'allessandra_user';
const SESSION_STORAGE_KEY = 'allessandra_session';

/**
 * Generate a unique user ID
 * Format: user_timestamp_random
 */
export function generateUserId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `user_${timestamp}_${random}`;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `session_${timestamp}_${random}`;
}

/**
 * Create a new user
 */
export function createUser(
  displayName: string,
  email?: string,
  testGroup?: string,
  onboardingData?: User['onboarding']
): User {
  const now = new Date().toISOString();

  const user: User = {
    userId: generateUserId(),
    displayName,
    email,
    testGroup,
    createdAt: now,
    lastActive: now,
    sessionCount: 0,
    preferences: {
      defaultExecutionMode: 'requires_approval',
      enableNotifications: true,
    },
    onboarding: onboardingData ? { ...onboardingData, completedAt: now } : undefined,
  };

  // Save to localStorage
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  // Track user creation event (in production, send to analytics)
  console.log('User created:', {
    userId: user.userId,
    testGroup: user.testGroup,
    onboarding: user.onboarding,
    timestamp: now,
  });

  return user;
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  try {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (error) {
    console.error('Failed to load user:', error);
  }
  return null;
}

/**
 * Update user data
 */
export function updateUser(updates: Partial<User>): User | null {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  const updatedUser: User = {
    ...currentUser,
    ...updates,
    userId: currentUser.userId, // Prevent userId change
    createdAt: currentUser.createdAt, // Prevent createdAt change
    lastActive: new Date().toISOString(),
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  return updatedUser;
}

/**
 * Update user preferences
 */
export function updateUserPreferences(
  preferences: Partial<User['preferences']>
): User | null {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  return updateUser({
    preferences: {
      ...currentUser.preferences,
      ...preferences,
    },
  });
}

/**
 * Start a new session
 */
export function startSession(): Session {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('No user found. Create user first.');
  }

  const now = new Date().toISOString();

  const session: Session = {
    sessionId: generateSessionId(),
    userId: user.userId,
    startedAt: now,
    lastActivity: now,
    pageViews: 1,
    actionsCount: 0,
  };

  // Save session to sessionStorage (cleared on browser close)
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

  // Update user session count
  updateUser({
    sessionCount: user.sessionCount + 1,
    lastActive: now,
  });

  // Track session start (in production, send to analytics)
  console.log('Session started:', {
    sessionId: session.sessionId,
    userId: user.userId,
    timestamp: now,
  });

  return session;
}

/**
 * Get current session
 */
export function getCurrentSession(): Session | null {
  try {
    const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionData) {
      return JSON.parse(sessionData);
    }
  } catch (error) {
    console.error('Failed to load session:', error);
  }
  return null;
}

/**
 * Update session activity
 */
export function updateSessionActivity(action?: string): Session | null {
  const session = getCurrentSession();
  if (!session) return null;

  const updatedSession: Session = {
    ...session,
    lastActivity: new Date().toISOString(),
    actionsCount: session.actionsCount + 1,
  };

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));

  // Track action (in production, send to analytics)
  if (action) {
    console.log('User action:', {
      sessionId: session.sessionId,
      userId: session.userId,
      action,
      timestamp: updatedSession.lastActivity,
    });
  }

  return updatedSession;
}

/**
 * Track page view
 */
export function trackPageView(pageName: string): void {
  const session = getCurrentSession();
  if (!session) return;

  const updatedSession: Session = {
    ...session,
    pageViews: session.pageViews + 1,
    lastActivity: new Date().toISOString(),
  };

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));

  console.log('Page view:', {
    sessionId: session.sessionId,
    userId: session.userId,
    page: pageName,
    totalViews: updatedSession.pageViews,
  });
}

/**
 * End current session
 */
export function endSession(): void {
  const session = getCurrentSession();
  if (!session) return;

  const duration = new Date().getTime() - new Date(session.startedAt).getTime();

  console.log('Session ended:', {
    sessionId: session.sessionId,
    userId: session.userId,
    duration: `${Math.floor(duration / 1000)}s`,
    pageViews: session.pageViews,
    actions: session.actionsCount,
  });

  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Check if user is logged in
 */
export function isUserLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Initialize or restore session
 * Call this on app startup
 */
export function initializeSession(): Session | null {
  const user = getCurrentUser();
  if (!user) return null;

  let session = getCurrentSession();

  // If no active session, start a new one
  if (!session) {
    session = startSession();
  } else {
    // Update last activity
    const updatedSession: Session = {
      ...session,
      lastActivity: new Date().toISOString(),
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    session = updatedSession;
  }

  return session;
}

/**
 * Clear all user data (for testing or logout)
 */
export function clearUserData(): void {
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  console.log('User data cleared');
}

/**
 * Export user data for backup/analysis
 */
export function exportUserData(): {
  user: User | null;
  session: Session | null;
} {
  return {
    user: getCurrentUser(),
    session: getCurrentSession(),
  };
}

/**
 * Get user analytics summary
 */
export function getUserAnalytics(): {
  userId: string;
  displayName: string;
  testGroup?: string;
  daysActive: number;
  totalSessions: number;
  accountAge: string;
} | null {
  const user = getCurrentUser();
  if (!user) return null;

  const createdDate = new Date(user.createdAt);
  const now = new Date();
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    userId: user.userId,
    displayName: user.displayName,
    testGroup: user.testGroup,
    daysActive: daysSinceCreation,
    totalSessions: user.sessionCount,
    accountAge: `${daysSinceCreation} days`,
  };
}
