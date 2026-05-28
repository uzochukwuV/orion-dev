import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from '@/App.jsx'
import '@/index.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// If no key, show setup message
if (!clerkPubKey) {
  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px',
      backgroundColor: '#f5f5f5',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>⚠️ Setup Required</h1>
        <p>Missing Clerk publishable key</p>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          Create file: <code>src/.env.local</code>
        </p>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '15px', 
          borderRadius: '5px',
          textAlign: 'left',
          border: '1px solid #ddd',
          marginTop: '20px',
          maxWidth: '500px'
        }}>
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
        </pre>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '15px' }}>
          Get your key at: <a href="https://dashboard.clerk.com" target="_blank">Clerk Dashboard</a>
        </p>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
          Then restart: <code>npm run dev</code>
        </p>
      </div>
    </div>
  )
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={clerkPubKey}>
        <App />
      </ClerkProvider>
    </React.StrictMode>
  )
}
