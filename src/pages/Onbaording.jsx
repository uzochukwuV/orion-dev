import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import StepPhone from '../components/onboarding/StepPhone';
import StepBusiness from '../components/onboarding/StepBusiness';
import StepVoice from '../components/onboarding/StepVoice';
import StepValue from '../components/onboarding/StepValue';

const STEPS = ['phone', 'business', 'voice', 'value'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const navigate = useNavigate();

  const next = (stepData = {}) => {
    setData(prev => ({ ...prev, ...stepData }));
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else navigate('/dashboard');
  };

  const back = () => setStep(s => Math.max(0, s - 1));
  const stepName = STEPS[step];

  return (
    <div className="min-h-screen bg-cloud-canvas flex flex-col">
      {/* Top bar — matches AppLayout TopBar style */}
      <header className="h-[64px] bg-paper-white border-b border-ghost-border flex items-center justify-between px-8 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-electric-violet rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-montserrat font-medium text-[18px] text-midnight-ink tracking-[-0.02em]">Orion</span>
        </Link>

        {/* Progress steps */}
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-electric-violet' : i < step ? 'w-4 bg-electric-violet/40' : 'w-4 bg-ghost-border'}`} />
          ))}
        </div>

        <p className="text-[12px] font-inter text-muted-ash">Step {step + 1} of {STEPS.length}</p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md"
          >
            {stepName === 'phone' && <StepPhone onNext={next} />}
            {stepName === 'business' && <StepBusiness onNext={next} onBack={back} />}
            {stepName === 'voice' && <StepVoice onNext={next} onBack={back} data={data} />}
            {stepName === 'value' && <StepValue onNext={next} data={data} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}