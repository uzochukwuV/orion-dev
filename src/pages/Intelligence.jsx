import { useState, useEffect } from 'react';
import { entities, apiPost } from '@/api/entities';
import { useAuth } from '@/lib/useOrionAuth';
import { Zap, TrendingUp, AlertTriangle, RefreshCw, ArrowRight, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categoryIcons = { pricing: TrendingUp, competitor: AlertTriangle, trend: TrendingUp, review: Search, seasonal: Zap, gap: Zap };
const urgencyColors = {
  critical: 'text-red-700 bg-red-100 border-red-200',
  high: 'text-red-500 bg-red-50 border-red-100',
  medium: 'text-amber-600 bg-amber-50 border-amber-100',
  low: 'text-green-600 bg-green-50 border-green-100',
};

export default function Intelligence() {
  const { business } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadOpportunities = async () => {
    try {
      const data = await entities.Opportunity.list('-createdAt', 20);
      setOpportunities(data);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOpportunities(); }, []);

  const runScan = async () => {
    if (!business?.id) {
      console.error('No business ID available');
      return;
    }
    
    setScanning(true);
    try {
      const res = await apiPost('/api/intelligence/scan', {
        business_id: business.id,
        focus: 'competitor_pricing,trending_services,market_gaps,review_sentiment',
      });

      if (res?.opportunities) {
        for (const opp of res.opportunities) {
          const created = await entities.Opportunity.create({
            ...opp,
            status: 'new'
          });
          setOpportunities(prev => [created, ...prev]);
        }
      }
    } catch (error) {
      console.error('Failed to run intelligence scan:', error);
    }
    setScanning(false);
  };

  const actOnOpportunity = async (opp) => {
    await entities.Opportunity.update(opp.id || opp._id, { status: 'acted_on' });
    setOpportunities(prev => prev.map(o => (o.id === opp.id || o._id === opp._id) ? { ...o, status: 'acted_on' } : o));
  };

  const dismiss = async (opp) => {
    await entities.Opportunity.update(opp.id || opp._id, { status: 'dismissed' });
    setOpportunities(prev => prev.map(o => (o.id === opp.id || o._id === opp._id) ? { ...o, status: 'dismissed' } : o));
  };

  const filtered = filter === 'all' ? opportunities : opportunities.filter(o => o.status === filter || o.category === filter);

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['all', 'new', 'pricing', 'trend', 'competitor', 'gap'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-inter font-medium capitalize transition-all ${filter === f ? 'bg-midnight-ink text-white' : 'bg-paper-white border border-ghost-border text-muted-ash hover:border-midnight-ink'}`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={runScan} disabled={scanning}
          className="flex items-center gap-2 px-5 py-2.5 bg-electric-violet text-white rounded-full text-[13px] font-inter font-medium hover:opacity-90 disabled:opacity-50 transition-all">
          {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {scanning ? 'Scanning web…' : 'Run Intelligence Scan'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'New Opportunities', value: opportunities.filter(o => o.status === 'new').length, color: 'text-electric-violet' },
          { label: 'High Urgency', value: opportunities.filter(o => o.urgency === 'high' || o.urgency === 'critical').length, color: 'text-red-500' },
          { label: 'Acted On', value: opportunities.filter(o => o.status === 'acted_on').length, color: 'text-green-600' },
          { label: 'Avg Impact Score', value: opportunities.length ? (opportunities.reduce((s, o) => s + (o.impact_score || 0), 0) / opportunities.length).toFixed(1) : '—', color: 'text-midnight-ink' },
        ].map((s, i) => (
          <div key={i} className="card-elevated">
            <p className="text-[12px] font-inter text-muted-ash">{s.label}</p>
            <p className={`font-montserrat font-medium text-[26px] mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Opportunities list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-electric-violet animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-elevated text-center py-16">
          <Zap className="w-8 h-8 text-electric-violet mx-auto mb-3" />
          <p className="font-montserrat font-medium text-[16px] text-midnight-ink">No opportunities yet</p>
          <p className="text-[13px] text-muted-ash font-inter mt-1">Run an intelligence scan to discover market opportunities.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((opp, i) => {
              const Icon = categoryIcons[opp.category] || Zap;
              return (
                <motion.div key={opp.id || opp._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-electric-violet/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-electric-violet" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${urgencyColors[opp.urgency] || 'text-muted-ash bg-cloud-canvas border-ghost-border'}`}>{opp.urgency}</span>
                            <span className="text-[10px] font-medium text-muted-ash capitalize">{opp.category?.replace('_', ' ')}</span>
                            {opp.impact_score && <span className="text-[10px] font-medium text-electric-violet">{opp.impact_score}/10 impact</span>}
                          </div>
                          <p className="font-inter font-medium text-[14px] text-midnight-ink">{opp.title}</p>
                          {opp.description && <p className="text-[12px] text-muted-ash font-inter mt-1 leading-relaxed">{opp.description}</p>}
                          {opp.suggested_action && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <ArrowRight className="w-3 h-3 text-electric-violet" />
                              <p className="text-[12px] text-electric-violet font-inter font-medium">{opp.suggested_action}</p>
                            </div>
                          )}
                        </div>
                        {opp.status === 'new' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => actOnOpportunity(opp)} className="px-3 py-1.5 bg-electric-violet text-white rounded-full text-[11px] font-inter font-medium hover:opacity-90 transition-all">Act on this</button>
                            <button onClick={() => dismiss(opp)} className="px-3 py-1.5 bg-cloud-canvas text-muted-ash rounded-full text-[11px] font-inter font-medium hover:border-midnight-ink border border-ghost-border transition-all">Dismiss</button>
                          </div>
                        )}
                        {opp.status === 'acted_on' && <span className="text-[11px] text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium border border-green-100">Acted on</span>}
                        {opp.status === 'dismissed' && <span className="text-[11px] text-muted-ash bg-cloud-canvas px-3 py-1 rounded-full font-medium border border-ghost-border">Dismissed</span>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}