import { useState, useEffect } from 'react';
import { entities, apiPost } from '@/api/entities';
import { Share2, Sparkles, Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const platformColors = {
  instagram: 'text-pink-600 bg-pink-50',
  facebook: 'text-blue-600 bg-blue-50',
  google_business: 'text-yellow-600 bg-yellow-50',
  twitter: 'text-sky-500 bg-sky-50',
};

const statusColors = {
  draft: 'text-muted-ash bg-cloud-canvas',
  pending_approval: 'text-amber-600 bg-amber-50',
  scheduled: 'text-blue-600 bg-blue-50',
  published: 'text-green-600 bg-green-50',
  failed: 'text-red-500 bg-red-50',
};

export default function Social() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');

  const load = async () => {
    const data = await entities.SocialPost.list('-created_at', 20);
    setPosts(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const generatePosts = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await apiPost('/api/agents/run', {
        task: `Generate 3 engaging social media posts for a local hair salon about: "${topic}". Create posts for Instagram, Facebook, and Google Business. Each post should be platform-appropriate. Include relevant hashtags for Instagram.`,
        business_id: 'demo',
        skip_confirmation: true,
      });

      // Extract posts from summary or create generic posts from result
      if (res?.final_summary) {
        const platforms = ['instagram', 'facebook', 'google_business'];
        for (const platform of platforms) {
          const created = await entities.SocialPost.create({
            platform,
            content: res.final_summary?.substring(0, 200) || 'AI generated post',
            business_id: 'demo',
            ai_generated: true,
            status: 'pending_approval',
            topic,
          });
          setPosts(prev => [created, ...prev]);
        }
      }
      setTopic('');
    } catch (error) {
      console.error('Failed to generate posts:', error);
      alert('Failed to generate posts');
    }
    setGenerating(false);
  };

  const approve = async (post) => {
    await entities.SocialPost.update(post.id || post._id, { 
      status: 'scheduled', 
      scheduled_for: new Date(Date.now() + 3600000).toISOString() 
    });
    setPosts(prev => prev.map(p => (p.id === post.id || p._id === post._id) ? { ...p, status: 'scheduled' } : p));
  };

  const publish = async (post) => {
    await entities.SocialPost.update(post.id || post._id, { 
      status: 'published', 
      published_at: new Date().toISOString() 
    });
    setPosts(prev => prev.map(p => (p.id === post.id || p._id === post._id) ? { ...p, status: 'published' } : p));
  };
    
  return (
    <div className="space-y-6">
      {/* Generate bar */}
      <div className="card-elevated">
        <p className="font-montserrat font-medium text-[15px] text-midnight-ink mb-3">Generate Posts with AI</p>
        <div className="flex gap-3">
          <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && generatePosts()}
            placeholder="Topic: Summer promotion, new services, before/after, customer spotlight…"
            className="flex-1 bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-2.5 text-[13px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all" />
          <button onClick={generatePosts} disabled={generating || !topic.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-electric-violet text-white rounded-full text-[13px] font-inter font-medium hover:opacity-90 disabled:opacity-50 transition-all">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? 'Generating…' : 'Generate 3 Posts'}
          </button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {['Summer sale', 'New services', 'Customer spotlight', 'Behind the scenes', 'Tips & tricks'].map(t => (
            <button key={t} onClick={() => setTopic(t)} className="text-[11px] bg-cloud-canvas border border-ghost-border px-3 py-1 rounded-full font-inter text-muted-ash hover:border-electric-violet hover:text-electric-violet transition-all">{t}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Approval', value: posts.filter(p => p.status === 'pending_approval').length },
          { label: 'Scheduled', value: posts.filter(p => p.status === 'scheduled').length },
          { label: 'Published', value: posts.filter(p => p.status === 'published').length },
          { label: 'Total Reach', value: posts.reduce((s, p) => s + (p.reach || 0), 0).toLocaleString() },
        ].map((s, i) => (
          <div key={i} className="card-elevated">
            <p className="text-[12px] font-inter text-muted-ash">{s.label}</p>
            <p className="font-montserrat font-medium text-[24px] text-midnight-ink mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-electric-violet animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="card-elevated text-center py-16">
          <Share2 className="w-8 h-8 text-electric-violet mx-auto mb-3" />
          <p className="font-montserrat font-medium text-[16px] text-midnight-ink">No posts yet</p>
          <p className="text-[13px] text-muted-ash font-inter mt-1">Generate your first batch of AI posts above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {posts.map((post, i) => (
            <motion.div key={post.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-elevated">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${platformColors[post.platform] || 'text-muted-ash bg-cloud-canvas'}`}>{post.platform?.replace('_', ' ')}</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[post.status]}`}>{post.status?.replace('_', ' ')}</span>
                  {post.ai_generated && <span className="text-[10px] text-electric-violet flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" />AI</span>}
                </div>
                {post.topic && <span className="text-[10px] text-muted-ash font-inter">{post.topic}</span>}
              </div>
              <p className="text-[13px] font-inter text-midnight-ink leading-relaxed">{post.content}</p>
              {post.hashtags?.length > 0 && (
                <p className="text-[11px] text-electric-violet font-inter mt-2">{post.hashtags.map(h => `#${h}`).join(' ')}</p>
              )}
              {post.status === 'pending_approval' && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-ghost-border">
                  <button onClick={() => approve(post)} className="flex-1 py-2 bg-electric-violet text-white rounded-full text-[12px] font-medium hover:opacity-90 transition-all">Schedule</button>
                  <button onClick={() => publish(post)} className="flex-1 py-2 bg-midnight-ink text-white rounded-full text-[12px] font-medium hover:opacity-85 transition-all">Publish Now</button>
                </div>
              )}
              {post.status === 'published' && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-ghost-border">
                  <span className="text-[11px] text-muted-ash font-inter"><span className="text-midnight-ink font-medium">{post.likes || 0}</span> likes</span>
                  <span className="text-[11px] text-muted-ash font-inter"><span className="text-midnight-ink font-medium">{post.comments || 0}</span> comments</span>
                  <span className="text-[11px] text-muted-ash font-inter"><span className="text-midnight-ink font-medium">{post.reach || 0}</span> reach</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
);
}