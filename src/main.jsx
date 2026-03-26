// ============================================================
// main.jsx
// PURPOSE: Entry point — mounts the React app into the DOM.
//
// IMPORTANT: AuthProvider MUST wrap <App> here so that every
//            component in the tree can call useAuth().
//            If you forget this, useAuth() will throw:
//            "[useAuth] Must be used inside <AuthProvider>"
// ============================================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* AuthProvider makes user session available to all child components */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
