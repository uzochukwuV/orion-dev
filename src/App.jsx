import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import PageNotFound from './lib/PageNotFound'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

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

// Clerk callback pages
function SignInCallback() {
  const { isSignedIn } = useAuth()
  if (isSignedIn) return <Navigate to="/dashboard" replace />
  return <Login />
}

function SignUpCallback() {
  const { isSignedIn } = useAuth()
  if (isSignedIn) return <Navigate to="/onboarding" replace />
  return <Signup />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Clerk callback routes */}
          <Route path="/login/sso-callback" element={<SignInCallback />} />
          <Route path="/signup/sso-callback" element={<SignUpCallback />} />
          <Route path="signup/continue" element={<SignUpCallback />} />

          {/* Protected routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
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
    </QueryClientProvider>
  )
}
