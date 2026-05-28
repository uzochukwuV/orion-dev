import { useState } from 'react';
import { Mic, MessageSquare, Bell, ChevronDown, User } from 'lucide-react';
import VoiceModal from '../voice/VoiceModal';
import ChatPanel from '../chat/ChatPanel';

export default function TopBar({ title, subtitle }) {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-[220px] right-0 h-[64px] bg-paper-white border-b border-ghost-border flex items-center justify-between px-8 z-20">
        {/* Left: Page title */}
        <div>
          <h1 className="font-montserrat font-medium text-[20px] text-midnight-ink tracking-[-0.02em] leading-none">{title}</h1>
          {subtitle && <p className="text-[13px] text-muted-ash font-inter mt-0.5">{subtitle}</p>}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Voice button */}
          <button
            onClick={() => setVoiceOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cloud-canvas border border-ghost-border rounded-full text-[13px] font-inter font-medium text-midnight-ink hover:border-electric-violet hover:text-electric-violet transition-all"
          >
            <Mic className="w-3.5 h-3.5" />
            Voice
          </button>

          {/* Chat button */}
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-electric-violet rounded-full text-[13px] font-inter font-medium text-white hover:opacity-90 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Ask AI
          </button>

          {/* Notifications */}
          <button className="w-9 h-9 bg-cloud-canvas border border-ghost-border rounded-full flex items-center justify-center hover:border-electric-violet transition-all relative">
            <Bell className="w-4 h-4 text-muted-ash" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-electric-violet rounded-full"></span>
          </button>

          {/* Account */}
          <button className="flex items-center gap-2 px-3 py-1.5 bg-cloud-canvas border border-ghost-border rounded-full hover:border-electric-violet transition-all">
            <div className="w-6 h-6 bg-electric-violet rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <ChevronDown className="w-3 h-3 text-muted-ash" />
          </button>
        </div>
      </header>

      <VoiceModal open={voiceOpen} onClose={() => setVoiceOpen(false)} />
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}