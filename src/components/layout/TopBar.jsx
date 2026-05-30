import { useState } from 'react';
import { Mic, MessageSquare, Bell, ChevronDown, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceModal from '../voice/VoiceModal';
import ChatPanel from '../chat/ChatPanel';
import { useAuth } from '@/lib/useOrionAuth';

export default function TopBar({ title, subtitle }) {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, business, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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

          {/* Account dropdown */}
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-cloud-canvas border border-ghost-border rounded-full hover:border-electric-violet transition-all"
            >
              <div className="w-6 h-6 bg-electric-violet rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="text-[13px] font-inter font-medium text-midnight-ink max-w-[120px] truncate">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-ash" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-paper-white border border-ghost-border rounded-xl shadow-lg overflow-hidden z-50">
                <div className="p-3 border-b border-ghost-border">
                  <p className="text-[13px] font-inter font-medium text-midnight-ink truncate">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-muted-ash font-inter truncate">{user?.email}</p>
                  {business && (
                    <p className="text-[11px] text-electric-violet font-inter mt-1 truncate">{business.name}</p>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-inter text-midnight-ink hover:bg-cloud-canvas transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <VoiceModal open={voiceOpen} onClose={() => setVoiceOpen(false)} />
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}