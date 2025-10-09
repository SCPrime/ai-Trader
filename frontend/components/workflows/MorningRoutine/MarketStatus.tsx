import React, { useState, useEffect } from 'react';
import { paidTheme } from '../../../styles/paiid-theme';

interface MarketHours {
  isOpen: boolean;
  nextEvent: string;
  timeUntil: string;
}

export const MarketStatus: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketHours, setMarketHours] = useState<MarketHours>({
    isOpen: false,
    nextEvent: 'Market Open',
    timeUntil: '--:--:--',
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkMarketHours = () => {
      const now = new Date();
      const day = now.getDay();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentMinutes = hours * 60 + minutes;

      // Weekend check
      if (day === 0 || day === 6) {
        const daysUntilMonday = day === 0 ? 1 : 2;
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + daysUntilMonday);
        nextMonday.setHours(9, 30, 0, 0);

        const diff = nextMonday.getTime() - now.getTime();
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        setMarketHours({
          isOpen: false,
          nextEvent: 'Market Open (Monday)',
          timeUntil: `${hoursLeft}h ${minutesLeft}m`,
        });
        return;
      }

      // Market hours: 9:30 AM - 4:00 PM ET
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM

      if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
        // Market is open
        const minutesToClose = marketClose - currentMinutes;
        const hoursLeft = Math.floor(minutesToClose / 60);
        const minsLeft = minutesToClose % 60;

        setMarketHours({
          isOpen: true,
          nextEvent: 'Market Close',
          timeUntil: `${hoursLeft}h ${minsLeft}m`,
        });
      } else if (currentMinutes < marketOpen) {
        // Before market open
        const minutesToOpen = marketOpen - currentMinutes;
        const hoursLeft = Math.floor(minutesToOpen / 60);
        const minsLeft = minutesToOpen % 60;

        setMarketHours({
          isOpen: false,
          nextEvent: 'Market Open',
          timeUntil: `${hoursLeft}h ${minsLeft}m`,
        });
      } else {
        // After market close
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + (day === 5 ? 3 : 1)); // Skip weekend if Friday
        tomorrow.setHours(9, 30, 0, 0);

        const diff = tomorrow.getTime() - now.getTime();
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        setMarketHours({
          isOpen: false,
          nextEvent: day === 5 ? 'Market Open (Monday)' : 'Market Open',
          timeUntil: `${hoursLeft}h ${minutesLeft}m`,
        });
      }
    };

    checkMarketHours();
    const interval = setInterval(checkMarketHours, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentTime]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      style={{
        background: paidTheme.colors.glass,
        backdropFilter: paidTheme.effects.blur,
        border: `1px solid ${paidTheme.colors.glassBorder}`,
        borderRadius: paidTheme.borderRadius.lg,
        padding: paidTheme.spacing.lg,
        transition: `all ${paidTheme.animation.duration.normal}`,
      }}
    >
      <div style={{ marginBottom: paidTheme.spacing.md }}>
        <div
          style={{
            fontSize: paidTheme.typography.fontSize['3xl'],
            fontFamily: paidTheme.typography.fontFamily.mono,
            color: paidTheme.colors.text,
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          {formatTime(currentTime)}
        </div>
        <div
          style={{
            fontSize: paidTheme.typography.fontSize.sm,
            color: paidTheme.colors.textMuted,
            marginTop: paidTheme.spacing.xs,
          }}
        >
          {formatDate(currentTime)}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: paidTheme.spacing.md,
          padding: paidTheme.spacing.md,
          background: marketHours.isOpen
            ? `${paidTheme.colors.success}15`
            : `${paidTheme.colors.textMuted}15`,
          borderRadius: paidTheme.borderRadius.md,
          border: `1px solid ${
            marketHours.isOpen
              ? `${paidTheme.colors.success}40`
              : `${paidTheme.colors.textMuted}40`
          }`,
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: marketHours.isOpen
              ? paidTheme.colors.success
              : paidTheme.colors.textMuted,
            boxShadow: marketHours.isOpen
              ? paidTheme.effects.glow(paidTheme.colors.success)
              : 'none',
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: paidTheme.typography.fontSize.sm,
              color: paidTheme.colors.textMuted,
            }}
          >
            {marketHours.nextEvent}
          </div>
          <div
            style={{
              fontSize: paidTheme.typography.fontSize.lg,
              color: paidTheme.colors.text,
              fontFamily: paidTheme.typography.fontFamily.mono,
              fontWeight: 600,
            }}
          >
            {marketHours.timeUntil}
          </div>
        </div>
      </div>
    </div>
  );
};
