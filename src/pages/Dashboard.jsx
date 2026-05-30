import { useState, useEffect } from 'react';
import { entities, getDashboardStats } from '@/api/entities';
import { TrendingUp, Users, Megaphone, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// Generate chart data from campaign revenue over time
function generateRevenueData(campaigns) {
  // Create 8 weeks of data
  const data = [];
  const now = new Date();
  let total = 0;
  
  for (let i = 7; i >= 0; i--) {
    const weekDate = new Date(now);
    weekDate.setDate(weekDate.getDate() - (i * 7));
    const weekLabel = `W${8 - i}`;
    
    // Add some revenue from campaigns for this week (simulate growth)
    const weeklyRevenue = campaigns.reduce((sum, c) => {
      if (c.revenue_attributed) {
        return sum + (c.revenue_attributed / 8);
      }
      return sum;
    }, 0);
    
    total += weeklyRevenue;
    data.push({ week: weekLabel, revenue: Math.round(total) });
  }
  
  return data;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      entities.Opportunity.list('-createdAt', 5),
      entities.Lead.list('-createdAt', 5),
    ]).then(([statsData, opps, l]) => {
      setStats(statsData);
      setOpportunities(opps);
      setLeads(l);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load dashboard:', err);
      setLoading(false);
    });
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card-elevated animate-pulse">
              <div className="h-4 bg-cloud-canvas rounded w-24 mb-4" />
              <div className="h-8 bg-cloud-canvas rounded w-16" />
            </div>
          ))}
        </div>
        <div className="card-elevated animate-pulse">
          <div className="h-64 bg-cloud-canvas rounded" />
        </div>
      </div>
    );
  }

  const revenueData = generateRevenueData([]);
  
  const dashboardStats = [
    { label: 'Revenue This Month', value: `$${stats.campaigns.revenue.toLocaleString()}`, change: `${stats.campaigns.active} active campaigns`, icon: TrendingUp, color: 'text-electric-violet' },
    { label: 'Active Leads', value: stats.leads.active, change: `${stats.leads.won} won`, icon: Users, color: 'text-midnight-ink' },
    { label: 'Campaigns Running', value: stats.campaigns.total, change: `${stats.campaigns.pending} pending review`, icon: Megaphone, color: 'text-midnight-ink' },
    { label: 'Opportunities Found', value: stats.opportunities.new, change: 'New this week', icon: Zap, color: 'text-electric-violet' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {dashboardStats.map((s, i) => (
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
              <p className="text-[12px] text-muted-ash font-inter mt-0.5">Total attributed revenue</p>
            </div>
            <span className="text-[12px] bg-electric-violet/10 text-electric-violet px-3 py-1 rounded-full font-inter font-medium">${stats.campaigns.revenue.toLocaleString()} total</span>
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
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #f7f5fd', borderRadius: 8, fontSize: 12, fontFamily: 'Inter' }} formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#5757f8" strokeWidth={2} fill="url(#rv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated">
          <p className="font-montserrat font-medium text-[15px] text-midnight-ink mb-4">Agent Activity</p>
          <div className="space-y-3">
            {stats.agentRuns && stats.agentRuns.length > 0 ? stats.agentRuns.map((run, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${run.status === 'completed' ? 'bg-green-500' : run.status === 'running' ? 'bg-electric-violet animate-pulse' : 'bg-red-400'}`} />
                <div>
                  <p className="text-[12px] font-inter font-medium text-midnight-ink capitalize">{run.agent_type?.replace('_', ' ')}</p>
                  <p className="text-[11px] text-muted-ash font-inter">{run.output_summary || 'Completed'}</p>
                </div>
              </div>
            )) : (
              <p className="text-[12px] text-muted-ash">No agent runs yet. Run an agent to see activity.</p>
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
              <p className="text-[13px] text-muted-ash text-center py-8">No opportunities yet. Run an intelligence scan.</p>
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
              <p className="text-[13px] text-muted-ash text-center py-8">No leads yet. Add your first lead.</p>
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
        <p className="text-[11px] text-muted-ash font-inter">{lead.service_interest || 'General inquiry'}</p>
      </div>
      <div className="flex items-center gap-2">
        {lead.ai_score && <span className="text-[11px] font-medium text-muted-ash">{lead.ai_score}%</span>}
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColor[lead.status] || 'text-muted-ash bg-cloud-canvas'}`}>{lead.status}</span>
      </div>
    </div>
  );
}