import { useState } from 'react';
import { ArrowRight, ArrowLeft, Loader2, Building2, MapPin, Briefcase } from 'lucide-react';
import { entities } from '@/api/entities';

const categories = [
  { id: 'salon', emoji: '💇', label: 'Hair Salon' },
  { id: 'gym', emoji: '🏋️', label: 'Gym / Fitness' },
  { id: 'restaurant', emoji: '🍽️', label: 'Restaurant' },
  { id: 'clinic', emoji: '🏥', label: 'Medical/Dental' },
  { id: 'law', emoji: '⚖️', label: 'Law Firm' },
  { id: 'realestate', emoji: '🏠', label: 'Real Estate' },
  { id: 'hotel', emoji: '🏨', label: 'Hotel/BnB' },
  { id: 'ecommerce', emoji: '🛒', label: 'E-commerce' },
  { id: 'agency', emoji: '💼', label: 'Agency/Freelancer' },
  { id: 'autorepair', emoji: '🔧', label: 'Auto Repair' },
];

export default function StepBusiness({ onNext, onBack }) {
  const [subStep, setSubStep] = useState(0);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [service, setService] = useState('');
  const [loading, setLoading] = useState(false);

  const goNext = async () => {
    if (subStep === 0 && name.trim()) { setSubStep(1); return; }
    if (subStep === 1 && category) { setSubStep(2); return; }
    if (subStep === 2) {
      setLoading(true);
      try {
        // Get user's email from auth context or localStorage
        const storedToken = localStorage.getItem('orion_token');
        let userEmail = '';
        
        if (storedToken) {
          try {
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            userEmail = payload.email || '';
          } catch (e) {
            console.error('Failed to parse token:', e);
          }
        }
        
        const business = await entities.Business.create({
          name, 
          type: category, 
          city: location,
          owner_email: userEmail,
          description: service, 
          onboarding_complete: true, 
          plan_status: 'trialing'
        });
        onNext({ businessName: name, category, location, service, businessId: business._id || business.id });
      } catch (error) {
        console.error('Failed to create business:', error);
        alert('Failed to set up business. Please try again.');
      }
      setLoading(false);
    }
  };

  const goBack = () => { if (subStep > 0) setSubStep(s => s - 1); else onBack(); };

  const icons = [Building2, Briefcase, MapPin];
  const Icon = icons[subStep];

  return (
    <div className="card-elevated border border-ghost-border p-8">
      <button onClick={goBack} className="flex items-center gap-1.5 text-[12px] text-muted-ash font-inter hover:text-midnight-ink mb-6 transition-all">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="w-12 h-12 bg-electric-violet/10 rounded-xl flex items-center justify-center mb-5">
        <Icon className="w-6 h-6 text-electric-violet" />
      </div>

      {subStep === 0 && (
        <>
          <h1 className="font-montserrat font-medium text-[24px] text-midnight-ink tracking-[-0.02em] mb-1">What's your business called?</h1>
          <p className="text-[13px] text-muted-ash font-inter mb-6">Just your trading name is fine.</p>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && name.trim() && goNext()}
            placeholder="e.g. Luxe Hair Studio"
            className="w-full bg-cloud-canvas border border-ghost-border rounded-lg px-4 py-3 text-[14px] font-inter text-midnight-ink placeholder:text-muted-ash/50 focus:outline-none focus:border-electric-violet transition-all mb-3" />
          <button onClick={goNext} disabled={!name.trim()}
            className="w-full py-3 bg-electric-violet rounded-full text-[13px] font-inter font-medium text-white hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            Continue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {subStep === 1 && (
        <>
          <h1 className="font-montserrat font-medium text-[24px] text-midnight-ink tracking-[-0.02em] mb-1">What kind of business?</h1>
          <p className="text-[13px] text-muted-ash font-inter mb-5">This helps Orion tailor your market scans.</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${category === cat.id ? 'bg-electric-violet border-electric-violet text-white' : 'bg-cloud-canvas border-ghost-border text-muted-ash hover:border-midnight-ink hover:text-midnight-ink'}`}>
                <span className="text-[16px]">{cat.emoji}</span>
                <span className="text-[12px] font-inter font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
          <button onClick={goNext} disabled={!category}
            className="w-full py-3 bg-electric-violet rounded-full text-[13px] font-inter font-medium text-white hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            Continue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {subStep === 2 && (
        <>
          <h1 className="font-montserrat font-medium text-[24px] text-midnight-ink tracking-[-0.02em] mb-1">Where are you based?</h1>
          <p className="text-[13px] text-muted-ash font-inter mb-6">City is enough — Orion uses this for local market scans.</p>
          <div className="space-y-3 mb-4">
            <input value={location} onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Austin, TX"
              className="w-full bg-cloud-canvas border border-ghost-border rounded-lg px-4 py-3 text-[14px] font-inter text-midnight-ink placeholder:text-muted-ash/50 focus:outline-none focus:border-electric-violet transition-all" />
            <input value={service} onChange={e => setService(e.target.value)}
              placeholder="Main service (e.g. Haircuts, Plumbing…)"
              className="w-full bg-cloud-canvas border border-ghost-border rounded-lg px-4 py-3 text-[14px] font-inter text-midnight-ink placeholder:text-muted-ash/50 focus:outline-none focus:border-electric-violet transition-all" />
          </div>
          <button onClick={goNext} disabled={!location.trim() || loading}
            className="w-full py-3 bg-electric-violet rounded-full text-[13px] font-inter font-medium text-white hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            {loading ? 'Setting up…' : 'Set up my business'}
          </button>
        </>
      )}
    </div>
  );
}