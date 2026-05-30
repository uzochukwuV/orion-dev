import { useState, useEffect } from 'react';
import { entities, getDashboardStats } from '@/api/entities';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      entities.Campaign.list('-createdAt', 20),
    ]).then(([statsData, c]) => {
      setStats(statsData);
      setCampaigns(c);
    });
  }, []);

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card-elevated animate-pulse">
              <div className="h-4 bg-cloud-canvas rounded w-24 mb-4" />
              <div className="h-8 bg-cloud-canvas rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const wonLeads = stats.leads.won;
  const convRate = stats.leads.total > 0 ? Math.round((wonLeads / stats.leads.total) * 100) : 0;
  
  // Calculate ROI from campaigns
  const totalClicks = stats.campaigns.clicks || 0;
  const totalRevenue = stats.campaigns.revenue || 0;
  const roi = totalClicks > 0 ? (totalRevenue / totalClicks).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Monthly Revenue', value: `$${totalRevenue.toLocaleString()}`, change: 'From campaigns' },
          { label: 'Lead Conversion', value: `${convRate}%`, change: `${wonLeads} won of ${stats.leads.total}` },
          { label: 'Campaign ROI', value: `${roi}x`, change: 'Avg per click' },
          { label: 'Total Leads', value: stats.leads.total.toString(), change: `${stats.leads.active} active` },
        ].map((kpi, i) => (
          <div key={i} className="card-elevated">
            <p className="text-[12px] font-inter text-muted-ash">{kpi.label}</p>
            <p className="font-montserrat font-medium text-[28px] text-midnight-ink mt-2 tracking-[-0.02em]">{kpi.value}</p>
            <p className="text-[11px] text-muted-ash font-inter mt-1">{kpi.change}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card-elevated">
        <div className="flex items-center justify-between mb-6">
          <p className="font-montserrat font-medium text-[16px] text-midnight-ink">Campaign Revenue</p>
          <span className="text-[12px] text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">${totalRevenue.toLocaleString()} total</span>
        </div>
        <div className="h-48">
          {campaigns.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaigns.slice(0, 6).map(c => ({ name: c.name?.substring(0, 20) || 'Campaign', revenue: c.revenue_attributed || 0 }))}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#333333', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#333333', fontFamily: 'Inter' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ background: '#fff', border: '1px solid #f7f5fd', borderRadius: 8, fontSize: 12, fontFamily: 'Inter' }} />
                <Bar dataKey="revenue" fill="#5757f8" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-ash">No campaign data yet</div>
          )}
        </div>
      </div>

      {/* Lead sources + Campaign performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-elevated">
          <p className="font-montserrat font-medium text-[15px] text-midnight-ink mb-5">Lead Status</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Won', value: wonLeads },
                    { name: 'Active', value: stats.leads.active },
                    { name: 'Other', value: stats.leads.total - wonLeads - stats.leads.active },
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {['#5757f8', '#202020', '#aaaacc'].map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {[
                { name: 'Won', value: wonLeads, color: '#5757f8' },
                { name: 'Active', value: stats.leads.active, color: '#202020' },
                { name: 'Other', value: stats.leads.total - wonLeads - stats.leads.active, color: '#aaaacc' },
              ].filter(d => d.value > 0).map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-[12px] font-inter text-muted-ash">{item.name}</span>
                  </div>
                  <span className="text-[12px] font-inter font-medium text-midnight-ink">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-elevated">
          <p className="font-montserrat font-medium text-[15px] text-midnight-ink mb-4">Campaign Performance</p>
          <div className="space-y-3">
            {campaigns.length > 0 ? campaigns.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-inter font-medium text-midnight-ink truncate">{c.name || 'Campaign'}</p>
                  <div className="h-1 bg-cloud-canvas rounded-full mt-1.5">
                    <div className="h-1 bg-electric-violet rounded-full" style={{ width: `${Math.min(((c.revenue_attributed || 0) / 1000) * 100, 100)}%` }} />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-muted-ash flex-shrink-0">${(c.revenue_attributed || 0).toLocaleString()}</span>
              </div>
            )) : (
              <p className="text-[12px] text-muted-ash text-center py-8">No campaigns yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}