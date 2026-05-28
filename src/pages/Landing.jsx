import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, TrendingUp, Users, Share2, Megaphone, Bot, ArrowRight, X, ChevronRight, CheckCircle2, Star, BarChart3, MessageSquare, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

const logos = [
  'Bella Salon', 'FitLife Gym', 'Glow Clinic', 'Casa Eats', 'PlumbPro',
  'SparkElectric', 'GreenScape', 'PawCare', 'StyleHub', 'VoltFix',
  'FreshClean', 'TasteKitchen', 'FixRight', 'BloomPets', 'NailBar',
];

const capabilities = [
  { icon: TrendingUp, label: 'Market Intelligence', color: 'bg-electric-violet/10 text-electric-violet', desc: 'Scans competitors & trends daily' },
  { icon: Megaphone, label: 'Auto Campaigns', color: 'bg-green-50 text-green-600', desc: 'AI-generated, ready to launch' },
  { icon: Users, label: 'Lead Scoring', color: 'bg-orange-50 text-orange-500', desc: 'Score & follow-up automatically' },
  { icon: Share2, label: 'Social Media', color: 'bg-pink-50 text-pink-500', desc: 'A week of posts in 30 seconds' },
  { icon: Bot, label: 'AI Agents', color: 'bg-blue-50 text-blue-500', desc: '4 agents working 24/7' },
  { icon: BarChart3, label: 'Analytics', color: 'bg-purple-50 text-purple-500', desc: 'Revenue attribution & insights' },
];

const steps = [
  { n: '01', title: 'Tell Orion about your business', desc: 'Business name, category, and location. Done in under a minute.' },
  { n: '02', title: 'See your first market insight', desc: "Orion scans live web data and shows what's happening with competitors and trends right now." },
  { n: '03', title: 'Take action instantly', desc: 'Launch a campaign, follow up a lead, or generate social posts — all with one click.' },
];

const testimonials = [
  { name: 'Aisha B.', biz: 'Luxe Hair Studio, Lagos', quote: 'Within the first week, Orion found a competitor gap and I launched a campaign in 5 minutes. Booked 11 new clients.', stars: 5 },
  { name: 'Carlos R.', biz: 'FitLife Gym, Nairobi', quote: 'The voice feature is magic — I just talk while driving and Orion updates my CRM and queues my social posts.', stars: 5 },
  { name: 'Priya N.', biz: 'Glow Skin Clinic, Mumbai', quote: 'Onboarding took 3 minutes. By the end I already had my first AI campaign ready to launch.', stars: 5 },
];

