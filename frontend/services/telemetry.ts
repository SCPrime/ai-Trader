// Telemetry Service
// Tracks user interactions, errors, and performance metrics

export interface TelemetryEvent {
  userId: string;
  userRole: 'owner' | 'admin' | 'beta' | 'alpha' | 'user';
  sessionId: string;
  timestamp: string;
  component: string;
  action: string;
  metadata?: Record<string, any>;
}

export interface TelemetryStats {
  totalEvents: number;
  uniqueUsers: number;
  eventsByComponent: Record<string, number>;
  eventsByAction: Record<string, number>;
  eventsByRole: Record<string, number>;
}

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private sessionId: string;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  private backendUrl: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL || 'http://localhost:8000';

    if (typeof window !== 'undefined') {
      this.startAutoFlush();

      // Flush before page unload
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startAutoFlush() {
    this.flushTimer = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  track(event: Omit<TelemetryEvent, 'sessionId' | 'timestamp'>) {
    const telemetryEvent: TelemetryEvent = {
      ...event,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };

    this.events.push(telemetryEvent);

    // Auto-flush if we have too many events
    if (this.events.length >= 50) {
      this.flush();
    }
  }

  trackClick(userId: string, userRole: TelemetryEvent['userRole'], component: string, elementId: string, metadata?: Record<string, any>) {
    this.track({
      userId,
      userRole,
      component,
      action: 'click',
      metadata: { elementId, ...metadata },
    });
  }

  trackPageView(userId: string, userRole: TelemetryEvent['userRole'], pageName: string) {
    this.track({
      userId,
      userRole,
      component: pageName,
      action: 'page_view',
    });
  }

  trackError(userId: string, userRole: TelemetryEvent['userRole'], component: string, error: Error | string, metadata?: Record<string, any>) {
    this.track({
      userId,
      userRole,
      component,
      action: 'error',
      metadata: {
        error: typeof error === 'string' ? error : error.message,
        stack: typeof error === 'object' ? error.stack : undefined,
        ...metadata,
      },
    });
  }

  trackPerformance(userId: string, userRole: TelemetryEvent['userRole'], component: string, metric: string, value: number) {
    this.track({
      userId,
      userRole,
      component,
      action: 'performance',
      metadata: { metric, value },
    });
  }

  trackFormSubmit(userId: string, userRole: TelemetryEvent['userRole'], component: string, formId: string, success: boolean, metadata?: Record<string, any>) {
    this.track({
      userId,
      userRole,
      component,
      action: 'form_submit',
      metadata: { formId, success, ...metadata },
    });
  }

  async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch(`${this.backendUrl}/api/telemetry/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
      });

      console.log(`[Telemetry] Flushed ${eventsToSend.length} events`);
    } catch (error) {
      console.error('[Telemetry] Failed to flush events:', error);
      // Re-add events to queue
      this.events.unshift(...eventsToSend);
    }
  }

  async getStats(): Promise<TelemetryStats> {
    try {
      const response = await fetch(`${this.backendUrl}/api/telemetry/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('[Telemetry] Failed to get stats:', error);
      throw error;
    }
  }

  async getEvents(limit?: number): Promise<TelemetryEvent[]> {
    try {
      const url = limit
        ? `${this.backendUrl}/api/telemetry/events?limit=${limit}`
        : `${this.backendUrl}/api/telemetry/events`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch events');
      return await response.json();
    } catch (error) {
      console.error('[Telemetry] Failed to get events:', error);
      throw error;
    }
  }

  exportEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  clear() {
    this.events = [];
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

// Singleton instance
export const telemetry = new TelemetryService();
