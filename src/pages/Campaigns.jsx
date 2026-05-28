import { useState, useEffect } from 'react';
import { entities, apiPost } from '@/api/entities';
import { Plus, Megaphone, Loader2, Eye, Pause, Play, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CampaignForm from '../components/campaigns/CampaignForm';

const statusColors = {
  draft: 'text-muted-ash bg-cloud-canvas border-ghost-border',
  pending_review: 'text-amber-600 bg-amber-50 border-amber-100',
  active: 'text-green-600 bg-green-50 border-green-100',
  paused: 'text-blue-500 bg-blue-50 border-blue-100',
  completed: 'text-midnight-ink bg-cloud-canvas border-ghost-border',
  cancelled: 'text-red-500 bg-red-50 border-red-100',
};

const typeColors = {
  email: 'bg-blue-50 text-blue-600',
  sms: 'bg-green-50 text-green-600',
  google_ads: 'bg-yellow-50 text-yellow-700',
  facebook_ads: 'bg-indigo-50 text-indigo-600',
  instagram: 'bg-pink-50 text-pink-600',
  promotion: 'bg-electric-violet/10 text-electric-violet',
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    const data = await entities.Campaign.list('-created_at', 20);
    setCampaigns(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateCampaign = async () => {
    setGenerating(true);
    try {
      const res = await apiPost('/api/agents/run', {
        task: 'Generate a high-converting marketing campaign for a local hair salon targeting women 25-45 in the area. Create a specific, actionable campaign with compelling copy.',
        business_id: 'demo',
        skip_confirmation: true,
      });
      
      // Extract campaign data from response (format varies based on agent output)
      const campaignData = {
        business_id: 'demo',
        name: res?.final_summary?.substring(0, 100) || 'AI Generated Campaign',
        type: 'email',
        status: 'pending_review',
        ai_generated: true,
        objective: res?.final_summary || 'AI generated campaign',
      };
      
      const created = await entities.Campaign.create(campaignData);
      setCampaigns(prev => [created, ...prev]);
    } catch (error) {
      console.error('Failed to generate campaign:', error);
      alert('Failed to generate campaign');
    }
    setGenerating(false);
  };

  const toggleStatus = async (campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    await entities.Campaign.update(campaign.id || campaign._id, { status: newStatus });
    setCampaigns(prev => prev.map(c => (c.id === campaign.id || c._id === campaign._id) ? { ...c, status: newStatus } : c));
  };

  const approve = async (campaign) => {
    await entities.Campaign.update(campaign.id || campaign._id, { status: 'active' });
    setCampaigns(prev => prev.map(c => (c.id === campaign.id || c._id === campaign._id) ? { ...c, status: 'active' } : c));
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button onClick={generateCampaign} disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 bg-electric-violet text-white rounded-full text-[13px] font-inter font-medium hover:opacity-90 disabled:opacity-50 transition-all">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? 'Generating…' : 'AI Generate Campaign'}
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-midnight-ink text-white rounded-full text-[13px] font-inter font-medium hover:opacity-85 transition-all">
            <Plus className="w-3.5 h-3.5" />
            Create Manual
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: campaigns.filter(c => c.status === 'active').length },
          { label: 'Pending Review', value: campaigns.filter(c => c.status === 'pending_review').length },
          { label: 'Total Clicks', value: campaigns.reduce((s, c) => s + (c.clicks || 0), 0) },
          { label: 'Revenue Attributed', value: `$${campaigns.reduce((s, c) => s + (c.revenue_attributed || 0), 0).toLocaleString()}` },
        ].map((s, i) => (
          <div key={i} className="card-elevated">
            <p className="text-[12px] font-inter text-muted-ash">{s.label}</p>
            <p className="font-montserrat font-medium text-[24px] text-midnight-ink mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-electric-violet animate-spin" /></div>
      ) : campaigns.length === 0 ? (
        <div className="card-elevated text-center py-16">
          <Megaphone className="w-8 h-8 text-electric-violet mx-auto mb-3" />
          <p className="font-montserrat font-medium text-[16px] text-midnight-ink">No campaigns yet</p>
          <p className="text-[13px] text-muted-ash font-inter mt-1">Generate your first AI campaign or create one manually.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign, i) => (
            <motion.div key={campaign.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-elevated">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusColors[campaign.status]}`}>{campaign.status?.replace('_', ' ')}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${typeColors[campaign.type] || 'bg-cloud-canvas text-muted-ash'}`}>{campaign.type?.replace('_', ' ')}</span>
                    {campaign.ai_generated && <span className="text-[10px] text-electric-violet font-medium flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" />AI Generated</span>}
                  </div>
                  <p className="font-inter font-medium text-[14px] text-midnight-ink">{campaign.name}</p>
                  {campaign.headline && <p className="text-[12px] text-muted-ash font-inter mt-1">"{campaign.headline}"</p>}
                  <div className="flex gap-4 mt-3">
                    {campaign.impressions > 0 && <span className="text-[11px] text-muted-ash font-inter"><span className="text-midnight-ink font-medium">{campaign.impressions.toLocaleString()}</span> impressions</span>}
                    {campaign.clicks > 0 && <span className="text-[11px] text-muted-ash font-inter"><span className="text-midnight-ink font-medium">{campaign.clicks}</span> clicks</span>}
                    {campaign.budget && <span className="text-[11px] text-muted-ash font-inter">Budget: <span className="text-midnight-ink font-medium">${campaign.budget}</span></span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {campaign.status === 'pending_review' && (
                    <button onClick={() => approve(campaign)} className="px-3 py-1.5 bg-electric-violet text-white rounded-full text-[11px] font-medium hover:opacity-90 transition-all">Approve & Launch</button>
                  )}
                  {(campaign.status === 'active' || campaign.status === 'paused') && (
                    <button onClick={() => toggleStatus(campaign)} className="w-8 h-8 bg-cloud-canvas border border-ghost-border rounded-full flex items-center justify-center hover:border-midnight-ink transition-all">
                      {campaign.status === 'active' ? <Pause className="w-3.5 h-3.5 text-muted-ash" /> : <Play className="w-3.5 h-3.5 text-muted-ash" />}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showForm && <CampaignForm onClose={() => setShowForm(false)} onCreated={(c) => { setCampaigns(prev => [c, ...prev]); setShowForm(false); }} />}
    </div>
  );
}