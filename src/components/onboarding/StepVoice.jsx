import { useState, useRef } from 'react';
import { Mic, MicOff, ArrowRight, ArrowLeft, Loader2, Volume2 } from 'lucide-react';
import { apiPost } from '@/api/entities';
import { useAuth } from '@/lib/useOrionAuth';

export default function StepVoice({ onNext, onBack, data }) {
  const { business } = useAuth();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setTranscript('Voice not supported in this browser. Type your intro below.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    recognitionRef.current = r;
    r.onresult = (e) => setTranscript(Array.from(e.results).map(x => x[0].transcript).join(''));
    r.onend = () => { setListening(false); };
    r.start();
    setListening(true);
    setTranscript('');
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  const processVoice = async (text) => {
    setLoading(true);
    try {
      const res = await apiPost('/api/agents/chat', {
        message: `A new business owner just signed up for Orion. They said: "${text}".
Their business: ${data.businessName || 'a local business'} (${data.category || 'service business'}) in ${data.location || 'their area'}.
Write a warm, confident 2-sentence acknowledgement that shows Orion understood their business context and is ready to help. Be specific to what they said.`,
        business_id: business?.id,
      });
      const response = res?.reply || 'Welcome! Orion is ready to help grow your business.';
      setAiResponse(response);
      if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(response));
    } catch (err) {
      console.error('Voice processing failed:', err);
      setAiResponse('Welcome! Orion is ready to help grow your business.');
    }
    setLoading(false);
  };

  return (
    <div className="card-elevated border border-ghost-border p-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-muted-ash font-inter hover:text-midnight-ink mb-6 transition-all">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1 className="font-montserrat font-medium text-[24px] text-midnight-ink tracking-[-0.02em] mb-1">Tell Orion about your business</h1>
      <p className="text-[13px] text-muted-ash font-inter mb-6">
        Speak for 30 seconds — what you do, who your customers are, your biggest challenge. Orion will personalise everything to you.
      </p>

      {/* Mic */}
      <div className="flex flex-col items-center py-6">
        <button onClick={listening ? stopListening : startListening}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 ${
            listening
              ? 'bg-electric-violet border-electric-violet voice-pulse'
              : 'bg-cloud-canvas border-ghost-border hover:border-electric-violet'
          }`}>
          {listening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-electric-violet" />}
        </button>
        <p className="text-[12px] font-inter text-muted-ash mt-3">
          {listening ? 'Listening… tap to stop' : 'Tap to speak'}
        </p>
      </div>

      {/* Transcript editable */}
      {transcript && !aiResponse && (
        <div className="mb-4">
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={3}
            className="w-full bg-cloud-canvas border border-ghost-border rounded-lg px-4 py-3 text-[13px] font-inter text-midnight-ink focus:outline-none focus:border-electric-violet transition-all resize-none" />
          <button onClick={() => processVoice(transcript)} className="mt-1.5 text-[12px] text-electric-violet font-inter font-medium hover:opacity-80">
            Process this →
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-3 justify-center">
          <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-electric-violet rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div>
          <span className="text-[12px] text-muted-ash font-inter">Orion is learning your business…</span>
        </div>
      )}

      {aiResponse && (
        <div className="mb-5 p-4 bg-electric-violet/5 border border-electric-violet/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-3.5 h-3.5 text-electric-violet" />
            <span className="text-[11px] text-electric-violet font-inter font-medium">Orion understood:</span>
          </div>
          <p className="text-[13px] text-midnight-ink font-inter leading-relaxed">{aiResponse}</p>
        </div>
      )}

      <div className="space-y-2">
        <button onClick={() => onNext({ voiceIntro: transcript, aiAck: aiResponse })}
          className="w-full py-3 bg-electric-violet rounded-full text-[13px] font-inter font-medium text-white hover:opacity-90 transition-all flex items-center justify-center gap-2">
          {aiResponse ? 'See my dashboard' : 'Skip for now'} <ArrowRight className="w-3.5 h-3.5" />
        </button>
        {!aiResponse && !transcript && (
          <button onClick={() => onNext({})} className="w-full py-2.5 bg-cloud-canvas border border-ghost-border rounded-full text-[12px] font-inter text-muted-ash hover:border-midnight-ink hover:text-midnight-ink transition-all">
            Skip voice setup →
          </button>
        )}
      </div>
    </div>
  );
}