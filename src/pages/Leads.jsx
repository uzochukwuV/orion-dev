import { useState, useEffect } from 'react';
import { entities, apiPost } from '@/api/entities';
import { useAuth } from '@/lib/useOrionAuth';
import { Plus, Users, Loader2, Sparkles } from 'lucide-react';
import LeadForm from '../components/leads/LeadForm';

const statusColors = {
  new: 'text-electric-violet bg-electric-violet/10',
  contacted: 'text-blue-600 bg-blue-50',
  qualified: 'text-green-600 bg-green-50',
  proposal_sent: 'text-amber-600 bg-amber-50',
  won: 'text-green-700 bg-green-100',
  lost: 'text-red-500 bg-red-50',
};

const stages = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];

export default function Leads() {
  const { business } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [followingUp, setFollowingUp] = useState(null);
  const [view, setView] = useState('list');

  const load = async () => {
    const data = await entities.Lead.list('-created_at', 50);
    setLeads(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const sendAIFollowup = async (lead) => {
    if (!business?.id) {
      console.error('No business ID available');
      return;
    }
    
    setFollowingUp(lead.id);
    try {
      const res = await apiPost('/api/agents/chat', {
        message: `Write a brief, warm, personalized follow-up message for ${business.name || 'our business'} to send to ${lead.name} who is interested in ${lead.service_interest || 'our services'}. Keep it under 3 sentences, professional but friendly, with a clear call to action.`,
        business_id: business.id,
      });
      
      await entities.Lead.update(lead.id, { 
        ai_followup_sent: true, 
        status: 'contacted', 
        last_contacted: new Date().toISOString(), 
        notes: (lead.notes || '') + `\n\n[AI Follow-up]: ${res.reply}` 
      });
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ai_followup_sent: true, status: 'contacted' } : l));
      alert(`Follow-up message drafted:\n\n"${res.reply}"`);
    } catch (error) {
      console.error('Failed to send AI followup:', error);
      alert('Failed to generate follow-up message');
    }
    setFollowingUp(null);
  };

  const updateStatus = async (lead, status) => {
    await entities.Lead.update(lead.id, { status });
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status } : l));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-full text-[12px] font-inter font-medium transition-all ${view === 'list' ? 'bg-midnight-ink text-white' : 'bg-paper-white border border-ghost-border text-muted-ash'}`}>List</button>
          <button onClick={() => setView('pipeline')} className={`px-3 py-1.5 rounded-full text-[12px] font-inter font-medium transition-all ${view === 'pipeline' ? 'bg-midnight-ink text-white' : 'bg-paper-white border border-ghost-border text-muted-ash'}`}>Pipeline</button>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-electric-violet text-white rounded-full text-[13px] font-inter font-medium hover:opacity-90 transition-all">
          <Plus className="w-3.5 h-3.5" /> Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map(s => (
          <div key={s} className="card-elevated text-center">
            <p className="font-montserrat font-medium text-[20px] text-midnight-ink">{leads.filter(l => l.status === s).length}</p>
            <p className={`text-[10px] font-inter font-medium mt-1 capitalize px-2 py-0.5 rounded-full inline-block ${statusColors[s]}`}>{s.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-electric-violet animate-spin" /></div>
      ) : view === 'pipeline' ? (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map(stage => (
            <div key={stage} className="space-y-2">
              <p className={`text-[11px] font-inter font-medium capitalize px-2 py-1 rounded-full text-center ${statusColors[stage]}`}>{stage.replace('_', ' ')}</p>
              {leads.filter(l => l.status === stage).map(lead => (
                <div key={lead.id} onClick={() => setSelectedLead(lead)} className="card-elevated cursor-pointer hover:border-electric-violet border border-ghost-border transition-all p-3">
                  <p className="text-[12px] font-inter font-medium text-midnight-ink truncate">{lead.name}</p>
                  {lead.service_interest && <p className="text-[10px] text-muted-ash truncate mt-0.5">{lead.service_interest}</p>}
                  {lead.ai_score && <p className="text-[10px] text-electric-violet font-medium mt-1">{lead.ai_score}% match</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="card-elevated p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ghost-border">
                {['Name', 'Service Interest', 'Source', 'AI Score', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-inter font-medium text-muted-ash">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr key={lead.id || i} className="border-b border-ghost-border last:border-0 hover:bg-cloud-canvas/50 transition-all">
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-inter font-medium text-midnight-ink">{lead.name}</p>
                    {lead.email && <p className="text-[11px] text-muted-ash">{lead.email}</p>}
                  </td>
                  <td className="px-5 py-3.5"><p className="text-[12px] font-inter text-muted-ash">{lead.service_interest || '—'}</p></td>
                  <td className="px-5 py-3.5"><p className="text-[12px] font-inter text-muted-ash capitalize">{lead.source?.replace('_', ' ') || '—'}</p></td>
                  <td className="px-5 py-3.5">
                    {lead.ai_score ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-cloud-canvas rounded-full max-w-[60px]">
                          <div className="h-1 bg-electric-violet rounded-full" style={{width: `${lead.ai_score}%`}} />
                        </div>
                        <span className="text-[11px] font-medium text-midnight-ink">{lead.ai_score}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <select value={lead.status} onChange={e => updateStatus(lead, e.target.value)} className={`text-[11px] font-medium px-2 py-1 rounded-full border-0 outline-none capitalize cursor-pointer ${statusColors[lead.status]}`}>
                      {stages.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => sendAIFollowup(lead)} disabled={followingUp === lead.id || lead.ai_followup_sent}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-electric-violet/10 text-electric-violet rounded-full text-[11px] font-medium hover:bg-electric-violet hover:text-white transition-all disabled:opacity-40">
                      {followingUp === lead.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {lead.ai_followup_sent ? 'Sent' : 'AI Follow-up'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-8 h-8 text-electric-violet mx-auto mb-3" />
              <p className="font-montserrat font-medium text-[16px] text-midnight-ink">No leads yet</p>
              <p className="text-[13px] text-muted-ash font-inter mt-1">Add your first lead or connect a lead source.</p>
            </div>
          )}
        </div>
      )}

      {showForm && <LeadForm onClose={() => setShowForm(false)} onCreated={(l) => { setLeads(prev => [l, ...prev]); setShowForm(false); }} />}
    </div>
  );
}
