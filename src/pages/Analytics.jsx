import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 18200, target: 20000 },
  { month: 'Feb', revenue: 22400, target: 20000 },
  { month: 'Mar', revenue: 19800, target: 22000 },
  { month: 'Apr', revenue: 26100, target: 22000 },
  { month: 'May', revenue: 24300, target: 25000 },
  { month: 'Jun', revenue: 31200, target: 25000 },
];

const channelData = [
  { name: 'Google Ads', value: 35 },
  { name: 'Social Media', value: 28 },
  { name: 'Referral', value: 22 },
  { name: 'Walk-in', value: 15 },
];

const COLORS = ['#5757f8', '#202020', '#8888ff', '#aaaacc'];

export default function Analytics() {
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list('-created_date', 100),
      base44.entities.Campaign.list('-created_date', 20),
    ]).then(([l, c]) => { setLeads(l); setCampaigns(c); });
  }, []);

  const wonLeads = leads.filter(l => l.status === 'won').length;
  const convRate = leads.length ? Math.round((wonLeads / leads.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Monthly Revenue', value: '$31,200', change: '+28% vs last month' },
          { label: 'Lead Conversion', value: `${convRate}%`, change: `${wonLeads} won of ${leads.length}` },
          { label: 'Campaign ROI', value: '4.2x', change: 'Avg across all channels' },
          { label: 'Customer LTV', value: '$840', change: '+$120 this quarter' },
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
          <p className="font-montserrat font-medium text-[16px] text-midnight-ink">Revenue vs Target</p>
          <span className="text-[12px] text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">Tracking ahead</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueData} barGap={4}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#333333', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #f7f5fd', borderRadius: 8, fontSize: 12, fontFamily: 'Inter' }} formatter={(v) => [`$${v.toLocaleString()}`, '']} />
            <Bar dataKey="target" fill="#f5f5f5" radius={[4,4,0,0]} name="Target" />
            <Bar dataKey="revenue" fill="#5757f8" radius={[4,4,0,0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lead sources + Campaign performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-elevated">
          <p className="font-montserrat font-medium text-[15px] text-midnight-ink mb-5">Lead Sources</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={channelData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                  {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {channelData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-[12px] font-inter text-muted-ash">{item.name}</span>
                  </div>
                  <span className="text-[12px] font-inter font-medium text-midnight-ink">{item.value}%</span>
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
                  <p className="text-[12px] font-inter font-medium text-midnight-ink truncate">{c.name}</p>
                  <div className="h-1 bg-cloud-canvas rounded-full mt-1.5">
                    <div className="h-1 bg-electric-violet rounded-full" style={{ width: `${Math.min(((c.conversions || 0) / 10) * 100, 100)}%` }} />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-muted-ash flex-shrink-0">{c.conversions || 0} conv.</span>
              </div>
            )) : (
              [{ name: 'Summer Haircut Promo', pct: 78 }, { name: 'Color Treatment Email', pct: 62 }, { name: 'Google Ads — Salon', pct: 88 }].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-inter font-medium text-midnight-ink">{item.name}</p>
                    <div className="h-1 bg-cloud-canvas rounded-full mt-1.5"><div className="h-1 bg-electric-violet rounded-full" style={{ width: `${item.pct}%` }} /></div>
                  </div>
                  <span className="text-[11px] font-medium text-muted-ash">{item.pct}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}