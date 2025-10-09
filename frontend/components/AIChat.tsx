/**
 * AI Chat Component
 * Reusable AI chat interface that can be triggered from anywhere in the app
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Brain, Sparkles, Loader2 } from 'lucide-react';
import { claudeAI, AIMessage } from '../lib/aiAdapter';
import { GlassCard, GlassButton, GlassInput } from './GlassmorphicComponents';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt?: string;
  initialMessage?: string;
  onResponse?: (response: string) => void;
}

export function AIChat({
  isOpen,
  onClose,
  systemPrompt,
  initialMessage = "Hi! I'm your PaiiD AI assistant. I can help you with trading strategies, analyze market data, or adjust your preferences. What would you like to know?",
  onResponse,
}: AIChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'assistant', content: initialMessage },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset conversation when closed
  useEffect(() => {
    if (!isOpen) {
      claudeAI.resetConversation();
      setMessages([{ role: 'assistant', content: initialMessage }]);
      setInput('');
    }
  }, [isOpen, initialMessage]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await claudeAI.chat(userMessage, systemPrompt);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);

      if (onResponse) {
        onResponse(response);
      }
    } catch (error) {
      console.error('[AIChat] Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard
          className="flex flex-col h-[600px]"
          style={{ padding: 0, overflow: 'hidden' }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b"
            style={{
              background: `linear-gradient(135deg, #7E57C2 0%, #0097A7 100%)`,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Brain className="w-6 h-6 text-white" />
                  <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">PaiiD AI Assistant</h2>
                  <p className="text-xs text-white/80">
                    Powered by Claude Sonnet 4.5
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-white/60 backdrop-blur-md border border-white/20 text-gray-800'
                  }`}
                  style={{
                    boxShadow: msg.role === 'user'
                      ? '0 4px 12px rgba(99, 102, 241, 0.3)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything about trading..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-white/60 backdrop-blur-md border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 placeholder-gray-500 disabled:opacity-50"
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/**
 * AI Chat Trigger Button
 * Click the "ai" in "PaiiD" logo to open chat
 */
interface AILogoTriggerProps {
  onClick: () => void;
}

export function AILogoTrigger({ onClick }: AILogoTriggerProps) {
  return (
    <div className="flex flex-col select-none">
      <div className="flex items-center gap-1 text-2xl font-bold">
        <span className="text-blue-600">P</span>
        <span
          className="text-purple-600 cursor-pointer hover:scale-110 transition-transform relative group"
          onClick={onClick}
        >
          ai
          <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
        <span className="text-blue-600">D</span>
      </div>
      <div className="text-xs text-gray-500 mt-0.5">
        Personal Artificial Intelligence Dashboard
      </div>
      <div className="text-[10px] text-gray-400">
        10 Stage Workflow
      </div>
    </div>
  );
}

export default AIChat;
