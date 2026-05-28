    import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function LeadForm({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: 'website_form', service_interest: '', value_estimate: '' });
  const [scoring, setScoring] = useState(false);
  const [saving, setSaving] = useState(false);

  const scoreWithAI = async () => {
    if (!form.name || !form.service_interest) return;
    setScoring(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Score this lead for a hair salon business on a scale of 0-100 based on their interest and information.
Name: ${form.name}, Service Interest: ${form.service_interest}, Source: ${form.source}
Return only a JSON object with: score (number 0-100) and reason (string, 1 sentence)`,
      response_json_schema: { type: 'object', properties: { score: { type: 'number' }, reason: { type: 'string' } } }
    });
    if (res?.score) setForm(prev => ({ ...prev, ai_score: res.score }));
    setScoring(false);
  };

  const save = async () => {
    setSaving(true);
    const created = await base44.entities.Lead.create({ ...form, business_id: 'demo', value_estimate: Number(form.value_estimate) || 0 });
    onCreated(created);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-midnight-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-paper-white rounded-2xl w-full max-w-lg border border-ghost-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ghost-border">
          <p className="font-montserrat font-medium text-[18px] text-midnight-ink">Add Lead</p>
          <button onClick={onClose} className="w-8 h-8 bg-cloud-canvas rounded-full flex items-center justify-center"><X className="w-4 h-4 text-muted-ash" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jane Smith" className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all" />
            </div>
            <div>
              <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">Phone</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 555 000 0000" className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">Email</label>
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jane@example.com" className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">Source</label>
              <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink focus:outline-none focus:border-electric-violet transition-all">
                {['website_form','phone_call','social_dm','referral','google','facebook','walk_in','other'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">Service Interest</label>
              <input value={form.service_interest} onChange={e => setForm({...form, service_interest: e.target.value})} placeholder="Haircut, Color, etc." className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all" />
            </div>
          </div>
          <button onClick={scoreWithAI} disabled={scoring || !form.name} className="flex items-center gap-2 text-[12px] text-electric-violet font-inter font-medium hover:opacity-80 transition-all disabled:opacity-40">
            {scoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {scoring ? 'Scoring…' : 'AI Score Lead'}
            {form.ai_score && <span className="text-midnight-ink font-medium">{form.ai_score}/100</span>}
          </button>
        </div>
        <div className="px-6 py-4 border-t border-ghost-border flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-cloud-canvas border border-ghost-border text-midnight-ink rounded-full text-[13px] font-inter font-medium hover:border-midnight-ink transition-all">Cancel</button>
          <button onClick={save} disabled={!form.name || saving} className="px-5 py-2.5 bg-electric-violet text-white rounded-full text-[13px] font-inter font-medium hover:opacity-90 disabled:opacity-50 transition-all">
            {saving ? 'Saving…' : 'Add Lead'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}