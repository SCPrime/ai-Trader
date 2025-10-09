'use client';

import { useState, useRef, useEffect } from 'react';

interface AIChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatBot({ isOpen, onClose }: AIChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm PaiiD AI, your personal trading assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm processing your request. This is a demo response. In production, this would connect to Claude API.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            animation: 'fadeIn 0.3s ease-out',
          }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40vh',
          backgroundColor: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(20px)',
          borderTop: '2px solid #45f0c0',
          boxShadow: '0 -8px 32px rgba(69, 240, 192, 0.3)',
          zIndex: 1000,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(69, 240, 192, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#45f0c0',
                boxShadow: '0 0 12px rgba(69, 240, 192, 0.8)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            <span style={{ color: '#45f0c0', fontSize: '18px', fontWeight: 'bold', fontStyle: 'italic' }}>
              Pa<span style={{ textShadow: '0 0 12px rgba(69, 240, 192, 0.6)' }}>ii</span>D AI Assistant
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
              transition: 'color 0.2s',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((message) => (
            <div key={message.id} style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: message.role === 'user' ? 'rgba(69, 240, 192, 0.15)' : 'rgba(30, 41, 59, 0.8)',
                  border: `1px solid ${message.role === 'user' ? 'rgba(69, 240, 192, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`,
                  color: '#e2e8f0',
                }}
              >
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{message.content}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }} suppressHydrationWarning>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ display: 'flex', gap: '4px', padding: '12px' }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div
                  key={i}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#45f0c0',
                    animation: 'bounce 1.4s infinite ease-in-out both',
                    animationDelay: `${delay}s`,
                  }}
                />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(69, 240, 192, 0.2)', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about trading..."
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(69, 240, 192, 0.3)',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: input.trim() ? '#45f0c0' : 'rgba(69, 240, 192, 0.3)',
              border: 'none',
              borderRadius: '8px',
              color: '#0f172a',
              fontWeight: 'bold',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              boxShadow: input.trim() ? '0 0 20px rgba(69, 240, 192, 0.4)' : 'none',
            }}
          >
            Send
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.8; } }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
      `}</style>
    </>
  );
}
