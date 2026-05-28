import { useState } from 'react';
import { ArrowRight, Loader2, Smartphone } from 'lucide-react';

export default function StepPhone({ onNext }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('phone');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setStage('otp');
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    onNext({ phone });
    setLoading(false);
  };

  return (
    <div className="card-elevated border border-ghost-border p-8">
      <div className="w-12 h-12 bg-electric-violet/10 rounded-xl flex items-center justify-center mb-5">
        <Smartphone className="w-6 h-6 text-electric-violet" />
      </div>

      {stage === 'phone' ? (
        <>
          <h1 className="font-montserrat font-medium text-[24px] text-midnight-ink tracking-[-0.02em] mb-1">What's your number?</h1>
          <p className="text-[13px] text-muted-ash font-inter mb-6">We'll send a one-time code to verify it's you.</p>
          <div className="space-y-3">
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
              placeholder="+1 555 000 0000"
              type="tel"
              className="w-full bg-cloud-canvas border border-ghost-border rounded-lg px-4 py-3 text-[14px] font-inter text-midnight-ink placeholder:text-muted-ash/50 focus:outline-none focus:border-electric-violet transition-all"
            />
            <button onClick={sendOtp} disabled={!phone.trim() || loading}
              className="w-full py-3 bg-electric-violet rounded-full text-[13px] font-inter font-medium text-white hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </div>
          <div className="mt-5 pt-5 border-t border-ghost-border">
            <p className="text-[12px] text-muted-ash font-inter mb-2">Or continue with email</p>
            <button onClick={() => onNext({ phone: 'email-user' })}
              className="w-full py-2.5 bg-cloud-canvas border border-ghost-border rounded-full text-[12px] font-inter text-muted-ash hover:border-midnight-ink hover:text-midnight-ink transition-all">
              Use email instead →
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="font-montserrat font-medium text-[24px] text-midnight-ink tracking-[-0.02em] mb-1">Enter the code</h1>
          <p className="text-[13px] text-muted-ash font-inter mb-1">Sent to <span className="text-midnight-ink font-medium">{phone}</span></p>
          <p className="text-[11px] text-electric-violet font-inter mb-6">Demo mode: use any digits</p>
          <div className="space-y-3">
            <input
              value={otp}
              onChange={e => setOtp(e.target.value.slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              placeholder="· · · ·"
              maxLength={6}
              className="w-full bg-cloud-canvas border border-ghost-border rounded-lg px-4 py-3 text-[20px] font-montserrat text-midnight-ink placeholder:text-muted-ash/40 focus:outline-none focus:border-electric-violet transition-all text-center tracking-[0.3em]"
            />
            <button onClick={verifyOtp} disabled={!otp || loading}
              className="w-full py-3 bg-electric-violet rounded-full text-[13px] font-inter font-medium text-white hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Verifying…' : 'Verify & continue'}
            </button>
          </div>
          <button onClick={() => setStage('phone')} className="mt-4 text-[12px] text-muted-ash font-inter hover:text-midnight-ink transition-all">
            ← Change number
          </button>
        </>
      )}
    </div>
  );
}