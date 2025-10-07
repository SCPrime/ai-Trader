"use client";

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { telemetry, TelemetryEvent } from '../services/telemetry';

interface TelemetryContextValue {
  track: (event: Omit<TelemetryEvent, 'sessionId' | 'timestamp'>) => void;
  trackClick: (userId: string, userRole: TelemetryEvent['userRole'], component: string, elementId: string, metadata?: Record<string, any>) => void;
  trackPageView: (userId: string, userRole: TelemetryEvent['userRole'], pageName: string) => void;
  trackError: (userId: string, userRole: TelemetryEvent['userRole'], component: string, error: Error | string, metadata?: Record<string, any>) => void;
  trackPerformance: (userId: string, userRole: TelemetryEvent['userRole'], component: string, metric: string, value: number) => void;
  trackFormSubmit: (userId: string, userRole: TelemetryEvent['userRole'], component: string, formId: string, success: boolean, metadata?: Record<string, any>) => void;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

interface TelemetryProviderProps {
  children: ReactNode;
  userId: string;
  userRole: TelemetryEvent['userRole'];
  enabled?: boolean;
}

export function TelemetryProvider({ children, userId, userRole, enabled = true }: TelemetryProviderProps) {
  useEffect(() => {
    if (!enabled) return;

    // Track page view on mount
    telemetry.trackPageView(userId, userRole, window.location.pathname);

    // Cleanup on unmount
    return () => {
      telemetry.destroy();
    };
  }, [userId, userRole, enabled]);

  const contextValue: TelemetryContextValue = {
    track: (event) => {
      if (enabled) {
        telemetry.track(event);
      }
    },
    trackClick: (uid, role, component, elementId, metadata) => {
      if (enabled) {
        telemetry.trackClick(uid, role, component, elementId, metadata);
      }
    },
    trackPageView: (uid, role, pageName) => {
      if (enabled) {
        telemetry.trackPageView(uid, role, pageName);
      }
    },
    trackError: (uid, role, component, error, metadata) => {
      if (enabled) {
        telemetry.trackError(uid, role, component, error, metadata);
      }
    },
    trackPerformance: (uid, role, component, metric, value) => {
      if (enabled) {
        telemetry.trackPerformance(uid, role, component, metric, value);
      }
    },
    trackFormSubmit: (uid, role, component, formId, success, metadata) => {
      if (enabled) {
        telemetry.trackFormSubmit(uid, role, component, formId, success, metadata);
      }
    },
  };

  return (
    <TelemetryContext.Provider value={contextValue}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
