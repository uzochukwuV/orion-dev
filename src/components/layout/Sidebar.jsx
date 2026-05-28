import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Megaphone, Users, Share2, Bot, Settings, Zap, BarChart3 } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: TrendingUp, label: 'Intelligence', path: '/intelligence' },
  { icon: Megaphone, label: 'Campaigns', path: '/campaigns' },
  { icon: Users, label: 'Leads & CRM', path: '/leads' },
  { icon: Share2, label: 'Social Media', path: '/social' },
  { icon: Bot, label: 'AI Agents', path: '/agents' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-paper-white border-r border-ghost-border flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-ghost-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-electric-violet rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-montserrat font-700 text-[18px] text-midnight-ink tracking-[-0.02em]">Orion</span>
        </div>
        <p className="text-[11px] text-muted-ash font-inter mt-1 font-medium">AI Growth Agent</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 font-inter font-medium text-[14px] ${
                isActive
                  ? 'bg-electric-violet text-white'
                  : 'text-muted-ash hover:bg-cloud-canvas hover:text-midnight-ink'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Plan badge */}
      <div className="px-4 py-4 border-t border-ghost-border">
        <div className="bg-cloud-canvas rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-inter font-medium text-muted-ash">Current Plan</span>
            <span className="text-[11px] bg-electric-violet text-white px-2 py-0.5 rounded-full font-medium">Growth</span>
          </div>
          <Link to="/settings" className="text-[12px] text-electric-violet font-medium hover:underline">Upgrade to Pro →</Link>
        </div>
      </div>
    </aside>
  );
}