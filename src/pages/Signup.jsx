/**
 * Signup Page — Email/Password registration
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/useOrionAuth';

export default function Signup() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const result = await register(email, password, name);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-cloud-canvas flex flex-col">
      {/* Header */}
      <header className="h-[64px] bg-paper-white border-b border-ghost-border flex items-center px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-electric-violet rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-montserrat font-medium text-[18px] text-midnight-ink">Orion</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="card-elevated p-8">
            <h1 className="font-montserrat font-medium text-[24px] text-midnight-ink mb-2">Create your account</h1>
            <p className="text-[14px] text-muted-ash font-inter mb-6">Start growing your business with AI</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-inter font-medium text-midnight-ink mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[14px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-inter font-medium text-midnight-ink mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[14px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-inter font-medium text-midnight-ink mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[14px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-electric-violet text-white rounded-xl text-[14px] font-inter font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[13px] text-muted-ash font-inter">
                Already have an account?{' '}
                <Link to="/login" className="text-electric-violet hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
