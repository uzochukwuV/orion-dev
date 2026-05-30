/**
 * Login Page — Email/Password authentication
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/useOrionAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
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
            <h1 className="font-montserrat font-medium text-[24px] text-midnight-ink mb-2">Welcome back</h1>
            <p className="text-[14px] text-muted-ash font-inter mb-6">Sign in to your Orion account</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••••"
                  className="w-full bg-cloud-canvas border border-ghost-border rounded-xl px-4 py-3 text-[14px] font-inter text-midnight-ink placeholder:text-muted-ash/60 focus:outline-none focus:border-electric-violet transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-electric-violet text-white rounded-xl text-[14px] font-inter font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[13px] text-muted-ash font-inter">
                Don't have an account?{' '}
                <Link to="/signup" className="text-electric-violet hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>

            {/* Demo credentials hint */}
            <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-[12px] font-inter font-medium text-purple-900 mb-1">Demo Account</p>
              <p className="text-[11px] text-purple-700 font-inter">
                Email: <span className="font-medium">demo@lacucina.pl</span>
                <br />
                Password: <span className="font-medium">password123</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
