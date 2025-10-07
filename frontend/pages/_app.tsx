import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { TelemetryProvider } from '../components/TelemetryProvider';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  // Get user info (from your auth system or mock for now)
  const [user] = useState({
    id: 'owner-001', // Replace with real user ID from your auth system
    role: 'owner' as const, // or 'beta', 'alpha', 'user'
  });

  return (
    <TelemetryProvider
      userId={user.id}
      userRole={user.role}
      enabled={true}
    >
      <Component {...pageProps} />
    </TelemetryProvider>
  );
}
