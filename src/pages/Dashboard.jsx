import { useState, useEffect } from 'react';
import { entities } from '@/api/entities';
import { TrendingUp, Users, Megaphone, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const revenueData = [
  { week: 'W1', revenue: 4200 }, { week: 'W2', revenue: 5100 }, { week: 'W3', revenue: 4800 },
  { week: 'W4', revenue: 6200 }, { week: 'W5', revenue: 5900 }, { week: 'W6', revenue: 7400 },
  { week: 'W7', revenue: 8100 }, { week: 'W8', revenue: 7800 },
];

export default function Dashboard() {
  const [opportunities, setOpportunities] = useState([]);
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [agentRuns, setAgentRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      entities.Opportunity.list('-created_at', 5),
      entities.Lead.list('-created_at', 5),
      entities.Campaign.list('-created_at', 5),
      entities.AgentRun.list('-created_at', 5),
    ]).then(([opps, l, c, runs]) => {
      setOpportunities(opps);
      setLeads(l);
      setCampaigns(c);
      setAgentRuns(runs);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load dashboard:', err);
      setLoading(false);
    });
  }, []);

  const stats = [
    { label: 'Revenue This Month', value: '$8,140', change: '+23%', icon: TrendingUp, color: 'text-electric-violet' },
    { label: 'Active Leads', value: leads.filter(l => ['new','contacted','qualified'].includes(l.status)).length || '12', change: '+5 this week', icon: Users, color: 'text-midnight-ink' },
    { label: 'Campaigns Running', value: campaigns.filter(c => c.status === 'active').length || '3', change: '2 pending review', icon: Megaphone, color: 'text-midnight-ink' },
    { label: 'Opportunities Found', value: opportunities.filter(o => o.status === 'new').length || '7', change: 'New this week', icon: Zap, color: 'text-electric-violet' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, i) => (
          <div key={i} className="card-elevated">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[13px] font-inter font-medium text-muted-ash">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="font-montserrat font-medium text-[28px] text-midnight-ink tracking-[-0.02em]">{s.value}</p>
            <p className="text-[12px] font-inter text-muted-ash mt-1">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart + Agent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-elevated">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-montserrat font-medium text-[16px] text-midnight-ink">Revenue Trend</p>
              <p className="text-[12px] text-muted-ash font-inter mt-0.5">Past 8 weeks</p>
            </div>
            <span className="text-[12px] bg-electric-violet/10 text-electric-violet px-3 py-1 rounded-full font-inter font-medium">+23% growth</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5757f8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#5757f8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#333333', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #f7f5fd', borderRadius: 8, fontSize: 12, fontFamily: 'Inter' }} />
              <Area type="monotone" dataKey="revenue" stroke="#5757f8" strokeWidth={2} fill="url(#rv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated">
          <p className="font-montserrat font-medium text-[15px] text-midnight-ink mb-4">Agent Activity</p>
          <div className="space-y-3">
            {agentRuns.length > 0 ? agentRuns.map((run, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${run.status === 'completed' ? 'bg-green-500' : run.status === 'running' ? 'bg-electric-violet' : 'bg-red-400'}`} />
                <div>
                  <p className="text-[12px] font-inter font-medium text-midnight-ink capitalize">{run.agent_type?.replace('_', ' ')}</p>
                  <p className="text-[11px] text-muted-ash font-inter">{run.output_summary || 'Completed'}</p>
                </div>
              </div>
            )) : (
              [
                { agent: 'Market Intelligence', status: 'completed', note: 'Found 3 new opportunities' },
                { agent: 'Sales Agent', status: 'completed', note: 'Sent 4 follow-ups' },
                { agent: 'Social Media', status: 'running', note: 'Generating posts…' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.status === 'completed' ? 'bg-green-500' : 'bg-electric-violet animate-pulse'}`} />
                  <div>
                    <p className="text-[12px] font-inter font-medium text-midnight-ink">{item.agent}</p>
                    <p className="text-[11px] text-muted-ash font-inter">{item.note}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Opportunities + Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Opportunities */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-4">
            <p className="font-montserrat font-medium text-[15px] text-midnight-ink">Top Opportunities</p>
            <Link to="/intelligence" className="text-[12px] text-electric-violet font-inter hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {opportunities.length > 0 ? opportunities.slice(0, 3).map((opp, i) => (
              <OpportunityRow key={i} opp={opp} />
            )) : (
              [
                { title: 'Competitor raised prices 15%', category: 'pricing', impact_score: 8, urgency: 'high' },
                { title: '"Hair extensions" trending locally', category: 'trend', impact_score: 7, urgency: 'medium' },
                { title: 'Nearby salon closed — gap in market', category: 'gap', impact_score: 9, urgency: 'high' },
              ].map((opp, i) => <OpportunityRow key={i} opp={opp} />)
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-4">
            <p className="font-montserrat font-medium text-[15px] text-midnight-ink">Recent Leads</p>
            <Link to="/leads" className="text-[12px] text-electric-violet font-inter hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {leads.length > 0 ? leads.slice(0, 3).map((lead, i) => (
              <LeadRow key={i} lead={lead} />
            )) : (
              [
                { name: 'Sarah Johnson', service_interest: 'Haircut & Color', status: 'new', ai_score: 92 },
                { name: 'Mike Torres', service_interest: 'Deep Tissue Massage', status: 'contacted', ai_score: 75 },
                { name: 'Emma Chen', service_interest: 'Highlights', status: 'qualified', ai_score: 88 },
              ].map((lead, i) => <LeadRow key={i} lead={lead} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OpportunityRow({ opp }) {
  const urgencyColor = { high: 'text-red-500 bg-red-50', medium: 'text-amber-600 bg-amber-50', low: 'text-green-600 bg-green-50', critical: 'text-red-700 bg-red-100' };
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-ghost-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-inter font-medium text-midnight-ink truncate">{opp.title}</p>
        <p className="text-[11px] text-muted-ash font-inter capitalize mt-0.5">{opp.category?.replace('_', ' ')}</p>
      </div>
      <div className="flex items-center gap-2 ml-3">
        {opp.impact_score && <span className="text-[11px] font-medium text-electric-violet">{opp.impact_score}/10</span>}
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${urgencyColor[opp.urgency] || 'text-muted-ash bg-cloud-canvas'}`}>{opp.urgency}</span>
      </div>
    </div>
  );
}

function LeadRow({ lead }) {
  const statusColor = { new: 'text-electric-violet bg-electric-violet/10', contacted: 'text-blue-600 bg-blue-50', qualified: 'text-green-600 bg-green-50', won: 'text-green-700 bg-green-100', lost: 'text-red-500 bg-red-50' };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-ghost-border last:border-0">
      <div>
        <p className="text-[13px] font-inter font-medium text-midnight-ink">{lead.name}</p>
        <p className="text-[11px] text-muted-ash font-inter">{lead.service_interest}</p>
      </div>
      <div className="flex items-center gap-2">
        {lead.ai_score && <span className="text-[11px] font-medium text-muted-ash">{lead.ai_score}%</span>}
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColor[lead.status] || 'text-muted-ash bg-cloud-canvas'}`}>{lead.status}</span>
      </div>
    </div>
  );
}