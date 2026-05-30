import { useState, useEffect } from 'react';
import { entities } from '@/api/entities';
import { useAuth } from '@/lib/useOrionAuth';
import { Building2, CreditCard, Users, Link2, CheckCircle2, Loader2 } from 'lucide-react';

const verticals = [
  { value: 'salon', label: 'Salons & Beauty Studios' },
  { value: 'gym', label: 'Gyms & Fitness Studios' },
  { value: 'restaurant', label: 'Restaurants & Cafés' },
  { value: 'clinic', label: 'Dental & Medical Clinics' },
  { value: 'law', label: 'Law Firms (Small)' },
  { value: 'realestate', label: 'Real Estate Agents' },
  { value: 'hotel', label: 'Boutique Hotels & Airbnbs' },
  { value: 'ecommerce', label: 'E-commerce Stores' },
  { value: 'agency', label: 'Freelancers & Creative Agencies' },
  { value: 'autorepair', label: 'Auto Repair Shops' },
  { value: 'plumber', label: 'Plumbers' },
  { value: 'electrician', label: 'Electricians' },
  { value: 'cleaner', label: 'Cleaning Services' },
  { value: 'other', label: 'Other' },
];

const plans = [
  { id: 'starter', label: 'Starter', price: '$49/mo', features: ['1 AI agent workflow', 'Market intelligence (weekly)', 'Basic CRM (25 leads)', 'Email campaigns'] },
  { id: 'growth', label: 'Growth', price: '$149/mo', features: ['All AI agents', 'Daily market scans', 'Unlimited leads', 'All campaign types', 'Social media automation', 'Voice interface'], recommended: true },
  { id: 'pro', label: 'Pro', price: '$349/mo', features: ['Everything in Growth', 'Custom agent workflows', 'Priority AI processing', 'White-label reports', 'API access', 'Dedicated support'] },
];

const integrations = [
  { label: 'Google Business Profile', connected: true, icon: '🔍' },
  { label: 'Facebook & Instagram', connected: false, icon: '📱' },
  { label: 'Google Ads', connected: false, icon: '📢' },
  { label: 'Mailchimp / Email', connected: true, icon: '✉️' },
  { label: 'WhatsApp Business', connected: false, icon: '💬', key: 'whatsapp' },
  { label: 'Stripe Payments', connected: true, icon: '💳' },
];

