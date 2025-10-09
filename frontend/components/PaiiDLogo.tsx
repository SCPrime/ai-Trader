'use client';

import { useChat } from './ChatContext';

interface PaiiDLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showSubtitle?: boolean;
  style?: React.CSSProperties;
}

const sizeMap = {
  small: 24,
  medium: 42,
  large: 64,
  xlarge: 96,
};

export default function PaiiDLogo({
  size = 'medium',
  showSubtitle = false,
  style = {}
}: PaiiDLogoProps) {
  const { openChat } = useChat();
  const fontSize = sizeMap[size];

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', ...style }}>
      <div
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 'bold',
          letterSpacing: size === 'xlarge' ? '4px' : size === 'large' ? '2px' : '1px',
          lineHeight: '1',
        }}
      >
        <span
          style={{
            background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 4px rgba(26, 117, 96, 0.4))',
          }}
        >
          P
        </span>
        <span
          style={{
            background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          a
        </span>
        <span
          onClick={openChat}
          style={{
            background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: `0 0 ${fontSize * 0.25}px rgba(16, 185, 129, 0.9), 0 0 ${fontSize * 0.5}px rgba(16, 185, 129, 0.6)`,
            animation: 'logo-breathe 3s ease-in-out infinite',
            fontStyle: 'italic',
            cursor: 'pointer',
            display: 'inline-block',
            position: 'relative',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.15) translateY(-2px)';
            e.currentTarget.style.textShadow = `0 0 ${fontSize * 0.4}px rgba(16, 185, 129, 1), 0 0 ${fontSize * 0.8}px rgba(16, 185, 129, 0.8)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.textShadow = `0 0 ${fontSize * 0.25}px rgba(16, 185, 129, 0.9), 0 0 ${fontSize * 0.5}px rgba(16, 185, 129, 0.6)`;
          }}
          title="Click to open AI assistant"
        >
          aii
        </span>
        <span
          style={{
            background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 4px rgba(26, 117, 96, 0.4))',
          }}
        >
          D
        </span>
      </div>

      {showSubtitle && size === 'xlarge' && (
        <>
          <p
            style={{
              fontSize: '22px',
              color: '#cbd5e1',
              margin: '12px 0 0 0',
              letterSpacing: '1px',
              fontWeight: '500',
              textAlign: 'center',
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
          <p
            style={{
              fontSize: '16px',
              color: '#94a3b8',
              margin: '8px 0 0 0',
              letterSpacing: '0.5px',
              textAlign: 'center',
            }}
          >
            10 Stage Workflow
          </p>
        </>
      )}

      {showSubtitle && size === 'large' && (
        <p
          style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: '8px 0 0 0',
            letterSpacing: '0.5px',
            textAlign: 'center',
          }}
        >
          10 Stage Workflow
        </p>
      )}

      <style jsx>{`
        @keyframes logo-breathe {
          0%, 100% {
            text-shadow: 0 0 ${fontSize * 0.2}px rgba(16, 185, 129, 0.8),
                         0 0 ${fontSize * 0.4}px rgba(16, 185, 129, 0.5);
          }
          50% {
            text-shadow: 0 0 ${fontSize * 0.3}px rgba(16, 185, 129, 1),
                         0 0 ${fontSize * 0.6}px rgba(16, 185, 129, 0.8),
                         0 0 ${fontSize * 0.9}px rgba(16, 185, 129, 0.4);
          }
        }
      `}</style>
    </div>
  );
}
