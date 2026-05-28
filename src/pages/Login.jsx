/**
 * Login Page — Clerk SignIn component
 */

import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Login() {
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
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/signup"
            redirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-paper-white shadow-sm rounded-lg border border-ghost-border',
                formButtonPrimary: 'bg-electric-violet hover:bg-electric-violet/90',
                dividerLine: 'bg-ghost-border',
                dividerText: 'text-muted-ash',
                formFieldLabel: 'text-midnight-ink font-medium',
                formFieldInput: 'bg-cloud-canvas border-ghost-border text-midnight-ink',
                footerActionLink: 'text-electric-violet hover:text-electric-violet/90',
              },
            }}
          />
        </div>
      </main>
    </div>
  );
}