export default function Settings() {
  const { business: authBusiness } = useAuth();
  const [activeTab, setActiveTab] = useState('business');
  const [currentPlan, setCurrentPlan] = useState('growth');
  const [intStates, setIntStates] = useState(integrations.map(i => i.connected));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use business from auth if available
    if (authBusiness) {
      setBusiness({
        _id: authBusiness.id,
        name: authBusiness.name || '',
        city: authBusiness.city || '',
        phone: authBusiness.phone || '',
        website: authBusiness.website || '',
        description: authBusiness.description || '',
        type: authBusiness.type || 'salon'
      });
      setLoading(false);
    }
  }, [authBusiness]);

  const saveBusiness = async () => {
    if (!business || !business._id) return;
    setSaving(true);
    try {
      await entities.Business.update(business._id, business);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error('Failed to save business:', error);
      alert('Failed to save business profile');
    }
    setSaving(false);
  };

  const tabs = [
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-paper-white border border-ghost-border rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-inter font-medium transition-all ${activeTab === id ? 'bg-midnight-ink text-white' : 'text-muted-ash hover:text-midnight-ink'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Business tab */}
      {activeTab === 'business' && (
        <div className="card-elevated max-w-2xl space-y-5">
          <p className="font-montserrat font-medium text-[16px] text-midnight-ink">Business Profile</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Business Name', key: 'name' },
              { label: 'City', key: 'city' },
              { label: 'Phone', key: 'phone' },
              { label: 'Website', key: 'website' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">{label}</label>
                <input value={business[key] || ''} onChange={e => setBusiness({...business, [key]: e.target.value})}
                  className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink focus:outline-none focus:border-electric-violet transition-all" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">Business Type</label>
            <select 
              value={business.type || 'salon'} 
              onChange={e => setBusiness({...business, type: e.target.value})}
              className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink focus:outline-none focus:border-electric-violet transition-all">
              {verticals.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-muted-ash mt-1">This determines Orion's intelligence focus and campaign strategies</p>
          </div>
          <div>
            <label className="text-[12px] font-inter font-medium text-muted-ash mb-1 block">Description</label>
            <textarea rows={3} value={business.description || ''} onChange={e => setBusiness({...business, description: e.target.value})}
              className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[13px] font-inter text-midnight-ink focus:outline-none focus:border-electric-violet transition-all resize-none" />
          </div>
          <button onClick={saveBusiness} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-electric-violet text-white rounded-full text-[13px] font-inter font-medium hover:opacity-90 transition-all">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Billing tab */}
      {activeTab === 'billing' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {plans.map(plan => (
              <div key={plan.id} onClick={() => setCurrentPlan(plan.id)}
                className={`card-elevated cursor-pointer transition-all ${currentPlan === plan.id ? 'border-2 border-electric-violet' : 'border border-ghost-border hover:border-midnight-ink'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-montserrat font-medium text-[16px] text-midnight-ink">{plan.label}</p>
                  {plan.recommended && <span className="text-[10px] bg-electric-violet text-white px-2 py-0.5 rounded-full font-medium">Popular</span>}
                </div>
                <p className="font-montserrat font-medium text-[24px] text-electric-violet mb-4">{plan.price}</p>
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-[12px] font-inter text-muted-ash">
                      <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {currentPlan === plan.id && (
                  <div className="mt-4 pt-3 border-t border-ghost-border">
                    <span className="text-[12px] text-electric-violet font-medium">✓ Current Plan</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrations tab */}
      {activeTab === 'integrations' && (
        <div className="card-elevated max-w-2xl space-y-3">
          <p className="font-montserrat font-medium text-[16px] text-midnight-ink mb-2">Connected Services</p>
          {integrations.map((int, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-ghost-border last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-[18px]">{int.icon}</span>
                <div>
                  <p className="text-[13px] font-inter font-medium text-midnight-ink">{int.label}</p>
                  {int.key === 'whatsapp' && (
                    <p className="text-[10px] text-muted-ash">Chat with customers, send campaigns</p>
                  )}
                </div>
              </div>
              {int.key === 'whatsapp' ? (
                <button 
                  onClick={() => alert('WhatsApp Setup:\n1. Create Meta Business Account\n2. Set up WhatsApp Business\n3. Get Phone Number ID & Access Token\n4. Add to .env file\n\nSee docs/whatsapp-setup.md')}
                  className="px-4 py-1.5 rounded-full text-[12px] font-inter font-medium transition-all bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-200">
                  Setup WhatsApp
                </button>
              ) : (
                <button onClick={() => setIntStates(prev => prev.map((s, idx) => idx === i ? !s : s))}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-inter font-medium transition-all ${intStates[i] ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-electric-violet text-white hover:opacity-90'}`}>
                  {intStates[i] ? '✓ Connected' : 'Connect'}
                </button>
              )}
            </div>
          ))}
          
          {/* WhatsApp Preview Section */}
          <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <h4 className="font-montserrat font-medium text-[14px] text-purple-900 mb-2">WhatsApp AI Assistant Preview</h4>
            <div className="space-y-2 text-[12px] text-purple-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>AI greets new customers automatically</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Handles reservations, menu questions, hours</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Sends campaign messages to leads</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team tab */}
      {activeTab === 'team' && (
        <div className="card-elevated max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="font-montserrat font-medium text-[16px] text-midnight-ink">Team Members</p>
            <button className="px-4 py-2 bg-electric-violet text-white rounded-full text-[12px] font-inter font-medium hover:opacity-90 transition-all">Invite Member</button>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Alex Rivera', email: 'alex@luxehair.studio', role: 'Owner' },
              { name: 'Jordan Kim', email: 'jordan@luxehair.studio', role: 'Manager' },
            ].map((member, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-ghost-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-electric-violet/10 rounded-full flex items-center justify-center">
                    <span className="text-[12px] font-medium text-electric-violet">{member.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-inter font-medium text-midnight-ink">{member.name}</p>
                    <p className="text-[11px] text-muted-ash">{member.email}</p>
                  </div>
                </div>
                <span className="text-[11px] bg-cloud-canvas px-3 py-1 rounded-full font-medium text-muted-ash border border-ghost-border">{member.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}