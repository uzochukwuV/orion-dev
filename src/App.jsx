import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import AppLayout from './components/layout/AppLayout'
import { AuthProvider, useAuth } from './lib/useOrionAuth'

import Dashboard from './pages/Dashboard'
import Intelligence from './pages/Intelligence'
import Campaigns from './pages/Campaigns'
import Leads from './pages/Leads'
import Social from './pages/Social'
import Agents from './pages/Agents'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Landing from './pages/Landing'
import Onboarding from './pages/Onbaording'
import Login from './pages/Login'
import Signup from './pages/Signup'

// Loading spinner while checking auth
function AuthLoading() {
  return (
    <div className="min-h-screen bg-paper-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-electric-violet border-t-transparent rounded-full animate-spin" />
        <p className="text-[14px] text-muted-ash">Loading...</p>
      </div>
    </div>
  )
}

// Redirect logged-in users away from auth pages
function AuthRedirect({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Wrapper for protected routes that uses our auth
function ProtectedRouteContent({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Existing logged-in users go to dashboard, no forced onboarding
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes - redirect logged-in users to dashboard */}
            <Route path="/" element={<AuthRedirect><Landing /></AuthRedirect>} />
            <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
            <Route path="/signup" element={<AuthRedirect><Signup /></AuthRedirect>} />

            {/* Protected routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRouteContent>
                  <Onboarding />
                </ProtectedRouteContent>
              }
            />

            <Route
              element={
                <ProtectedRouteContent>
                  <AppLayout />
                </ProtectedRouteContent>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/intelligence" element={<Intelligence />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/social" element={<Social />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}
