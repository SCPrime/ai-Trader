# UserSetupAI.tsx Update Instructions

## STEP 1: Add import at the top (around line 4)
Add this line with the other imports:
```tsx
import { useChat } from './ChatContext';
```

## STEP 2: Add openChat hook at the beginning of the component (around line 12)
After the existing useState hooks, add:
```tsx
const { openChat } = useChat();
```

## STEP 3: Replace the header section (lines 132-193)
Replace the entire header div with this:
```tsx
        {/* Centered Enhanced Logo Header - 96px */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: theme.spacing.xl,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {/* Line 1: Large PaiiD Logo (96px) */}
          <h1
            style={{
              fontSize: '96px',
              fontWeight: 'bold',
              margin: 0,
              letterSpacing: '4px',
              lineHeight: '1',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 4px 8px rgba(26, 117, 96, 0.4))',
              }}
            >
              P
            </span>
            <span
              onClick={openChat}
              style={{
                color: '#45f0c0',
                textShadow: '0 0 25px rgba(69, 240, 192, 0.9), 0 0 50px rgba(69, 240, 192, 0.6)',
                animation: 'breathe-glow 3s ease-in-out infinite',
                fontStyle: 'italic',
                cursor: 'pointer',
                display: 'inline-block',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1) translateY(-4px)';
                e.currentTarget.style.textShadow =
                  '0 0 35px rgba(69, 240, 192, 1), 0 0 70px rgba(69, 240, 192, 0.8), 0 0 100px rgba(69, 240, 192, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.textShadow =
                  '0 0 25px rgba(69, 240, 192, 0.9), 0 0 50px rgba(69, 240, 192, 0.6)';
              }}
            >
              aii
            </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 4px 8px rgba(26, 117, 96, 0.4))',
              }}
            >
              D
            </span>
          </h1>

          {/* Line 2: Primary Subtitle (22px) */}
          <p
            style={{
              fontSize: '22px',
              color: '#cbd5e1',
              margin: 0,
              letterSpacing: '1px',
              fontWeight: '500',
            }}
          >
            Personal{' '}
            <span
              style={{
                color: '#45f0c0',
                fontStyle: 'italic',
                textShadow: '0 0 8px rgba(69, 240, 192, 0.5)',
              }}
            >
              artificial intelligence
            </span>
            /investment Dashboard
          </p>

          {/* Line 3: Secondary Subtitle (16px) */}
          <p
            style={{
              fontSize: '16px',
              color: '#94a3b8',
              margin: 0,
              letterSpacing: '0.5px',
            }}
          >
            Let's set up your trading account
          </p>

          {/* Hint about clicking "aii" */}
          <div
            style={{
              fontSize: '13px',
              color: '#64748b',
              fontStyle: 'italic',
              marginTop: '8px',
              opacity: 0.7,
            }}
          >
            💡 Click <span style={{ color: '#45f0c0', fontWeight: 'bold' }}>aii</span> anytime to chat with AI assistant
          </div>
        </div>
```

## STEP 4: Add particles background (insert BEFORE the header div, around line 128)
```tsx
      {/* Particle Background for "aii" area */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: 0.3,
        }}
      >
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              backgroundColor: '#45f0c0',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-${i} ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              boxShadow: '0 0 4px rgba(69, 240, 192, 0.8)',
            }}
          />
        ))}
      </div>
```

## STEP 5: Update CSS animations (around line 614)
Replace the existing glow-ai keyframes with:
```tsx
      <style jsx>{`
        @keyframes breathe-glow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(69, 240, 192, 0.8), 0 0 40px rgba(69, 240, 192, 0.5);
            transform: scale(1);
          }
          50% {
            text-shadow: 0 0 30px rgba(69, 240, 192, 1), 0 0 60px rgba(69, 240, 192, 0.8),
              0 0 90px rgba(69, 240, 192, 0.4);
            transform: scale(1.05);
          }
        }

        ${[...Array(20)].map((_, i) => `
          @keyframes float-${i} {
            0%, 100% {
              transform: translate(0, 0) scale(1);
              opacity: 0.3;
            }
            50% {
              transform: translate(${Math.random() * 50 - 25}px, ${Math.random() * 50 - 25}px) scale(1.5);
              opacity: 0.8;
            }
          }
        `).join('\n')}
      `}</style>
```

## Summary of Changes:
1. ✅ Import useChat hook
2. ✅ Initialize openChat function
3. ✅ Replace header with larger 96px logo (was 52px)
4. ✅ Make "aii" clickable to open chat
5. ✅ Add hover effects on "aii"
6. ✅ Add hint text about clicking "aii"
7. ✅ Add floating particle background
8. ✅ Update animations with breathe effect

## Testing:
After making these changes:
1. Refresh the onboarding page
2. Click the glowing "aii" text
3. Verify the AI chat panel slides up from the bottom
4. Check that particles are floating in the background
