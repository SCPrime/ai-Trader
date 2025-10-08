"use client";

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { telemetry } from '../services/telemetry';

interface TelemetryContextValue {
  track: typeof telemetry.track;
  trackPageView: typeof telemetry.trackPageView;
  trackClick: typeof telemetry.trackClick;
  trackFormSubmit: typeof telemetry.trackFormSubmit;
  trackError: typeof telemetry.trackError;
  trackFeature: typeof telemetry.trackFeature;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

interface TelemetryProviderProps {
  children: ReactNode;
  userId: string;
  userRole: 'admin' | 'beta' | 'alpha' | 'user' | 'owner';
  enabled?: boolean;
}

export function TelemetryProvider({
  children,
  userId,
  userRole,
  enabled = true
}: TelemetryProviderProps) {

  useEffect(() => {
    if (!enabled) {
      telemetry.disable();
      return;
    }

    telemetry.enable();

    // Store user info in localStorage for error tracking
    localStorage.setItem('userId', userId);
    localStorage.setItem('userRole', userRole);

    // Track initial page load
    telemetry.trackPageView(userId, userRole, 'App');

    // Track performance metrics
    if (window.performance && window.performance.timing) {
      const perfData = window.performance.timing;
      const loadTime = perfData.loadEventEnd - perfData.navigationStart;

      telemetry.track({
        userId,
        userRole,
        component: 'App',
        action: 'performance',
        metadata: {
          loadTime,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
          domInteractive: perfData.domInteractive - perfData.navigationStart,
        },
      });
    }

    // Cleanup on unmount
    return () => {
      telemetry.flush();
    };
  }, [userId, userRole, enabled]);

  const contextValue: TelemetryContextValue = {
    track: telemetry.track.bind(telemetry),
    trackPageView: telemetry.trackPageView.bind(telemetry),
    trackClick: telemetry.trackClick.bind(telemetry),
    trackFormSubmit: telemetry.trackFormSubmit.bind(telemetry),
    trackError: telemetry.trackError.bind(telemetry),
    trackFeature: telemetry.trackFeature.bind(telemetry),
  };

  return (
    <TelemetryContext.Provider value={contextValue}>
      {children}
    </TelemetryContext.Provider>
  );
}

// Hook to use telemetry in components
export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    // Return no-op functions if telemetry is not available
    return {
      track: () => {},
      trackPageView: () => {},
      trackClick: () => {},
      trackFormSubmit: () => {},
      trackError: () => {},
      trackFeature: () => {},
    };
  }
  return context;
}

export default TelemetryProvider;
