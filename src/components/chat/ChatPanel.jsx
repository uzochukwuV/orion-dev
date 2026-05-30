/**
 * ChatPanel Modal — Chat with AI agent via backend API
 */

import { useState, useRef, useEffect } from 'react';
import { apiPost } from '@/api/entities';
import { useAuth } from '@/lib/useOrionAuth';
import { Send, Loader2, X } from 'lucide-react';

export default function ChatPanel({ isOpen, onClose }) {
  const { business } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!business?.id) {
      console.error('No business ID available');
      return;
    }

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }]);
    setLoading(true);

    try {
      const res = await apiPost('/api/agents/chat', {
        message: userMessage,
        business_id: business.id,
        session_id: sessionId,
      });

      if (res.session_id && !sessionId) {
        setSessionId(res.session_id);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: res.reply || res.response, timestamp: new Date().toISOString() }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, { role: 'system', content: 'Failed to send message. Please try again.', timestamp: new Date().toISOString() }]);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50">
      <div className="w-full md:w-96 bg-white rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col h-[80vh] md:h-[600px]">
        {/* Header */}
        <div className="border-b border-ghost-border p-4 flex items-center justify-between bg-midnight-ink text-white rounded-t-2xl">
          <h2 className="font-montserrat font-medium text-[16px]">Chat with AI</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-paper-white">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-ash">
              <p className="text-[13px] font-inter">Start a conversation with the AI agent</p>
              <p className="text-[12px] font-inter mt-1">Ask about leads, campaigns, or business insights</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2.5 rounded-xl text-[13px] font-inter ${
                msg.role === 'user'
                  ? 'bg-electric-violet text-white'
                  : msg.role === 'system'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-cloud-canvas text-midnight-ink'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-cloud-canvas text-midnight-ink px-4 py-2.5 rounded-xl flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[13px] font-inter">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-ghost-border p-4 bg-paper-white rounded-b-2xl md:rounded-b-2xl">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type your question…"
              disabled={loading}
              className="flex-1 bg-cloud-canvas border border-ghost-border rounded-full px-4 py-2.5 text-[13px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="p-2.5 bg-electric-violet text-white rounded-full hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
