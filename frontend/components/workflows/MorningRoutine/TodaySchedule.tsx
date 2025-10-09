import React from 'react';
import { paidTheme } from '../../../styles/paiid-theme';

interface ScheduleEvent {
  time: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
  actual?: string;
  forecast?: string;
  previous?: string;
}

const impactColors = {
  high: paidTheme.colors.error,
  medium: paidTheme.colors.warning,
  low: paidTheme.colors.info,
};

const impactLabels = {
  high: 'High Impact',
  medium: 'Medium Impact',
  low: 'Low Impact',
};

export const TodaySchedule: React.FC = () => {
  // Mock economic calendar data - in production, fetch from API
  const events: ScheduleEvent[] = [
    {
      time: '8:30 AM',
      title: 'Initial Jobless Claims',
      impact: 'high',
      forecast: '220K',
      previous: '218K',
    },
    {
      time: '10:00 AM',
      title: 'Consumer Confidence Index',
      impact: 'high',
      forecast: '104.5',
      previous: '103.2',
    },
    {
      time: '10:30 AM',
      title: 'Crude Oil Inventories',
      impact: 'medium',
      forecast: '-2.1M',
      previous: '-1.5M',
    },
    {
      time: '2:00 PM',
      title: 'FOMC Meeting Minutes',
      impact: 'high',
      forecast: 'N/A',
      previous: 'N/A',
    },
    {
      time: '4:00 PM',
      title: 'Earnings: AAPL, MSFT, GOOGL',
      impact: 'high',
    },
  ];

  const upcomingEvents = events.filter((event) => {
    const now = new Date();
    const eventTime = new Date();
    const [time, period] = event.time.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    eventTime.setHours(
      period === 'PM' && hours !== 12 ? hours + 12 : hours,
      minutes
    );
    return eventTime > now;
  });

  return (
    <div
      style={{
        background: paidTheme.colors.glass,
        backdropFilter: paidTheme.effects.blur,
        border: `1px solid ${paidTheme.colors.glassBorder}`,
        borderRadius: paidTheme.borderRadius.lg,
        padding: paidTheme.spacing.lg,
      }}
    >
      <div
        style={{
          fontSize: paidTheme.typography.fontSize.xl,
          color: paidTheme.colors.text,
          fontWeight: 600,
          marginBottom: paidTheme.spacing.lg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>Today's Schedule</span>
        <div
          style={{
            fontSize: paidTheme.typography.fontSize.xs,
            color: paidTheme.colors.textMuted,
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {upcomingEvents.length} upcoming
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: paidTheme.spacing.sm,
        }}
      >
        {events.map((event, index) => {
          const isPast = !upcomingEvents.includes(event);

          return (
            <div
              key={index}
              style={{
                background: isPast
                  ? `${paidTheme.colors.textMuted}10`
                  : paidTheme.colors.glass,
                border: `1px solid ${
                  isPast
                    ? `${paidTheme.colors.textMuted}20`
                    : paidTheme.colors.glassBorder
                }`,
                borderRadius: paidTheme.borderRadius.md,
                padding: paidTheme.spacing.md,
                transition: `all ${paidTheme.animation.duration.normal}`,
                opacity: isPast ? 0.5 : 1,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isPast) {
                  e.currentTarget.style.background =
                    paidTheme.colors.glassHover;
                  e.currentTarget.style.borderColor =
                    impactColors[event.impact] + '40';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPast) {
                  e.currentTarget.style.background = paidTheme.colors.glass;
                  e.currentTarget.style.borderColor =
                    paidTheme.colors.glassBorder;
                }
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: paidTheme.spacing.md,
                }}
              >
                <div
                  style={{
                    fontFamily: paidTheme.typography.fontFamily.mono,
                    fontSize: paidTheme.typography.fontSize.sm,
                    color: paidTheme.colors.textMuted,
                    minWidth: '65px',
                    fontWeight: 600,
                  }}
                >
                  {event.time}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: paidTheme.typography.fontSize.base,
                      color: paidTheme.colors.text,
                      fontWeight: 500,
                      marginBottom: paidTheme.spacing.xs,
                    }}
                  >
                    {event.title}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: paidTheme.spacing.md,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: paidTheme.spacing.xs,
                        padding: `${paidTheme.spacing.xs} ${paidTheme.spacing.sm}`,
                        background: `${impactColors[event.impact]}20`,
                        border: `1px solid ${impactColors[event.impact]}40`,
                        borderRadius: paidTheme.borderRadius.sm,
                        fontSize: paidTheme.typography.fontSize.xs,
                        color: impactColors[event.impact],
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: impactColors[event.impact],
                        }}
                      />
                      {impactLabels[event.impact]}
                    </div>

                    {event.forecast && (
                      <div
                        style={{
                          fontSize: paidTheme.typography.fontSize.xs,
                          color: paidTheme.colors.textMuted,
                        }}
                      >
                        Forecast: <span style={{ fontFamily: paidTheme.typography.fontFamily.mono }}>{event.forecast}</span>
                      </div>
                    )}

                    {event.previous && (
                      <div
                        style={{
                          fontSize: paidTheme.typography.fontSize.xs,
                          color: paidTheme.colors.textMuted,
                        }}
                      >
                        Previous: <span style={{ fontFamily: paidTheme.typography.fontFamily.mono }}>{event.previous}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {upcomingEvents.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: paidTheme.spacing.xl,
            color: paidTheme.colors.textMuted,
          }}
        >
          No more events scheduled for today
        </div>
      )}
    </div>
  );
};