// Mini dashboard mockup component
function DashboardMockup() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-ghost-border shadow-[0_32px_80px_-16px_rgba(87,87,248,0.12),0_8px_32px_-8px_rgba(0,0,0,0.08)] bg-paper-white">
      {/* Mock top bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-cloud-canvas border-b border-ghost-border">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-paper-white border border-ghost-border rounded-lg px-3 py-1 text-[11px] text-muted-ash font-inter">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            app.orion.ai/dashboard
          </div>
        </div>
      </div>

      {/* Mock app layout */}
      <div className="flex" style={{ height: '340px' }}>
        {/* Sidebar */}
        <div className="w-[160px] shrink-0 bg-paper-white border-r border-ghost-border py-4 px-3 flex flex-col gap-0.5">
          <div className="flex items-center gap-2 px-2 py-2 mb-3">
            <div className="w-5 h-5 bg-electric-violet rounded-md flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-montserrat font-bold text-[13px] text-midnight-ink">Orion</span>
          </div>
          {[
            { label: 'Dashboard', active: false },
            { label: 'Intelligence', active: true },
            { label: 'Campaigns', active: false },
            { label: 'Leads & CRM', active: false },
            { label: 'Social Media', active: false },
            { label: 'AI Agents', active: false },
          ].map((item) => (
            <div key={item.label} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-inter font-medium ${item.active ? 'bg-electric-violet text-white' : 'text-muted-ash'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-white/60' : 'bg-ghost-border'}`} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 bg-cloud-canvas p-4 overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-montserrat font-medium text-[14px] text-midnight-ink">Market Intelligence</div>
              <div className="text-[10px] text-muted-ash font-inter">Live competitive insights for your business</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-electric-violet text-white rounded-full text-[10px] font-inter font-medium">
                <Zap className="w-2.5 h-2.5" /> Run Scan
              </div>
            </div>
          </div>

          {/* Opportunity cards */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {[
              { tag: 'Pricing Gap', badge: 'critical', title: 'Competitor raised prices 15%', score: '9.2', color: 'text-red-500 bg-red-50' },
              { tag: 'Trend', badge: 'high', title: 'Balayage demand up 34% this month', score: '8.7', color: 'text-orange-500 bg-orange-50' },
              { tag: 'Review', badge: 'medium', title: 'Top competitor has 3-week wait', score: '7.1', color: 'text-yellow-600 bg-yellow-50' },
              { tag: 'Seasonal', badge: 'high', title: 'Wedding season bookings open', score: '8.4', color: 'text-green-600 bg-green-50' },
            ].map((item, i) => (
              <div key={i} className="bg-paper-white rounded-lg p-2.5 border border-ghost-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-inter font-medium px-1.5 py-0.5 rounded-full ${item.color}`}>{item.tag}</span>
                  <span className="text-[9px] font-inter text-muted-ash">Impact: <span className="text-midnight-ink font-medium">{item.score}</span></span>
                </div>
                <p className="text-[10px] font-inter font-medium text-midnight-ink leading-tight">{item.title}</p>
              </div>
            ))}
          </div>

          {/* Bottom bar with AI message */}
          <div className="bg-paper-white rounded-lg border border-ghost-border p-2.5 flex items-center gap-2">
            <div className="w-5 h-5 bg-electric-violet/10 rounded-md flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-3 h-3 text-electric-violet" />
            </div>
            <p className="text-[10px] text-muted-ash font-inter flex-1">Orion found 4 new opportunities. Your competitor raised prices — <span className="text-electric-violet font-medium">launch a campaign now?</span></p>
            <div className="text-[9px] bg-electric-violet text-white px-2 py-1 rounded-full font-inter font-medium whitespace-nowrap">Act →</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  return (
    <div className="min-h-screen bg-paper-white overflow-x-hidden font-inter">

      {/* Announcement bar */}
      {announcementVisible && (
        <div className="relative bg-electric-violet/5 border-b border-electric-violet/10 h-10 flex items-center justify-center">
          <a href="#" className="flex items-center gap-2 text-[12px] text-midnight-ink font-inter font-medium hover:text-electric-violet transition-all">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-electric-violet text-white rounded-full text-[10px] font-medium">New</span>
            Orion raised $4M to build AI growth agents for local businesses
            <span className="flex items-center gap-0.5 text-electric-violet">Read more <ChevronRight className="w-3 h-3" /></span>
          </a>
          <button onClick={() => setAnnouncementVisible(false)} className="absolute right-4 text-muted-ash hover:text-midnight-ink transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sticky Nav */}
      <nav className="sticky top-0 z-50 px-24 bg-paper-white/90 backdrop-blur-md border-b border-ghost-border px-8 py-0 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-electric-violet rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-montserrat font-bold text-[17px] text-midnight-ink tracking-[-0.02em]">Orion</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {['Platform', 'Pricing', 'Resources'].map(item => (
              <a key={item} href="#" className="text-[13px] font-inter text-muted-ash hover:text-midnight-ink transition-all">{item}</a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/onboarding" className="text-[13px] font-inter text-muted-ash hover:text-midnight-ink transition-all px-3 py-1.5 rounded-lg border border-transparent hover:border-ghost-border">
            Sign in
          </Link>
          <Link to="/onboarding" className="px-4 py-2 bg-midnight-ink rounded-lg text-[13px] font-inter font-medium text-white hover:opacity-85 transition-all">
            Get started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-20 pb-16 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end gap-10 lg:gap-20 mb-12">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="font-montserrat font-bold text-[44px] md:text-[58px] leading-[1.05] tracking-[-0.03em] text-midnight-ink flex-1">
            Deploy AI agents that grow your <span className="text-electric-violet">local business</span>
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-5 lg:max-w-[320px] shrink-0">
            <p className="text-[15px] text-muted-ash font-inter leading-relaxed">
              Build, deploy, and improve AI agents for market intelligence, campaigns, leads, and social — all in one platform.
            </p>
            <div className="flex items-center gap-3">
              <Link to="/onboarding" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-electric-violet rounded-lg text-[13px] font-inter font-medium text-white hover:opacity-90 transition-all whitespace-nowrap">
                Start free
              </Link>
              <a href="#" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-cloud-canvas border border-ghost-border rounded-lg text-[13px] font-inter font-medium text-midnight-ink hover:border-midnight-ink transition-all whitespace-nowrap">
                Request a demo
              </a>
            </div>
          </motion.div>
        </div>

        {/* Logo marquee */}
        <div className="relative overflow-hidden mb-12">
          <div className="text-[11px] text-muted-ash font-inter mb-3 text-center">Trusted by local businesses everywhere</div>
          <div className="flex overflow-hidden">
            <div className="flex gap-8 animate-[marquee_30s_linear_infinite] shrink-0">
              {[...logos, ...logos].map((logo, i) => (
                <div key={i} className="shrink-0 flex items-center justify-center h-8 px-4 bg-cloud-canvas border border-ghost-border rounded-lg">
                  <span className="text-[11px] font-inter font-medium text-muted-ash whitespace-nowrap">{logo}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-paper-white pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-paper-white pointer-events-none" />
        </div>

        {/* Dashboard illustration */}
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
          <DashboardMockup />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y border-ghost-border py-12 px-8 bg-cloud-canvas">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '2 min', label: 'to first insight' },
            { value: '4×', label: 'avg revenue growth' },
            { value: '10k+', label: 'businesses running' },
            { value: '24/7', label: 'AI agents working' },
          ].map((s, i) => (
            <div key={i}>
              <p className="font-montserrat font-bold text-[32px] text-midnight-ink tracking-[-0.02em]">{s.value}</p>
              <p className="text-[12px] text-muted-ash font-inter mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <p className="text-[12px] font-inter font-medium text-electric-violet mb-2">Platform</p>
              <h2 className="font-montserrat font-bold text-[32px] text-midnight-ink tracking-[-0.02em]">Everything your business needs</h2>
            </div>
            <p className="text-[14px] text-muted-ash font-inter max-w-xs">Six AI modules, working together, always on. No technical setup required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((cap, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="group p-5 bg-paper-white border border-ghost-border rounded-xl hover:border-electric-violet/30 hover:shadow-sm transition-all cursor-pointer">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${cap.color}`}>
                  <cap.icon className="w-4.5 h-4.5" />
                </div>
                <p className="font-montserrat font-medium text-[14px] text-midnight-ink mb-1">{cap.label}</p>
                <p className="text-[12px] text-muted-ash font-inter">{cap.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-electric-violet text-[11px] font-inter font-medium opacity-0 group-hover:opacity-100 transition-all">
                  Learn more <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-8 bg-cloud-canvas border-t border-ghost-border">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[12px] font-inter font-medium text-electric-violet mb-2">How it works</p>
            <h2 className="font-montserrat font-bold text-[32px] text-midnight-ink tracking-[-0.02em] mb-4">From signup to first insight in 3 steps</h2>
            <p className="text-[14px] text-muted-ash font-inter leading-relaxed mb-8">No forms. No setup. No waiting. Orion starts generating value from minute one.</p>
            <Link to="/onboarding" className="inline-flex items-center gap-2 px-6 py-3 bg-electric-violet rounded-lg text-[13px] font-inter font-medium text-white hover:opacity-90 transition-all">
              Start now — it's free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex gap-5 p-5 bg-paper-white border border-ghost-border rounded-xl">
                <span className="font-montserrat font-bold text-[20px] text-electric-violet/30 leading-none flex-shrink-0 w-8">{step.n}</span>
                <div>
                  <p className="font-montserrat font-medium text-[14px] text-midnight-ink mb-1">{step.title}</p>
                  <p className="text-[12px] text-muted-ash font-inter leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-8 border-t border-ghost-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[12px] font-inter font-medium text-electric-violet mb-2">Testimonials</p>
            <h2 className="font-montserrat font-bold text-[32px] text-midnight-ink tracking-[-0.02em]">Business owners love Orion</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-6 bg-paper-white border border-ghost-border rounded-xl">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.stars).fill(0).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-electric-violet text-electric-violet" />)}
                </div>
                <p className="text-[13px] text-muted-ash font-inter leading-relaxed mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-ghost-border">
                  <div className="w-8 h-8 bg-electric-violet/10 rounded-full flex items-center justify-center">
                    <span className="text-[12px] font-montserrat font-bold text-electric-violet">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-[12px] font-inter font-medium text-midnight-ink">{t.name}</p>
                    <p className="text-[11px] text-muted-ash font-inter">{t.biz}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-8 bg-cloud-ink">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-montserrat font-bold text-[40px] tracking-[-0.02em] mb-4">Your business starts growing today.</h2>
          <p className="t font-inter text-[15px] mb-10">Join thousands of local businesses using Orion to win more customers.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/onboarding" className="inline-flex text-white items-center gap-2 px-8 py-4 bg-electric-violet rounded-lg text-[14px] font-inter font-medium  hover:opacity-90 transition-all">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#" className="inline-flex items-center  gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-lg text-[14px] font-inter font-medium  hover:bg-white/10 transition-all">
              Request a demo
            </a>
          </div>
          <p className="text-[12px] t font-inter mt-6">No credit card required · 2-minute setup · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cloud-ink border-t border-white/5 py-8 px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-electric-violet rounded-lg flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="font-montserrat font-bold text-[15px] ">Orion</span>
        </div>
        <div className="flex items-center gap-6">
          {['Privacy', 'Terms', 'Blog', 'Contact'].map(item => (
            <a key={item} href="#" className="text-[12px]  font-inter hover:text-white/70 transition-all">{item}</a>
          ))}
        </div>
        <p className="text-[12px]  font-inter">© 2026 Orion AI. Built for local businesses.</p>
      </footer>
    </div>
  );
}