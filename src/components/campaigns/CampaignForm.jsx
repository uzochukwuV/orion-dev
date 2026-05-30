import { useState } from 'react';
import { X } from 'lucide-react';
import { entities } from '@/api/entities';
import { useAuth } from '@/lib/useOrionAuth';
import { motion } from 'framer-motion';

export default function CampaignForm({ onClose, onCreated }) {
  const { business } = useAuth();
  const [form, setForm] = useState({ name: '', type: 'email', objective: '', headline: '', body_copy: '', cta: '', budget: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const created = await entities.Campaign.create({ ...form, business_id: business?.id, status: 'draft', budget: Number(form.budget) || 0 });
    onCreated(created);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-midnight-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-paper-white rounded-2xl w-full max-w-lg border border-ghost-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ghost-border">
          <p className="font-montserrat font-medium text-[18px] text-midnight-ink">New Campaign</p>
          <button onClick={onClose} className="w-8 h-8 bg-cloud-canvas rounded-full flex items-center justify-center"><X className="w-4 h-4 text-muted-ash" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">Campaign Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Summer Hair Special" className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink focus:outline-none focus:border-electric-violet transition-all">
                {['email','sms','google_ads','facebook_ads','instagram','promotion'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">Budget ($)</label>
              <input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} placeholder="500" className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink focus:outline-none focus:border-electric-violet transition-all" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">Headline</label>
            <input value={form.headline} onChange={e => setForm({...form, headline: e.target.value})} placeholder="Compelling headline…" className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all" />
          </div>
          <div>
            <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">Body Copy</label>
            <textarea rows={3} value={form.body_copy} onChange={e => setForm({...form, body_copy: e.target.value})} placeholder="Campaign message…" className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-ghost-border flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-cloud-canvas border border-ghost-border text-midnight-ink rounded-full text-[13px] font-inter font-medium hover:border-midnight-ink transition-all">Cancel</button>
          <button onClick={save} disabled={!form.name || saving} className="px-5 py-2.5 bg-electric-violet text-white rounded-full text-[13px] font-inter font-medium hover:opacity-90 disabled:opacity-50 transition-all">
            {saving ? 'Saving…' : 'Create Campaign'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}