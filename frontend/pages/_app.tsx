// @ts-nocheck
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { TelemetryProvider } from '../components/TelemetryProvider';
import { ChatProvider, useChat } from '../components/ChatContext';
import AIChatBot from '../components/AIChatBot';
import '../styles/globals.css';

function AppContent({ Component, pageProps, userId, userRole, telemetryEnabled }: AppProps & { userId: string; userRole: 'owner' | 'beta' | 'alpha' | 'user'; telemetryEnabled: boolean }) {
  const { isChatOpen, closeChat } = useChat();

  return (
    <TelemetryProvider
      userId={userId}
      userRole={userRole}
      enabled={telemetryEnabled}
    >
      <Component {...pageProps} />
      <AIChatBot isOpen={isChatOpen} onClose={closeChat} />
    </TelemetryProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  // Get user info (from your auth system or mock for now)
  const [user] = useState({
    id: 'owner-001', // Replace with real user ID from your auth system
    role: 'owner' as const, // or 'beta', 'alpha', 'user'
  });

  // Check if telemetry is enabled from environment variable
  const telemetryEnabled = process.env.NEXT_PUBLIC_TELEMETRY_ENABLED !== 'false';

  return (
    <ChatProvider>
      <AppContent
        Component={Component}
        pageProps={pageProps}
        userId={user.id}
        userRole={user.role}
        telemetryEnabled={telemetryEnabled}
      />
    </ChatProvider>
  );
}
