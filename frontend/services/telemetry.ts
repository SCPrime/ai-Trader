// Telemetry Service
// Tracks user interactions, errors, and performance metrics

interface TelemetryEvent {
  userId: string;
  sessionId: string;
  component: string;
  action: string;
  timestamp: string;
  metadata: Record<string, any>;
  userRole: 'admin' | 'beta' | 'alpha' | 'user' | 'owner';
}

interface TelemetryConfig {
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  enabled: boolean;
}

class TelemetryService {
  private config: TelemetryConfig;
  private buffer: TelemetryEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;

  constructor(config: Partial<TelemetryConfig> = {}) {
    const telemetryEnabled = typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_TELEMETRY_ENABLED !== 'false';

    this.config = {
      endpoint: config.endpoint || '/api/telemetry',
      batchSize: config.batchSize || 50,
      flushInterval: config.flushInterval || 10000, // 10 seconds
      enabled: config.enabled !== false && telemetryEnabled,
    };

    this.sessionId = this.generateSessionId();

    if (this.config.enabled) {
      this.startAutoFlush();
      this.setupEventListeners();
    }
  }

  /**
   * Track a user action/event
   */
  track(event: Omit<TelemetryEvent, 'timestamp' | 'sessionId'>) {
    if (!this.config.enabled) return;

    const telemetryEvent: TelemetryEvent = {
      ...event,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };

    this.buffer.push(telemetryEvent);

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  trackPageView(userId: string, userRole: string, component: string) {
    this.track({
      userId,
      userRole: userRole as any,
      component,
      action: 'page_view',
      metadata: {
        path: typeof window !== 'undefined' ? window.location.pathname : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track button click
   */
  trackClick(userId: string, userRole: string, component: string, buttonName: string) {
    this.track({
      userId,
      userRole: userRole as any,
      component,
      action: 'button_click',
      metadata: { buttonName },
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmit(userId: string, userRole: string, component: string, formData: any) {
    this.track({
      userId,
      userRole: userRole as any,
      component,
      action: 'form_submit',
      metadata: formData,
    });
  }

  /**
   * Track error
   */
  trackError(userId: string, userRole: string, component: string, error: Error | string) {
    this.track({
      userId,
      userRole: userRole as any,
      component,
      action: 'error',
      metadata: {
        message: typeof error === 'string' ? error : error.message,
        stack: typeof error === 'string' ? undefined : error.stack,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track feature usage
   */
  trackFeature(userId: string, userRole: string, feature: string, metadata?: any) {
    this.track({
      userId,
      userRole: userRole as any,
      component: 'App',
      action: 'feature_used',
      metadata: {
        feature,
        ...metadata,
      },
    });
  }

  /**
   * Flush events to server
   */
  async flush() {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}${this.config.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Telemetry flush failed: ${response.status}`);
      }

      console.log(`[Telemetry] Flushed ${events.length} events`);
    } catch (error) {
      console.error('[Telemetry] Flush error:', error);
      // Re-add failed events to buffer
      this.buffer.unshift(...events);
    }
  }

  /**
   * Enable telemetry
   */
  enable() {
    this.config.enabled = true;
    this.startAutoFlush();
    this.setupEventListeners();
  }

  /**
   * Disable telemetry
   */
  disable() {
    this.config.enabled = false;
    this.stopAutoFlush();
  }

  /**
   * Export all buffered events as JSON
   */
  exportEvents(): TelemetryEvent[] {
    return [...this.buffer];
  }

  /**
   * Clear all buffered events
   */
  clear() {
    this.buffer = [];
  }

  // Private methods

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startAutoFlush() {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private stopAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Track errors
    window.addEventListener('error', (event) => {
      // Get user from localStorage or context
      const userId = localStorage.getItem('userId') || 'anonymous';
      const userRole = localStorage.getItem('userRole') || 'user';

      this.trackError(userId, userRole, 'Global', event.error || event.message);
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const userId = localStorage.getItem('userId') || 'anonymous';
      const userRole = localStorage.getItem('userRole') || 'user';

      this.trackError(userId, userRole, 'Global', event.reason);
    });
  }
}

// Singleton instance
export const telemetry = new TelemetryService({
  enabled: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_TELEMETRY === 'true',
});

export default telemetry;
