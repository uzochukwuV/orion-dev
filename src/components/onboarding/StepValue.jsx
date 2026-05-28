import { useState } from 'react';
import { TrendingUp, Megaphone, Users, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const actions = [
  { id: 'scan', icon: TrendingUp, title: 'Run my first market scan', desc: 'See what competitors are doing and where the opportunities are — right now.', cta: 'Scan market' },
  { id: 'campaign', icon: Megaphone, title: 'Generate my first campaign', desc: 'AI creates a ready-to-launch marketing campaign tailored to your business.', cta: 'Create campaign' },
  { id: 'leads', icon: Users, title: 'Set up my lead pipeline', desc: 'Add your first lead and watch Orion score and follow up automatically.', cta: 'Add first lead' },
];

export default function StepValue({ onNext, data }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [done, setDone] = useState(false);

  const runAction = async () => {
    if (!selected) return;
    setLoading(true);
    if (selected === 'scan') {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Run a quick market intelligence scan for ${data.businessName || 'a local service business'} (${data.category || 'service business'}) in ${data.location || 'their city'}. List 3 specific, actionable market opportunities they should act on this week. Be direct and specific.`,
        add_context_from_internet: true,
      });
      setResult(res);
    } else if (selected === 'campaign') {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a short, punchy marketing campaign for ${data.businessName || 'a local business'} offering ${data.service || 'local services'} in ${data.location || 'their city'}. Give me a headline, 2-sentence body copy, and a call to action. Make it ready to use.`,
      });
      setResult(res);
    } else {
      setResult(`Your lead pipeline is ready. Any customer inquiry — call, DM, walk-in — can be added here. Orion will score it automatically and remind you to follow up at the right time.`);
    }
    setDone(true);
    setLoading(false);
  };

  return (
    <div className="card-elevated border border-ghost-border p-8">
      <div className="w-12 h-12 bg-electric-violet/10 rounded-xl flex items-center justify-center mb-5">
        <Sparkles className="w-6 h-6 text-electric-violet" />
      </div>

      <h1 className="font-montserrat font-medium text-[24px] text-midnight-ink tracking-[-0.02em] mb-1">
        {data.businessName ? `${data.businessName} is set up!` : "You're all set!"}
      </h1>
      <p className="text-[13px] text-muted-ash font-inter mb-6">Try your first action — see Orion work in under 30 seconds.</p>

      {!done ? (
        <>
          <div className="space-y-2 mb-5">
            {actions.map(action => (
              <button key={action.id} onClick={() => setSelected(action.id)}
                className={`w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${selected === action.id ? 'bg-electric-violet/5 border-electric-violet' : 'bg-cloud-canvas border-ghost-border hover:border-midnight-ink'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${selected === action.id ? 'bg-electric-violet' : 'bg-paper-white border border-ghost-border'}`}>
                  <action.icon className={`w-4 h-4 ${selected === action.id ? 'text-white' : 'text-muted-ash'}`} />
                </div>
                <div>
                  <p className="text-[13px] font-inter font-medium text-midnight-ink">{action.title}</p>
                  <p className="text-[11px] text-muted-ash font-inter mt-0.5">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={runAction} disabled={!selected || loading}
            className="w-full py-3 bg-electric-violet rounded-full text-[13px] font-inter font-medium text-white hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? 'Running…' : (selected ? actions.find(a => a.id === selected)?.cta : 'Choose an action')}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-cloud-canvas border border-ghost-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-[12px] text-green-600 font-inter font-medium">First action complete</span>
            </div>
            <p className="text-[13px] text-muted-ash font-inter leading-relaxed">{result}</p>
          </div>
          <button onClick={onNext}
            className="w-full py-3 bg-electric-violet rounded-full text-[13px] font-inter font-medium text-white hover:opacity-90 transition-all flex items-center justify-center gap-2">
            Go to my dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <p className="text-center text-[11px] text-muted-ash font-inter">Integrations, team, and payments can be added later from Settings.</p>
        </div>
      )}
    </div>
  );
}