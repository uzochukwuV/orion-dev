import { useState, useEffect } from 'react';
import { entities, apiPost } from '@/api/entities';
import { useAuth } from '@/lib/useOrionAuth';
import { Bot, Play, CheckCircle2, XCircle, Loader2, TrendingUp, Megaphone, Users, Share2, Mic } from 'lucide-react';
import { motion } from 'framer-motion';

const agentDefs = [
  { type: 'market_intelligence', label: 'Market Intelligence', icon: TrendingUp, desc: 'Scans competitors, pricing, trends, and local market gaps from live web data.', prompt: 'Run a comprehensive market intelligence scan. Analyze competitor pricing, review trends, service gaps, and seasonal opportunities. Provide 3-5 actionable insights.' },
  { type: 'marketing', label: 'Marketing Agent', icon: Megaphone, desc: 'Generates and optimizes marketing campaigns across email, social, and paid ads.', prompt: 'Create a complete marketing strategy for the next 30 days. Include campaign ideas, messaging, channels, and budget allocation.' },
  { type: 'sales', label: 'Sales Agent', icon: Users, desc: 'Scores leads, drafts follow-up messages, and manages your sales pipeline.', prompt: 'Review our lead pipeline and generate personalized follow-up strategies for each stage. Provide specific outreach templates.' },
  { type: 'social_media', label: 'Social Media Agent', icon: Share2, desc: 'Monitors mentions, generates posts, and manages your social presence.', prompt: 'Create a 7-day social media content calendar. Include post ideas, captions, hashtags, and optimal posting times.' },
];

export default function Agents() {
  const { business } = useAuth();
  const [runs, setRuns] = useState([]);
  const [running, setRunning] = useState({});
  const [outputs, setOutputs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    entities.AgentRun.list('-createdAt', 20).then(data => {
      setRuns(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const runAgent = async (agent) => {
    setRunning(prev => ({ ...prev, [agent.type]: true }));

    try {
      // Create agent run record
      const runRecord = await entities.AgentRun.create({
        agent_type: agent.type,
        status: 'running',
        trigger: 'manual',
        input_summary: `Manual run of ${agent.label}`
      });

      // Call our LLM API
      const res = await apiPost('/api/agents/chat', {
        message: agent.prompt,
        business_id: business?.id,
      });

      const output = res.reply || res.response || 'Completed';

      // Update run record
      await entities.AgentRun.update(runRecord.id || runRecord._id, {
        status: 'completed',
        output_summary: output.substring(0, 200),
      });

      setOutputs(prev => ({ ...prev, [agent.type]: output }));
      
      // Refresh runs list
      const updatedRuns = await entities.AgentRun.list('-createdAt', 20);
      setRuns(updatedRuns);
    } catch (error) {
      console.error('Agent run failed:', error);
    }

    setRunning(prev => ({ ...prev, [agent.type]: false }));
  };

  return (
    <div className="space-y-6">
      {/* Agent cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {agentDefs.map(agent => {
          const Icon = agent.icon;
          const isRunning = running[agent.type];
          const output = outputs[agent.type];
          return (
            <div key={agent.type} className="card-elevated">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-electric-violet/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-electric-violet" />
                  </div>
                  <div>
                    <p className="font-montserrat font-medium text-[15px] text-midnight-ink">{agent.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-electric-violet animate-pulse' : 'bg-green-500'}`} />
                      <span className="text-[11px] text-muted-ash font-inter">{isRunning ? 'Running…' : 'Ready'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => runAgent(agent)} disabled={isRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-electric-violet text-white rounded-full text-[12px] font-inter font-medium hover:opacity-90 disabled:opacity-50 transition-all">
                  {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  {isRunning ? 'Running' : 'Run Now'}
                </button>
              </div>
              <p className="text-[12px] text-muted-ash font-inter leading-relaxed">{agent.desc}</p>
              {output && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-cloud-canvas rounded-lg border border-ghost-border">
                  <p className="text-[11px] font-medium text-electric-violet mb-1.5">Last output:</p>
                  <p className="text-[12px] text-muted-ash font-inter leading-relaxed line-clamp-4">{output}</p>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Run history */}
      <div className="card-elevated">
        <p className="font-montserrat font-medium text-[15px] text-midnight-ink mb-4">Run History</p>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-electric-violet animate-spin" /></div>
        ) : runs.length === 0 ? (
          <p className="text-[13px] text-muted-ash font-inter text-center py-8">No runs yet. Click "Run Now" on any agent to start.</p>
        ) : (
          <div className="space-y-2">
            {runs.map((run, i) => (
              <div key={run.id || run._id || i} className="flex items-center gap-4 py-2.5 border-b border-ghost-border last:border-0">
                <div className="flex-shrink-0">
                  {run.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                   run.status === 'failed' ? <XCircle className="w-4 h-4 text-red-400" /> :
                   <Loader2 className="w-4 h-4 text-electric-violet animate-spin" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-inter font-medium text-midnight-ink capitalize">{run.agent_type?.replace('_', ' ')}</p>
                  {run.output_summary && <p className="text-[11px] text-muted-ash font-inter truncate">{run.output_summary}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] text-muted-ash font-inter capitalize">{run.trigger}</p>
                  {run.duration_seconds && <p className="text-[10px] text-muted-ash font-inter">{run.duration_seconds}s</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}